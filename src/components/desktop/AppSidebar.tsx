import { useState } from "react";
import { BarChart3, Plus, FileText, Download, Settings, Users, Car, Crown, User, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface AppSidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
}

const navigationItems = [
  { id: "dashboard", title: "Tableau de bord", icon: BarChart3 },
  { id: "add", title: "Nouvelle vente", icon: Plus },
  { id: "sales", title: "Historique", icon: FileText },
  { id: "export", title: "Export", icon: Download },
];

const adminItems = [
  { id: "admin", title: "Commissions", icon: Settings },
  { id: "users", title: "Utilisateurs", icon: Users },
];

export function AppSidebar({ currentTab, onTabChange, isAdmin }: AppSidebarProps) {
  const { state } = useSidebar();
  const { signOut, profile } = useSupabaseAuth();
  const collapsed = state === "collapsed";

  const isActive = (itemId: string) => currentTab === itemId;

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-primary">
              <Car className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg text-primary">Aloelocation</h1>
                <p className="text-xs text-muted-foreground">Ventes assurances</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation principale */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => onTabChange(item.id)}
                    className={`cursor-pointer ${
                      isActive(item.id) 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "hover:bg-accent"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => onTabChange(item.id)}
                      className={`cursor-pointer ${
                        isActive(item.id) 
                          ? "bg-primary text-primary-foreground font-medium" 
                          : "hover:bg-accent"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Profil utilisateur */}
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            {profile?.role === 'admin' ? (
              <Crown className="h-4 w-4 text-primary" />
            ) : (
              <User className="h-4 w-4 text-primary" />
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.username}</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.role === 'admin' ? 'Administrateur' : 'Employé'}
                </p>
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            size={collapsed ? "sm" : "default"}
            onClick={signOut}
            className={`${collapsed ? 'w-8 h-8 p-0' : 'w-full'}`}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Déconnexion</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}