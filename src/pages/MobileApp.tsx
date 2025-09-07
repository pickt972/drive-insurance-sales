import { useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseSales } from "@/hooks/useSupabaseSales";
import { LoginPage } from "@/components/auth/LoginPage";
import { ProfileSetup } from "@/components/auth/ProfileSetup";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { MobileDashboard } from "@/components/dashboard/MobileDashboard";
import { MobileSalesForm } from "@/components/sales/MobileSalesForm";
import { SalesTable } from "@/components/SalesTable";
import { CommissionManager } from "@/components/CommissionManager";
import { UserManager } from "@/components/UserManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Loader2 } from "lucide-react";

const MobileApp = () => {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const { isAuthenticated, profile, loading: authLoading } = useSupabaseAuth();
  const { stats, loading: statsLoading, refreshStats } = useSupabaseSales();

  // Loading state
  if (authLoading) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen">
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
            ) : (
              <MobileDashboard stats={stats} />
            )}
          </div>
        );

      case "add":
        return <MobileSalesForm onSaleAdded={handleSaleAdded} />;

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
        return (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5 text-primary" />
                Export & Sauvegarde
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fonctionnalité en cours de développement</p>
                <p className="text-xs mt-2">Export CSV/PDF et sauvegarde Google Drive</p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return <MobileDashboard stats={stats} />;
    }
  };

  return (
    <MobileLayout 
      currentTab={currentTab} 
      onTabChange={setCurrentTab}
      isAdmin={profile.role === "admin"}
    >
      {renderTabContent()}
    </MobileLayout>
  );
};

export default MobileApp;