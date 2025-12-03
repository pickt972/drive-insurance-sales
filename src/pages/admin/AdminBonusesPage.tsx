import { BonusManagement } from '@/components/Admin/BonusManagement';

export function AdminBonusesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Primes & Bonus</h2>
        <p className="text-gray-600">Configuration des règles de primes et bonus</p>
      </div>
      <BonusManagement />
    </div>
  );
}
