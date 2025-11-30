import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { AdminStats } from '@/components/Admin/AdminStats';
import { AllSalesTable } from '@/components/Admin/AllSalesTable';
import { UserManagement } from '@/components/Admin/UserManagement';
import { ObjectivesManagementEnhanced } from '@/components/Admin/ObjectivesManagementEnhanced';
import { InsuranceTypesManagement } from '@/components/Admin/InsuranceTypesManagement';
import { BonusManagement } from '@/components/Admin/BonusManagement';
import { AdvancedAnalytics } from '@/components/Admin/AdvancedAnalytics';
import { QuickActions } from '@/components/Admin/QuickActions';
import { AuditLogViewer } from '@/components/Admin/AuditLogViewer';
import { SystemSettings } from '@/components/Admin/SystemSettings';
import { useRealtimeSales } from '@/hooks/useRealtimeSales';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, FileText, Target, Shield, TrendingUp, Award, Settings } from 'lucide-react';

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
        <TabsList className="grid w-full grid-cols-9 h-12 lg:grid-cols-9">
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Analyse</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Ventes</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="insurance" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Assurances</span>
          </TabsTrigger>
          <TabsTrigger value="objectives" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Objectifs</span>
          </TabsTrigger>
          <TabsTrigger value="bonus" className="gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Bonus</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" key={`stats-${refreshKey}`} className="animate-smooth-scale-in">
          <AdminStats />
        </TabsContent>

        <TabsContent value="analytics" className="animate-smooth-scale-in">
          <AdvancedAnalytics />
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
          <ObjectivesManagementEnhanced />
        </TabsContent>

        <TabsContent value="bonus" className="animate-smooth-scale-in">
          <BonusManagement />
        </TabsContent>

        <TabsContent value="audit" className="animate-smooth-scale-in">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="settings" className="animate-smooth-scale-in">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
