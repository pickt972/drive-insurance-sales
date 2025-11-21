import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoginPage } from '@/pages/LoginPage';
import { UserDashboard } from '@/pages/UserDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const App = () => {
  return (
    <TooltipProvider>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Route dashboard utilisateur */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Route dashboard admin */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirection par défaut vers login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </TooltipProvider>
  );
};

export default App;