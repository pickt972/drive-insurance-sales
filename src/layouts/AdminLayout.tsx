import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Shield,
  Target,
  Gift,
  Settings as SettingsIcon,
  FileText,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Car,
  PlusCircle,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navigation = [
  { name: 'Tableau de bord', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Nouvelle Vente', href: '/admin/new-sale', icon: PlusCircle },
  { name: 'Ventes', href: '/admin/sales', icon: ShoppingCart },
  { name: 'Utilisateurs', href: '/admin/users', icon: Users },
  { name: 'Types d\'assurances', href: '/admin/insurance-types', icon: Shield },
  { name: 'Objectifs', href: '/admin/objectives', icon: Target },
  { name: 'Primes & Bonus', href: '/admin/bonuses', icon: Gift },
  { name: 'Règles de bonus', href: '/admin/bonus-rules', icon: ClipboardList },
  { name: 'Rapports', href: '/admin/reports', icon: FileText },
  { name: 'Journal d\'audit', href: '/admin/audit-logs', icon: ClipboardList },
  { name: 'Paramètres', href: '/admin/settings', icon: SettingsIcon },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [todaySalesCount, setTodaySalesCount] = useState(0);
  const { profile, signOut } = useAuth();
  const { settings: appSettings } = useAppSettings();
  const navigate = useNavigate();

  // Fetch today's sales count
  useEffect(() => {
    const fetchTodaySales = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('insurance_sales')
        .select('*', { count: 'exact', head: true })
        .eq('sale_date', today);
      
      setTodaySalesCount(count || 0);
    };

    fetchTodaySales();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTodaySales, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar Mobile */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          sidebarOpen ? 'block' : 'hidden'
        )}
      >
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl">
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <div className="flex items-center gap-2">
              {appSettings.app_logo ? (
                <img src={appSettings.app_logo} alt="Logo" className="h-8 w-8 object-contain" />
              ) : (
                <Car className="h-8 w-8 text-blue-600" />
              )}
              <span className="text-xl font-bold text-gray-900">{appSettings.app_name}</span>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <nav className="px-4 py-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            {appSettings.app_logo ? (
              <img src={appSettings.app_logo} alt="Logo" className="h-8 w-8 object-contain" />
            ) : (
              <Car className="h-8 w-8 text-blue-600" />
            )}
            <span className="ml-2 text-xl font-bold text-gray-900">{appSettings.app_name}</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700 -ml-1 pl-4'
                      : 'text-gray-700 hover:bg-gray-100'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User info bottom */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {profile?.full_name ? getInitials(profile.full_name) : 'AD'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name || 'Administrateur'}
                </p>
                <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Today's sales counter */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {todaySalesCount} vente{todaySalesCount !== 1 ? 's' : ''} aujourd'hui
              </span>
            </div>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center gap-4">
              {/* Quick action: Nouvelle Vente */}
              <Button 
                onClick={() => navigate('/admin/new-sale')}
                className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <PlusCircle className="h-4 w-4" />
                Nouvelle Vente
              </Button>
              <Button 
                onClick={() => navigate('/admin/new-sale')}
                size="icon"
                className="sm:hidden bg-primary hover:bg-primary/90"
              >
                <PlusCircle className="h-5 w-5" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-500" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                        {profile?.full_name ? getInitials(profile.full_name) : 'AD'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium">
                      {profile?.full_name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{profile?.full_name}</span>
                      <span className="text-xs font-normal text-gray-500">
                        Administrateur
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
