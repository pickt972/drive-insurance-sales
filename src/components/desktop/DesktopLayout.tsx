import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface DesktopLayoutProps {
  children: ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
}

export const DesktopLayout = ({ children, currentTab, onTabChange, isAdmin }: DesktopLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          currentTab={currentTab} 
          onTabChange={onTabChange}
          isAdmin={isAdmin}
        />
        
        <div className="flex-1 flex flex-col">
          {/* Header avec trigger */}
          <header className="h-14 border-b bg-card flex items-center px-4 sticky top-0 z-40">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">
                {currentTab === 'dashboard' && 'Tableau de bord'}
                {currentTab === 'add' && 'Nouvelle vente'}
                {currentTab === 'sales' && 'Historique des ventes'}
                {currentTab === 'export' && 'Export & Sauvegarde'}
                {currentTab === 'admin' && 'Gestion des commissions'}
                {currentTab === 'users' && 'Gestion des utilisateurs'}
              </h1>
            </div>
          </header>
          
          {/* Contenu principal */}
          <main className="flex-1 p-6 bg-background overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};