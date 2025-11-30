import { useAuth } from '@/hooks/useAuth';
import { useRealtimeSales } from '@/hooks/useRealtimeSales';
import { StatsCards } from '@/components/Dashboard/StatsCards';
import { SalesChart } from '@/components/Dashboard/SalesChart';
import { InsuranceTypesChart } from '@/components/Dashboard/InsuranceTypesChart';
import { ComparisonChart } from '@/components/Dashboard/ComparisonChart';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { SalesForm } from './SalesForm';
import { SalesHistory } from './SalesHistory';

export const Dashboard = () => {
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Écouter les nouvelles ventes en temps réel
  useRealtimeSales(() => {
    setRefreshKey(prev => prev + 1);
  });

  const username = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || '';

  const handleSaleAdded = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header avec animation */}
      <div className="modern-card p-6 bg-gradient-to-br from-primary/5 via-card to-info/5 animate-gentle-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-info to-primary-variant bg-clip-text text-transparent">
              Bonjour, {username} 👋
            </h1>
            <p className="text-muted-foreground text-lg">Voici vos performances du jour</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="modern-button h-12 px-6"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            {showForm ? 'Masquer' : 'Nouvelle vente'}
          </Button>
        </div>
      </div>

      {/* Formulaire (si affiché) avec animation */}
      {showForm && (
        <div className="animate-smooth-scale-in">
          <SalesForm onSaleAdded={handleSaleAdded} />
        </div>
      )}

      {/* Statistiques avec animation en cascade */}
      <div className="animate-elegant-slide" style={{ animationDelay: '0.1s' }}>
        <StatsCards />
      </div>

      {/* Graphique principal avec animation */}
      <div className="animate-elegant-slide" style={{ animationDelay: '0.2s' }}>
        <SalesChart />
      </div>

      {/* Graphiques avancés avec animation */}
      <div className="grid gap-6 md:grid-cols-2 animate-elegant-slide" style={{ animationDelay: '0.3s' }}>
        <InsuranceTypesChart />
        <ComparisonChart />
      </div>

      {/* Historique avec animation */}
      <div className="animate-elegant-slide" style={{ animationDelay: '0.4s' }}>
        <SalesHistory key={refreshKey} />
      </div>
    </div>
  );
};
