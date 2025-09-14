import { BarChart3, Plus, FileText, Settings, Users, Download, MoreHorizontal, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MobileBottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
}

export const MobileBottomNav = ({ currentTab, onTabChange, isAdmin }: MobileBottomNavProps) => {
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  
  // Onglets principaux toujours visibles
  const mainTabs = [
    { id: 'dashboard', icon: BarChart3, label: 'Tableau' },
    { id: 'add', icon: Plus, label: 'Nouvelle' },
    { id: 'objectives', icon: Target, label: 'Objectifs' },
    { id: 'sales', icon: FileText, label: 'Historique' }
  ];

  // Onglets admin dans le menu extensible
  const adminTabs = [
    { id: 'export', icon: Download, label: 'Export' },
    { id: 'admin', icon: Settings, label: 'Admin' },
    { id: 'users', icon: Users, label: 'Équipe' }
  ];

  const isAdminTabActive = adminTabs.some(tab => tab.id === currentTab);

  return (
    <nav className="mobile-bottom-nav" style={{ zIndex: 9999 }}>
      <div className="flex items-center justify-around p-3 min-h-[64px]">
        {mainTabs.map(({ id, icon: Icon, label }) => (
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
        
        {isAdmin && (
          <Popover open={isAdminMenuOpen} onOpenChange={setIsAdminMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={isAdminTabActive ? "default" : "ghost"}
                size="sm"
                className={`flex flex-col gap-1 h-auto py-2 px-3 ${
                  isAdminTabActive 
                    ? 'bg-primary text-primary-foreground shadow-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="text-xs font-medium">Plus</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="center" side="top">
              <div className="flex flex-col gap-1">
                {adminTabs.map(({ id, icon: Icon, label }) => (
                  <Button
                    key={id}
                    variant={currentTab === id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      onTabChange(id);
                      setIsAdminMenuOpen(false);
                    }}
                    className="justify-start gap-2 h-auto py-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{label}</span>
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </nav>
  );
};