import React from 'react';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { TabType } from '@/types/tabs';

interface MobileLayoutProps {
  children: React.ReactNode;
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdmin: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  currentTab,
  onTabChange,
  isAdmin
}) => {
  return (
    <div className="min-h-screen bg-background">
      <MobileHeader currentTab={currentTab} />
      <main className="mobile-content">
        {children}
      </main>
      <MobileBottomNav 
        currentTab={currentTab} 
        onTabChange={onTabChange}
        isAdmin={isAdmin}
      />
    </div>
  );
};