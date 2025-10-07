import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthPage as AuthPageComponent } from "@/components/AuthPage";
import { useAuth } from "@/contexts/AuthContext";

const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
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

  return <AuthPageComponent />;
};

export default AuthPage;
