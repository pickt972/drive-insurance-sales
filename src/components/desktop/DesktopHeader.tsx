import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TabType } from '@/types/tabs';
import { Badge } from '@/components/ui/badge';

interface DesktopHeaderProps {
  currentTab: TabType;
}

const tabTitles: Record<TabType, string> = {
  dashboard: 'Tableau de bord',
  sales: 'Nouvelle vente',
  history: 'Historique des ventes',
  admin: 'Administration',
  objectives: 'Gestion des objectifs',
  add: 'Nouvelle vente',
  users: 'Gestion des utilisateurs',
  export: 'Export des données'
};

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({ currentTab }) => {
  const { signOut, profile } = useAuth();

  return (
    <header className="border-b bg-background p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {tabTitles[currentTab]}
          </h1>
          <p className="text-muted-foreground text-sm">
            Interface de gestion des ventes d'assurance
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{profile?.username}</span>
            <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
              {profile?.role}
            </Badge>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Déconnexion</span>
          </Button>
        </div>
      </div>
    </header>
  );
};