import { BarChart3, Plus, FileText, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileBottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
}

export const MobileBottomNav = ({ currentTab, onTabChange, isAdmin }: MobileBottomNavProps) => {
  const tabs = [
    { id: 'dashboard', icon: BarChart3, label: 'Tableau' },
    { id: 'add', icon: Plus, label: 'Nouvelle' },
    { id: 'sales', icon: FileText, label: 'Historique' },
    ...(isAdmin ? [
      { id: 'admin', icon: Settings, label: 'Admin' },
      { id: 'users', icon: Users, label: 'Équipe' }
    ] : [])
  ];

  return (
    <nav className="mobile-bottom-nav">
      <div className="flex items-center justify-around p-2">
        {tabs.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant={currentTab === id ? "default" : "ghost"}
            size="sm"
            onClick={() => onTabChange(id)}
            className={`flex flex-col gap-1 h-auto py-2 px-3 ${
              currentTab === id 
                ? 'bg-primary text-primary-foreground shadow-primary' 
                : 'text-muted-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
};