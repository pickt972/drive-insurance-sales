import { LayoutDashboard, Users, ShieldCheck, Target, TrendingUp, Settings, FileText, DollarSign } from 'lucide-react';
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

const adminMenuItems = [
  { title: 'Tableau de bord', url: '/admin', icon: LayoutDashboard, end: true },
  { title: 'Ventes', url: '/admin/sales', icon: TrendingUp },
  { title: 'Utilisateurs', url: '/admin/users', icon: Users },
  { title: 'Types d\'assurance', url: '/admin/insurance-types', icon: ShieldCheck },
  { title: 'Objectifs', url: '/admin/objectives', icon: Target },
  { title: 'Bonus', url: '/admin/bonuses', icon: DollarSign },
  { title: 'Logs d\'audit', url: '/admin/audit-logs', icon: FileText },
  { title: 'Paramètres', url: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-64'}>
      <SidebarContent className="bg-red-50 dark:bg-red-950">
        <div className="p-4 border-b border-red-200 dark:border-red-800">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AL</span>
              </div>
              <div>
                <h2 className="font-bold text-sm text-red-900 dark:text-red-100">ALOELOCATION</h2>
                <p className="text-xs text-red-600 dark:text-red-400">Administration</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">AL</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-red-700 dark:text-red-300">
            {!isCollapsed && 'Menu Principal'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-red-600 text-white font-medium'
                            : 'text-red-900 dark:text-red-100 hover:bg-red-100 dark:hover:bg-red-900'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
