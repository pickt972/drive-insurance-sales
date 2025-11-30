import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, isAdmin, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('🛡️ ProtectedRoute check:', {
      path: location.pathname,
      requireAdmin,
      user: user?.email,
      profile: profile?.role,
      isAdmin,
      loading,
    });
  }, [user, profile, isAdmin, loading, location, requireAdmin]);

  // Afficher loader pendant la vérification ET si profil pas encore chargé
  if (loading || (user && !profile)) {
    console.log('⏳ ProtectedRoute: Waiting for profile to load...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers login si pas connecté
  if (!user) {
    console.log('❌ ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rediriger vers dashboard user si route admin sans être admin
  if (requireAdmin && !isAdmin) {
    console.log('❌ ProtectedRoute: Access denied - Not admin, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ ProtectedRoute: Access granted');
  return <>{children}</>;
}
