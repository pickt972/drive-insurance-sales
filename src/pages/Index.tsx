import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesForm } from "@/components/SalesForm";
import { SalesTable } from "@/components/SalesTable";
import { Dashboard } from "@/components/Dashboard";
import { ExportPanel } from "@/components/ExportPanel";
import { useSalesData } from "@/hooks/useSalesData";
import { BarChart3, FileText, Plus, Download, Car } from "lucide-react";

const Index = () => {
  const { sales, addSale, deleteSale, getStats } = useSalesData();
  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gestion Assurances Location</h1>
              <p className="text-muted-foreground">Suivi des ventes d'assurances complémentaires</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
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
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard stats={stats} />
          </TabsContent>

          <TabsContent value="add" className="space-y-6">
            <SalesForm onAddSale={addSale} />
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <SalesTable sales={sales} onDeleteSale={deleteSale} />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <ExportPanel sales={sales} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
