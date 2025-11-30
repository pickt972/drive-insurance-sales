import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { AdminStats } from '@/components/Admin/AdminStats';
import { AllSalesTable } from '@/components/Admin/AllSalesTable';
import { UserManagement } from '@/components/Admin/UserManagement';
import { ObjectivesManagement } from '@/components/Admin/ObjectivesManagement';
import { InsuranceTypesManagement } from '@/components/Admin/InsuranceTypesManagement';
import { QuickActions } from '@/components/Admin/QuickActions';
import { useRealtimeSales } from '@/hooks/useRealtimeSales';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, FileText, Target, Shield } from 'lucide-react';

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

      <Tabs defaultValue="stats" className="space-y-6 animate-gentle-fade-in">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Statistiques</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Ventes</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger value="insurance" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Assurances</span>
          </TabsTrigger>
          <TabsTrigger value="objectives" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Objectifs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" key={`stats-${refreshKey}`} className="animate-smooth-scale-in">
          <AdminStats />
        </TabsContent>

        <TabsContent value="sales" key={`sales-${refreshKey}`} className="animate-smooth-scale-in">
          <AllSalesTable />
        </TabsContent>

        <TabsContent value="users" className="animate-smooth-scale-in">
          <UserManagement />
        </TabsContent>

        <TabsContent value="insurance" className="animate-smooth-scale-in">
          <InsuranceTypesManagement />
        </TabsContent>

        <TabsContent value="objectives" className="animate-smooth-scale-in">
          <ObjectivesManagement />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
