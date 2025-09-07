import { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseSales } from "@/hooks/useSupabaseSales";
import { LoginPage } from "@/components/auth/LoginPage";
import { ProfileSetup } from "@/components/auth/ProfileSetup";
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
  const { isAuthenticated, profile, loading: authLoading } = useSupabaseAuth();
  const { stats, loading: statsLoading, refreshStats } = useSupabaseSales();
  const isMobile = useResponsive();

  // Loading state
  if (authLoading) {
    return (
      <div className={`${isMobile ? 'mobile-container' : 'min-h-screen'} flex items-center justify-center ${isMobile ? '' : 'p-4'}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Profile setup needed
  if (!profile) {
    return <ProfileSetup />;
  }

  const handleSaleAdded = () => {
    refreshStats();
    setCurrentTab("dashboard");
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return (
          <div>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : isMobile ? (
              <MobileDashboard stats={stats} />
            ) : (
              <DesktopDashboard stats={stats} />
            )}
          </div>
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
        return profile.role === "admin" ? (
          <CommissionManager />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Accès administrateur requis
          </div>
        );

      case "users":
        return profile.role === "admin" ? (
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
      isAdmin={profile.role === "admin"}
    >
      {renderTabContent()}
    </Layout>
  );
};

export default ResponsiveApp;