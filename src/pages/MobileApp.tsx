import { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseSales } from "@/hooks/useSupabaseSales";
import { useNavigate } from "react-router-dom";
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
import { ObjectiveManager } from "@/components/objectives/ObjectiveManager";
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
  const { user, isAuthenticated, isAdmin, profile, loading: authLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  const { stats, allSales, loading, refreshStats, deleteSale } = useSupabaseSales();
  const isMobile = useResponsive();

  // Debug logs
  useEffect(() => {
    console.log('ResponsiveApp Debug:', {
      user: user ? { id: user.id, username: user.user_metadata?.username } : null,
      isAuthenticated,
      profile,
      authLoading,
      isAdmin
    });
  }, [user, isAuthenticated, profile, authLoading, isAdmin]);

  // Not authenticated - redirect to auth page
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  // Show loading during auth initialization
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) return null;

  const handleSaleAdded = () => {
    refreshStats(); // Refresh data after adding a sale
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
        return loading ? (
          <Card className="shadow-card">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <SalesTable 
            sales={allSales}
            onDeleteSale={async (saleId) => {
              const result = await deleteSale(saleId);
              if (result?.success) {
                refreshStats();
              }
            }}
          />
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
        return <ExportPanel sales={allSales} />;
        
      case "objectives":
        return <ObjectiveManager />;

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