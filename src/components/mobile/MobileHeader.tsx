import { useState, useEffect } from "react";
import { Car, LogOut, User, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "/lovable-uploads/eb56420e-3e12-4ccc-acb0-00c755b5ab58.png";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export const MobileHeader = () => {
  const { signOut, profile, isAdmin, user } = useSupabaseAuth();
  const uname = user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0];
  const displayUsername = profile?.username || uname || 'Invité';
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

  return (
    <header className="mobile-header">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-1 shadow-lg ring-1 ring-gray-200">
            <img 
              src={logoUrl} 
              alt={`${appName} - logo`} 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg text-primary">{appName}</h1>
            <p className="text-xs text-muted-foreground">Ventes assurances</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-full">
            {isAdmin ? (
              <Crown className="h-3 w-3 text-primary" />
            ) : (
              <User className="h-3 w-3 text-primary" />
            )}
            <span className="text-xs font-medium text-primary">
              {displayUsername}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="h-8 w-8 p-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};