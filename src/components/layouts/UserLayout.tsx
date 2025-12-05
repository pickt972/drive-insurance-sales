import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Key } from 'lucide-react';
import { useState } from 'react';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserLayoutProps {
  children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const { profile, signOut } = useAuth();
  const { settings: appSettings } = useAppSettings();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/30 to-background">
      {/* Header User - Design moderne avec gradient */}
      <header className="glass-header border-b-2 border-primary/20 animate-gentle-fade-in">
        <div className="modern-container">
          <div className="flex items-center justify-between py-5">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary-variant shadow-lg animate-float-gentle">
                  {appSettings.app_logo ? (
                    <img src={appSettings.app_logo} alt="Logo" className="h-6 w-6 object-contain" />
                  ) : (
                    <Home className="h-6 w-6 text-primary-foreground" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-info to-primary-variant bg-clip-text text-transparent">
                    {appSettings.app_name}
                  </h1>
                  <p className="text-xs font-medium text-muted-foreground">
                    Bienvenue, {profile?.full_name} 👋
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 hover:bg-primary/10 px-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-foreground">{profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    </div>
                    <Avatar className="h-9 w-9 border-2 border-primary/30">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
                    <Key className="mr-2 h-4 w-4" />
                    Modifier mon mot de passe
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu avec animation */}
      <main className="modern-container py-8 animate-smooth-scale-in">
        {children}
      </main>

      {/* Footer moderne */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto py-6">
        <div className="modern-container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 {appSettings.app_name}
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
              <p className="text-xs text-muted-foreground">Système opérationnel</p>
            </div>
          </div>
        </div>
      </footer>

      <ChangePasswordDialog 
        open={changePasswordOpen} 
        onOpenChange={setChangePasswordOpen} 
      />
    </div>
  );
}
