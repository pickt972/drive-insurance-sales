import { useState, useEffect } from "react";
import { BarChart3, Plus, FileText, Download, Settings, Users, Car, Crown, User, LogOut, Target } from "lucide-react";
import logoImage from "/lovable-uploads/eb56420e-3e12-4ccc-acb0-00c755b5ab58.png";
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
  { id: "objectives", title: "Objectifs", icon: Target },
  { id: "sales", title: "Historique", icon: FileText },
];

const adminItems = [
  { id: "export", title: "Export", icon: Download },
  { id: "admin", title: "Commissions", icon: Settings },
  { id: "users", title: "Utilisateurs", icon: Users },
];

export function AppSidebar({ currentTab, onTabChange, isAdmin }: AppSidebarProps) {
  const { state } = useSidebar();
  const { signOut, profile, isAdmin: supabaseIsAdmin, user } = useSupabaseAuth();
  const collapsed = state === "collapsed";
  const [appName, setAppName] = useState(localStorage.getItem('app-name') || 'Aloe Location');
  const [logoUrl, setLogoUrl] = useState(localStorage.getItem('app-logo') || logoImage);

  // Sync app name & logo with localStorage updates
  useEffect(() => {
    const refresh = () => {
      setAppName(localStorage.getItem('app-name') || 'Aloe Location');
      setLogoUrl(localStorage.getItem('app-logo') || logoImage);
    };

    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'app-name' || e.key === 'app-logo') {
        refresh();
      }
    };

    const onCustomUpdate = () => refresh();

    window.addEventListener('storage', onStorage);
    window.addEventListener('app-settings-updated', onCustomUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('app-settings-updated', onCustomUpdate as EventListener);
    };
  }, []);

const effectiveIsAdmin = supabaseIsAdmin || isAdmin;
const uname = user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0];
const displayUsername = profile?.username || uname || 'Invité';

  const isActive = (itemId: string) => currentTab === itemId;

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-1 shadow-lg ring-1 ring-gray-200">
              <img 
                src={logoUrl} 
                alt={`${appName} - logo`} 
                className="w-full h-full object-contain"
              />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg text-primary">{appName}</h1>
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
        {effectiveIsAdmin && (
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
            {effectiveIsAdmin ? (
              <Crown className="h-4 w-4 text-primary" />
            ) : (
              <User className="h-4 w-4 text-primary" />
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayUsername}</p>
                <p className="text-xs text-muted-foreground">
                  {effectiveIsAdmin ? 'Administrateur' : 'Employé'}
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