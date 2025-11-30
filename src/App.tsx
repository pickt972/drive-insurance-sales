import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoginPage } from '@/pages/LoginPage';
import { UserDashboard } from '@/pages/UserDashboard';
import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import { AdminSalesPage } from '@/pages/admin/AdminSalesPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminInsuranceTypesPage } from '@/pages/admin/AdminInsuranceTypesPage';
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
        
        {/* Routes admin avec layout */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="sales" element={<AdminSalesPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="insurance-types" element={<AdminInsuranceTypesPage />} />
          <Route path="objectives" element={<div className="p-8 text-center text-gray-500">Page Objectifs - En cours de développement</div>} />
          <Route path="bonuses" element={<div className="p-8 text-center text-gray-500">Page Primes & Bonus - En cours de développement</div>} />
          <Route path="bonus-rules" element={<div className="p-8 text-center text-gray-500">Page Règles de bonus - En cours de développement</div>} />
          <Route path="reports" element={<div className="p-8 text-center text-gray-500">Page Rapports - En cours de développement</div>} />
          <Route path="audit-logs" element={<div className="p-8 text-center text-gray-500">Page Journal d'audit - En cours de développement</div>} />
          <Route path="settings" element={<div className="p-8 text-center text-gray-500">Page Paramètres - En cours de développement</div>} />
        </Route>
        
        {/* Redirection par défaut vers login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </TooltipProvider>
  );
};

export default App;