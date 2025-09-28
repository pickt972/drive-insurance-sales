import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { LogOut, ChartBar as BarChart3, Plus, Clock, Settings } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { SalesForm } from "@/components/SalesForm";
import { SalesHistory } from "@/components/SalesHistory";
import { AdminPanel } from "@/components/AdminPanel";

const HomePage: React.FC = () => {
  const { profile, isAdmin, signOut } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="glass-header p-6">
        <div className="modern-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="icon-wrapper">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-variant rounded-xl"></div>
              </div>
              <div>
                <h1 className="gradient-text text-2xl lg:text-3xl">Aloe Location</h1>
                <p className="text-muted-foreground text-sm">Gestion des ventes d'assurances</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="floating-badge">
                <span className="text-sm font-medium">{profile?.firstName} {profile?.lastName}</span>
                <span className="text-xs opacity-80">({profile?.role})</span>
              </div>
              <Button variant="outline" size="sm" onClick={signOut} className="rounded-2xl hover:scale-105 transition-all duration-300">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="modern-container">
        <div className="flex gap-8 py-8">
          {/* Sidebar */}
          <nav className="modern-sidebar w-72 p-6 rounded-3xl">
            <div className="space-y-3">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`nav-button w-full text-left flex items-center gap-4 ${
                      currentTab === tab.id ? 'active' : ''
                    }`}
                    onClick={() => handleTabChange(tab.id)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="icon-wrapper p-2">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1 animate-gentle-fade-in">
            <div className="space-y-8">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default HomePage;