import { SystemSettings } from '@/components/Admin/SystemSettings';

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Paramètres système</h2>
        <p className="text-gray-600">Configuration générale de l'application</p>
      </div>
      <SystemSettings />
    </div>
  );
}
