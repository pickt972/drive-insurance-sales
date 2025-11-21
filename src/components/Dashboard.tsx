import { useAuth } from '@/hooks/useAuth';
import { StatsCards } from '@/components/Dashboard/StatsCards';
import { SalesChart } from '@/components/Dashboard/SalesChart';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { SalesForm } from './SalesForm';
import { SalesHistory } from './SalesHistory';

export const Dashboard = () => {
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const username = profile?.full_name || profile?.email?.split('@')[0] || '';

  const handleSaleAdded = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bonjour, {username} 👋</h1>
          <p className="text-muted-foreground">Voici vos performances</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {showForm ? 'Masquer' : 'Nouvelle vente'}
        </Button>
      </div>

      {/* Formulaire (si affiché) */}
      {showForm && (
        <SalesForm onSaleAdded={handleSaleAdded} />
      )}

      {/* Statistiques */}
      <StatsCards />

      {/* Graphique */}
      <SalesChart />

      {/* Historique */}
      <SalesHistory key={refreshKey} />
    </div>
  );
};
