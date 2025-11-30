import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Users, BarChart3, FileText } from 'lucide-react';
import { useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header Admin - Design moderne avec gradient */}
      <header className="glass-header border-b-2 border-destructive/20 animate-gentle-fade-in">
        <div className="modern-container">
          <div className="flex items-center justify-between py-5">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-destructive to-destructive/80 shadow-lg">
                  <Users className="h-6 w-6 text-destructive-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-destructive via-destructive to-orange bg-clip-text text-transparent">
                    ALOELOCATION
                  </h1>
                  <p className="text-xs font-medium text-muted-foreground">
                    Mode Administrateur
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-foreground">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <Button
                variant="outline"
                onClick={signOut}
                className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </Button>
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
              © 2025 ALOELOCATION - Martinique 🏝️
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
              <p className="text-xs text-muted-foreground">Système opérationnel</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
