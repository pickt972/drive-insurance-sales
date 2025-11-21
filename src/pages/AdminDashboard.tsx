import { AdminLayout } from '@/components/layouts/AdminLayout';
import { AdminStats } from '@/components/Admin/AdminStats';
import { AllSalesTable } from '@/components/Admin/AllSalesTable';
import { UserManagement } from '@/components/Admin/UserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, FileText } from 'lucide-react';

export function AdminDashboard() {
  return (
    <AdminLayout>
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
        </TabsList>

        <TabsContent value="stats">
          <AdminStats />
        </TabsContent>

        <TabsContent value="sales">
          <AllSalesTable />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
