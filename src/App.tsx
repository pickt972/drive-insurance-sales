import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/FirebaseAuthContext";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/AuthPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";


const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
