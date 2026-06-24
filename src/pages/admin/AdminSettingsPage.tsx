import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemSettings } from '@/components/Admin/SystemSettings';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Paramètres</h2>
        <p className="text-gray-600">Configuration générale et gestion des utilisateurs</p>
      </div>
      <Tabs defaultValue="system" className="w-full">
        <TabsList>
          <TabsTrigger value="system">Système</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        </TabsList>
        <TabsContent value="system" className="mt-6">
          <SystemSettings />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <AdminUsersPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
