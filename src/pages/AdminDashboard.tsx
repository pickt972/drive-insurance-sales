import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Dashboard } from '@/components/Dashboard';
import { SalesHistory } from '@/components/SalesHistory';
import { AdminPanel } from '@/components/AdminPanel';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'sales':
        return <SalesHistory />;
      case 'users':
        return <AdminPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Navigation tabs */}
        <div className="flex gap-4 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'dashboard'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'sales'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Toutes les ventes
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'users'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Gestion des utilisateurs
          </button>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </AdminLayout>
  );
}
