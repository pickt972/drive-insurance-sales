import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SalesForm } from "@/components/SalesForm";
import { SalesTable } from "@/components/SalesTable";
import { Dashboard } from "@/components/Dashboard";
import { ExportPanel } from "@/components/ExportPanel";
import { LoginForm } from "@/components/LoginForm";
import { CommissionManager } from "@/components/CommissionManager";
import { useSalesData } from "@/hooks/useSalesData";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, FileText, Plus, Download, Car, LogOut, Settings, User } from "lucide-react";

const Index = () => {
  const { sales, addSale, deleteSale, getStats } = useSalesData();
  const { currentUser, isAuthenticated, isAdmin, login, logout, users } = useAuth();
  const stats = getStats();

  if (!isAuthenticated) {
    return (
      <LoginForm 
        onLogin={login}
        usernames={users.map(u => u.username)}
      />
    );
  }

  const userSales = isAdmin ? sales : sales.filter(sale => sale.employeeName === currentUser?.username);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Gestion Assurances Location</h1>
                <p className="text-muted-foreground">Suivi des ventes d'assurances complémentaires</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium">{currentUser?.username}</span>
                {isAdmin && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                    Admin
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5 lg:w-[750px]' : 'grid-cols-4 lg:w-[600px]'}`}>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Tableau de bord</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle vente</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Historique</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard stats={stats} />
          </TabsContent>

          <TabsContent value="add" className="space-y-6">
            <SalesForm 
              onAddSale={addSale} 
              currentUser={currentUser?.username}
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <SalesTable sales={userSales} onDeleteSale={deleteSale} />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <ExportPanel sales={userSales} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <CommissionManager />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
