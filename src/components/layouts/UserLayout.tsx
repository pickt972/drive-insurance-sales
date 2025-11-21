import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Home, PlusCircle, BarChart } from 'lucide-react';
import { useState } from 'react';

interface UserLayoutProps {
  children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header User */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">ALOELOCATION</h1>
              <p className="text-sm text-blue-100">
                Bienvenue, {profile?.full_name}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={signOut}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation User */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className="mr-2 h-4 w-4" />
              Tableau de bord
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle vente
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart className="mr-2 h-4 w-4" />
              Mes statistiques
            </button>
          </div>
        </div>
      </nav>

      {/* Contenu */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          © 2025 ALOELOCATION - Martinique
        </div>
      </footer>
    </div>
  );
}
