import { EmployeeBonuses } from '@/components/Admin/EmployeeBonuses';

export function AdminBonusesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Primes & Bonus</h2>
        <p className="text-muted-foreground">Suivi et gestion des primes versées aux employés</p>
      </div>
      <EmployeeBonuses />
    </div>
  );
}
