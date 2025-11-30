import { useState } from 'react';
import { UserLayout } from '@/components/layouts/UserLayout';
import { Dashboard } from '@/components/Dashboard';
import { SalesForm } from '@/components/SalesForm';
import { SalesHistory } from '@/components/SalesHistory';
import { Home, PlusCircle, BarChart } from 'lucide-react';

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
      <div className="space-y-6 animate-gentle-fade-in">
        {/* Navigation tabs moderne */}
        <div className="modern-card p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-button flex-1 ${
                activeTab === 'dashboard' ? 'active' : ''
              }`}
            >
              <Home className="mr-2 h-4 w-4" />
              <span className="font-semibold">Tableau de bord</span>
            </button>
            <button
              onClick={() => setActiveTab('new-sale')}
              className={`nav-button flex-1 ${
                activeTab === 'new-sale' ? 'active' : ''
              }`}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="font-semibold">Nouvelle vente</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`nav-button flex-1 ${
                activeTab === 'stats' ? 'active' : ''
              }`}
            >
              <BarChart className="mr-2 h-4 w-4" />
              <span className="font-semibold">Statistiques</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="animate-smooth-scale-in">
          {renderContent()}
        </div>
      </div>
    </UserLayout>
  );
}
