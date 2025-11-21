import { useState } from 'react';
import { UserLayout } from '@/components/layouts/UserLayout';
import { Dashboard } from '@/components/Dashboard';
import { SalesForm } from '@/components/SalesForm';
import { SalesHistory } from '@/components/SalesHistory';

export function UserDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleSaleAdded = () => {
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'new-sale':
        return <SalesForm onSaleAdded={handleSaleAdded} />;
      case 'stats':
        return <SalesHistory />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Navigation tabs */}
        <div className="flex gap-4 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tableau de bord
          </button>
          <button
            onClick={() => setActiveTab('new-sale')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'new-sale'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Nouvelle vente
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'stats'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mes statistiques
          </button>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </UserLayout>
  );
}
