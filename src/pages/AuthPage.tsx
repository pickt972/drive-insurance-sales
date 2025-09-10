import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginPage } from "@/components/auth/LoginPage";
import { InitializeUsers } from "@/components/InitializeUsers";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSupabaseAuth();
  
  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Si déjà connecté, ne pas afficher la page de connexion
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <InitializeUsers />
        <LoginPage />
      </div>
    </div>
  );
};

export default AuthPage;