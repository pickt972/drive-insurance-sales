import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DesktopSidebar } from '@/components/desktop/DesktopSidebar';
import { DesktopHeader } from '@/components/desktop/DesktopHeader';
import { TabType } from '@/types/tabs';

interface DesktopLayoutProps {
  children: React.ReactNode;
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdmin: boolean;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  children,
  currentTab,
  onTabChange,
  isAdmin
}) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DesktopSidebar 
          currentTab={currentTab}
          onTabChange={onTabChange}
          isAdmin={isAdmin}
        />
        <div className="flex-1 flex flex-col">
          <DesktopHeader currentTab={currentTab} />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};