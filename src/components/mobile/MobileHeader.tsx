import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Car, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TabType } from '@/pages/HomePage';

interface MobileHeaderProps {
  currentTab: TabType;
}

const tabTitles: Record<TabType, string> = {
  dashboard: 'Tableau de bord',
  sales: 'Nouvelle vente',
  history: 'Historique',
  admin: 'Administration',
  objectives: 'Objectifs'
};

export const MobileHeader: React.FC<MobileHeaderProps> = ({ currentTab }) => {
  const { signOut, profile } = useAuth();

  return (
    <header className="mobile-header bg-primary text-primary-foreground p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Car className="h-6 w-6" />
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg">AloeLocation</h1>
            <p className="text-xs text-primary-foreground/80">
              {profile?.username} • {profile?.role}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
      <div className="mt-3">
        <h2 className="text-xl font-semibold">{tabTitles[currentTab]}</h2>
      </div>
    </header>
  );
};