import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { useFirebase } from "@/hooks/useFirebase";
import { AuthPage } from "@/components/AuthPage";
import { Dashboard } from "@/components/Dashboard";
import { SalesForm } from "@/components/SalesForm";
import { SalesHistory } from "@/components/SalesHistory";
import { AdminPanel } from "@/components/AdminPanel";
import { Layout } from "@/components/Layout";

const App = () => {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const { user, loading, stats, sales } = useFirebase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <TooltipProvider>
        <Toaster />
        <AuthPage />
      </TooltipProvider>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <Dashboard stats={stats} />;
      case "sales":
        return <SalesForm onSaleAdded={() => setCurrentTab("dashboard")} />;
      case "history":
        return <SalesHistory sales={sales} />;
      case "admin":
        return <AdminPanel />;
      default:
        return <Dashboard stats={stats} />;
    }
  };

  return (
    <TooltipProvider>
      <Toaster />
      <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
        {renderContent()}
      </Layout>
    </TooltipProvider>
  );
};

export default App;