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
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin */}
      <header className="bg-red-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">ALOELOCATION - Admin</h1>
              <p className="text-sm text-red-100">
                Connecté en tant que : {profile?.full_name} ({profile?.email})
              </p>
            </div>
            <Button
              variant="outline"
              onClick={signOut}
              className="bg-white text-red-600 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Admin */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'sales'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="mr-2 h-4 w-4" />
              Toutes les ventes
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="mr-2 h-4 w-4" />
              Gestion utilisateurs
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
