import React, { useState } from 'react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { FirebaseSalesForm } from '@/components/sales/FirebaseSalesForm';
import { SalesHistory } from '@/components/sales/SalesHistory';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { ObjectivesManager } from '@/components/objectives/ObjectivesManager';
import { useFirebaseSales } from '@/hooks/useFirebaseSales';

import { TabType } from '@/types/tabs';

const HomePage: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const { stats, allSales, loading, refreshStats } = useFirebaseSales();

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
  };

  const handleSaleAdded = () => {
    refreshStats();
    setCurrentTab('dashboard');
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard sales={allSales} loading={loading} />;
      case 'sales':
        return <FirebaseSalesForm onSaleAdded={handleSaleAdded} />;
      case 'history':
        return <SalesHistory sales={allSales} loading={loading} onSaleDeleted={refreshStats} />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <div>Accès non autorisé</div>;
      case 'objectives':
        return <ObjectivesManager />;
      default:
        return <Dashboard sales={allSales} loading={loading} />;
    }
  };

  // Affiche l'app même si le profil n'est pas encore chargé (évite le blocage sur erreurs Supabase)
  // if (!profile) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
  //     </div>
  //   );
  // }

  const LayoutComponent = isMobile ? MobileLayout : DesktopLayout;

  return (
    <LayoutComponent
      currentTab={currentTab}
      onTabChange={handleTabChange}
      isAdmin={isAdmin}
    >
      {renderContent()}
    </LayoutComponent>
  );
};

export default HomePage;