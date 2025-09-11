import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthPage as SupabaseAuthPage } from "@/components/auth/AuthPage";
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

  return <SupabaseAuthPage />;
};

export default AuthPage;