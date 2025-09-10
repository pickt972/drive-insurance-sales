import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSalesData } from "@/hooks/useSalesData";
import { LoginForm } from "@/components/LoginForm";
import { AuthPage } from "@/components/auth/AuthPage";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { DesktopLayout } from "@/components/desktop/DesktopLayout";
import { MobileDashboard } from "@/components/dashboard/MobileDashboard";
import { DesktopDashboard } from "@/components/dashboard/DesktopDashboard";
import { MobileSalesForm } from "@/components/sales/MobileSalesForm";
import { DesktopSalesForm } from "@/components/sales/DesktopSalesForm";
import { SalesTable } from "@/components/SalesTable";
import { CommissionManager } from "@/components/CommissionManager";
import { UserManager } from "@/components/UserManager";
import { ExportPanel } from "@/components/ExportPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Loader2 } from "lucide-react";

const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
};

const ResponsiveApp = () => {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const { currentUser, users, login, isAuthenticated, isAdmin } = useAuth();
  const { user, profile, loading, isAuthenticated: supabaseAuth, signOut } = useSupabaseAuth();
  const { sales, addSale, getStats } = useSalesData();
  const isMobile = useResponsive();
  
  const salesStats = getStats();
  
  // Convert SalesStats to DashboardStats format
  const stats = {
    totalSales: salesStats.totalSales,
    totalCommission: salesStats.totalCommissions,
    salesThisWeek: salesStats.totalSales, // Simplified for now
    topSellers: Object.entries(salesStats.commissionsByEmployee)
      .map(([name, commission]) => ({ 
        employee_name: name, 
        sales_count: salesStats.salesByEmployee[name] || 0,
        total_commission: commission 
      }))
      .sort((a, b) => b.total_commission - a.total_commission),
    recentSales: sales.slice(0, 10).map(sale => ({
      id: sale.id,
      employee_id: sale.employeeName,
      client_name: sale.clientName,
      client_email: undefined,
      client_phone: undefined,
      reservation_number: sale.reservationNumber,
      insurance_type_id: "1",
      commission_amount: sale.commissions,
      notes: undefined,
      status: 'active' as const,
      created_at: new Date(sale.timestamp).toISOString(),
      updated_at: new Date(sale.timestamp).toISOString(),
      employee_name: sale.employeeName,
      insurance_name: sale.insuranceTypes.join(", ")
    })),
    weeklyEvolution: [] // Simplified for now
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  // Not authenticated with Supabase - show auth page
  if (!supabaseAuth) {
    return <AuthPage />;
  }

  // Profile required after auth
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Configuration du profil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p>Configuration de votre profil en cours...</p>
              <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaleAdded = () => {
    setCurrentTab("dashboard");
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return isMobile ? (
          <MobileDashboard stats={stats} />
        ) : (
          <DesktopDashboard stats={stats} />
        );

      case "add":
        return isMobile ? (
          <MobileSalesForm onSaleAdded={handleSaleAdded} />
        ) : (
          <DesktopSalesForm onSaleAdded={handleSaleAdded} />
        );

      case "sales":
        return (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Historique des Ventes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fonctionnalité en cours de développement</p>
              </div>
            </CardContent>
          </Card>
        );

      case "admin":
        return isAdmin ? (
          <CommissionManager />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Accès administrateur requis
          </div>
        );

      case "users":
        return isAdmin ? (
          <UserManager />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Accès administrateur requis
          </div>
        );

      case "export":
        return <ExportPanel sales={stats.recentSales} />;

      default:
        return isMobile ? <MobileDashboard stats={stats} /> : <DesktopDashboard stats={stats} />;
    }
  };

  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <Layout 
      currentTab={currentTab} 
      onTabChange={setCurrentTab}
      isAdmin={isAdmin}
    >
      {renderTabContent()}
    </Layout>
  );
};

export default ResponsiveApp;