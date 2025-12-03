import { ObjectivesManagement } from '@/components/Admin/ObjectivesManagement';

export function AdminObjectivesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Objectifs</h2>
        <p className="text-gray-600">Gestion des objectifs de vente par employé</p>
      </div>
      <ObjectivesManagement />
    </div>
  );
}
