import { Car, LogOut, User, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/aloelocation-logo.png";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export const MobileHeader = () => {
  const { signOut, profile, isAdmin } = useSupabaseAuth();
  const displayUsername = profile?.username || 'Invité';

  return (
    <header className="mobile-header">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg ring-2 ring-primary/20">
            <img 
              src={logoImage} 
              alt="Aloelocation Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg text-primary">Aloelocation</h1>
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