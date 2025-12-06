import { BonusManagement } from '@/components/Admin/BonusManagement';

export function AdminBonusRulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Règles de Bonus</h2>
        <p className="text-muted-foreground">Configuration des paliers et pourcentages de bonus</p>
      </div>
      <BonusManagement />
    </div>
  );
}
