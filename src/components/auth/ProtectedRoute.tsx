import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🛡️ ProtectedRoute check:', {
        path: location.pathname,
        requireAdmin,
        user: user?.email,
        isAdmin,
        loading,
      });
    }
  }, [user, isAdmin, loading, location, requireAdmin]);

  // Afficher loader pendant la vérification
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Rediriger vers login si pas connecté
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rediriger vers dashboard user si route admin sans être admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
