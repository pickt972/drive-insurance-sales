import { ReactNode } from "react";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { TabType } from "@/types/tabs";

interface MobileLayoutProps {
  children: ReactNode;
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdmin: boolean;
}

export const MobileLayout = ({ children, currentTab, onTabChange, isAdmin }: MobileLayoutProps) => {
  return (
    <div className="mobile-container relative">
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