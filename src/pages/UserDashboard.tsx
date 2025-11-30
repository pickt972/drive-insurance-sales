import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLayout } from '@/components/layouts/UserLayout';
import { Dashboard } from '@/components/Dashboard';
import { SalesForm } from '@/components/SalesForm';
import { SalesHistory } from '@/components/SalesHistory';
import { useAuth } from '@/hooks/useAuth';
import { Home, PlusCircle, BarChart } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export function UserDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  // Rediriger les admins vers l'interface admin
  useEffect(() => {
    console.log('👤 [UserDashboard] Check:', { isAdmin, loading });
    if (!loading && isAdmin) {
      console.log('⚠️ [UserDashboard] Admin détecté, redirection vers /admin');
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, loading, navigate]);

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
