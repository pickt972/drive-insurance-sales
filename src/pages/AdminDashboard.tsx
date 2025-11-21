import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { AdminStats } from '@/components/Admin/AdminStats';
import { AllSalesTable } from '@/components/Admin/AllSalesTable';
import { UserManagement } from '@/components/Admin/UserManagement';
import { ObjectivesManagement } from '@/components/Admin/ObjectivesManagement';
import { QuickActions } from '@/components/Admin/QuickActions';
import { useRealtimeSales } from '@/hooks/useRealtimeSales';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, FileText, Target } from 'lucide-react';

export function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Notifications temps réel pour l'admin
  useRealtimeSales(() => {
    setRefreshKey(prev => prev + 1);
  });

  return (
    <AdminLayout>
      {/* Quick Actions */}
      <QuickActions />

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stats">
            <BarChart3 className="mr-2 h-4 w-4" />
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="sales">
            <FileText className="mr-2 h-4 w-4" />
            Toutes les ventes
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="objectives">
            <Target className="mr-2 h-4 w-4" />
            Objectifs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" key={`stats-${refreshKey}`}>
          <AdminStats />
        </TabsContent>

        <TabsContent value="sales" key={`sales-${refreshKey}`}>
          <AllSalesTable />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="objectives">
          <ObjectivesManagement />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
