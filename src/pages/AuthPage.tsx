import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FirebaseAuthPage } from "@/components/auth/FirebaseAuthPage";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useFirebaseAuth();
  
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

  return <FirebaseAuthPage />;
};

export default AuthPage;