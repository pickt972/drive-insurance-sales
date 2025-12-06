import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from '@/pages/LoginPage';
import { UserDashboard } from '@/pages/UserDashboard';
import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import { AdminSalesPage } from '@/pages/admin/AdminSalesPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminInsuranceTypesPage } from '@/pages/admin/AdminInsuranceTypesPage';
import { AdminObjectivesPage } from '@/pages/admin/AdminObjectivesPage';
import { AdminBonusesPage } from '@/pages/admin/AdminBonusesPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminArgumentsPage } from '@/pages/admin/AdminArgumentsPage';
import { AdminFAQPage } from '@/pages/admin/AdminFAQPage';
import { AdminNewSalePage } from '@/pages/admin/AdminNewSalePage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { AuthProvider } from '@/hooks/useAuth';

const App = () => {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Route dashboard utilisateur */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<UserDashboard />} />
          </Route>
          
          {/* Routes admin avec layout */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="new-sale" element={<AdminNewSalePage />} />
              <Route path="sales" element={<AdminSalesPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="insurance-types" element={<AdminInsuranceTypesPage />} />
              <Route path="objectives" element={<AdminObjectivesPage />} />
              <Route path="bonuses" element={<AdminBonusesPage />} />
              <Route path="bonus-rules" element={<AdminBonusesPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="arguments" element={<AdminArgumentsPage />} />
              <Route path="faq" element={<AdminFAQPage />} />
            </Route>
          </Route>
          
          {/* Redirection par défaut vers login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  );
};

export default App;
