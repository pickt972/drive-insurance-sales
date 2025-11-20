import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { LogOut, ChartBar as BarChart3, Plus, Clock, Settings } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { SalesForm } from "@/components/SalesForm";
import { SalesHistory } from "@/components/SalesHistory";
import { AdminPanel } from "@/components/AdminPanel";
import { VersionBadge } from "@/components/ui/version-badge";
import aloeLogo from "@/assets/aloelocation-logo.png";

const HomePage: React.FC = () => {
  const { profile, isAdmin, signOut, user } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    // Fermer la sidebar sur mobile après sélection
    setSidebarOpen(false);
  };

  const handleSaleAdded = () => {
    setCurrentTab('dashboard');
  };

  const tabs = [
    { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
    { id: "sales", label: "Nouvelle vente", icon: Plus },
    { id: "history", label: "Historique", icon: Clock },
    ...(isAdmin ? [{ id: "admin", label: "Administration", icon: Settings }] : [])
  ];

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'sales':
        return <SalesForm onSaleAdded={handleSaleAdded} />;
      case 'history':
        return <SalesHistory />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <div className="text-center py-8">Accès non autorisé</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 overflow-x-hidden">
      {/* Header */}
      <header className="glass-header p-4 lg:p-6">
        <div className="modern-container">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-3 rounded-xl hover:bg-muted/50 transition-colors h-12 w-12 flex items-center justify-center"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center gap-1">
                <div className={`h-0.5 bg-foreground transition-all duration-300 ${sidebarOpen ? 'rotate-45 translate-y-1.5' : 'w-6'}`} />
                <div className={`h-0.5 bg-foreground transition-all duration-300 ${sidebarOpen ? 'opacity-0' : 'w-6'}`} />
                <div className={`h-0.5 bg-foreground transition-all duration-300 ${sidebarOpen ? '-rotate-45 -translate-y-1.5' : 'w-6'}`} />
              </div>
            </button>
            
            <div className="flex items-center gap-2 lg:gap-4">
              <img src={aloeLogo} alt="Aloe Location" className="h-8 w-auto lg:h-10" />
              <div className="hidden sm:block">
                <p className="text-muted-foreground text-xs lg:text-sm">Gestion des ventes d'assurances</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="floating-badge text-xs lg:text-sm">
                <span className="font-medium hidden sm:inline">{profile?.firstName} {profile?.lastName}</span>
                <span className="font-medium sm:hidden">{profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}</span>
                <span className="text-xs opacity-80 hidden lg:inline">({profile?.role})</span>
              </div>
              <VersionBadge />
              <Button variant="outline" size="sm" onClick={signOut} className="rounded-2xl hover:scale-105 transition-all duration-300 h-11 lg:h-10">
                <LogOut className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="modern-container px-2 lg:px-8 w-full overflow-hidden">
        <div className="flex gap-0 lg:gap-8 py-4 lg:py-8 relative w-full">
          {/* Sidebar */}
          <nav className={`modern-sidebar fixed lg:static inset-y-0 left-0 z-40 w-[280px] max-w-[85vw] lg:w-72 p-4 lg:p-6 rounded-none lg:rounded-3xl transform transition-transform duration-300 lg:transform-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}>
            <div className="space-y-2 lg:space-y-3">
              {/* Header mobile de la sidebar */}
              <div className="lg:hidden flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <img src={aloeLogo} alt="Aloe Location" className="h-8 w-auto" />
                  <div>
                    <p className="text-muted-foreground text-xs">Menu</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-3 rounded-xl hover:bg-muted/50 transition-colors h-11 w-11 flex items-center justify-center"
                  aria-label="Fermer le menu"
                >
                  <div className="w-5 h-5 flex items-center justify-center relative">
                    <div className="w-4 h-0.5 bg-foreground rotate-45 absolute" />
                    <div className="w-4 h-0.5 bg-foreground -rotate-45 absolute" />
                  </div>
                </button>
              </div>
              
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`nav-button w-full text-left flex items-center gap-3 lg:gap-4 text-sm lg:text-base ${
                      currentTab === tab.id ? 'active' : ''
                    }`}
                    onClick={() => handleTabChange(tab.id)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="icon-wrapper p-1.5 lg:p-2">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Overlay pour mobile */}
          {sidebarOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/30 z-30 transition-opacity duration-300"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main content */}
          <main className="flex-1 animate-gentle-fade-in px-2 lg:px-0 w-full min-w-0 overflow-x-hidden">
            <div className="space-y-4 lg:space-y-8 w-full">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default HomePage;