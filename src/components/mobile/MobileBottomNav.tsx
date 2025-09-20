import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Plus, 
  Clock, 
  Settings, 
  Target 
} from 'lucide-react';
import { TabType } from '@/pages/HomePage';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdmin: boolean;
}

interface NavItem {
  id: TabType;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: BarChart3, label: 'Tableau' },
  { id: 'sales', icon: Plus, label: 'Vente' },
  { id: 'history', icon: Clock, label: 'Historique' },
  { id: 'objectives', icon: Target, label: 'Objectifs' },
  { id: 'admin', icon: Settings, label: 'Admin', adminOnly: true },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  isAdmin
}) => {
  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="mobile-bottom-nav">
      <div className="flex justify-around items-center h-16">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "flex flex-col items-center space-y-1 h-14 px-3",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className={cn(
                "h-5 w-5",
                isActive && "text-primary"
              )} />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};