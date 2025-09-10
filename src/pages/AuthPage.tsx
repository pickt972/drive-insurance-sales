import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginPage } from "@/components/auth/LoginPage";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useSupabaseAuth();
  
  // Rediriger si déjà connecté
  useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Si déjà connecté, ne pas afficher la page de connexion
  if (user && !loading) {
    return null;
  }

  return <LoginPage />;
};

export default AuthPage;