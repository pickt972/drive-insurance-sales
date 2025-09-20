import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  BarChart3, 
  Plus, 
  Clock, 
  Settings, 
  Target,
  Car,
  Shield
} from 'lucide-react';
import { TabType } from '@/pages/HomePage';
import { cn } from '@/lib/utils';

interface DesktopSidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdmin: boolean;
}

interface NavItem {
  id: TabType;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: BarChart3, label: 'Tableau de bord' },
  { id: 'sales', icon: Plus, label: 'Nouvelle vente' },
  { id: 'history', icon: Clock, label: 'Historique' },
  { id: 'objectives', icon: Target, label: 'Objectifs' },
  { id: 'admin', icon: Settings, label: 'Administration', adminOnly: true },
];

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentTab,
  onTabChange,
  isAdmin
}) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible>
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Car className="h-6 w-6 text-primary" />
              <Shield className="h-6 w-6 text-primary" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg">AloeLocation</h1>
                <p className="text-xs text-muted-foreground">Gestion des ventes</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      className={cn(
                        "w-full justify-start",
                        isActive && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {!collapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};