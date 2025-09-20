import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { SalesForm } from '@/components/sales/SalesForm';
import { SalesHistory } from '@/components/sales/SalesHistory';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { ObjectivesManager } from '@/components/objectives/ObjectivesManager';
import { useSalesData } from '@/hooks/useSalesData';

import { TabType } from '@/types/tabs';

const HomePage: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const { sales, loading, refreshSales } = useSalesData();

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard sales={sales} loading={loading} />;
      case 'sales':
        return <SalesForm onSaleAdded={refreshSales} />;
      case 'history':
        return <SalesHistory sales={sales} loading={loading} onSaleDeleted={refreshSales} />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <div>Accès non autorisé</div>;
      case 'objectives':
        return <ObjectivesManager />;
      default:
        return <Dashboard sales={sales} loading={loading} />;
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

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