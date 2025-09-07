import { ReactNode } from "react";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";

interface MobileLayoutProps {
  children: ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
}

export const MobileLayout = ({ children, currentTab, onTabChange, isAdmin }: MobileLayoutProps) => {
  return (
    <div className="mobile-container">
      <MobileHeader />
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