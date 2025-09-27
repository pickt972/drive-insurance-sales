import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, ChartBar as BarChart3, Plus, Clock, Settings } from "lucide-react";
import { useFirebase } from "@/hooks/useFirebase";

interface LayoutProps {
  children: ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout = ({ children, currentTab, onTabChange }: LayoutProps) => {
  const { profile, signOut, isAdmin } = useFirebase();

  const tabs = [
    { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
    { id: "sales", label: "Nouvelle vente", icon: Plus },
    { id: "history", label: "Historique", icon: Clock },
    ...(isAdmin ? [{ id: "admin", label: "Administration", icon: Settings }] : [])
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Aloe Location</h1>
            <p className="text-sm text-muted-foreground">Gestion des ventes d'assurances</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">{profile?.username} ({profile?.role})</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 border-r bg-card p-4">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={currentTab === tab.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => onTabChange(tab.id)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};