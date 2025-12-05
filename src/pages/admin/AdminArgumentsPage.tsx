import { ArgumentsManagement } from '@/components/Admin/ArgumentsManagement';

export function AdminArgumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Argumentaires de vente</h2>
        <p className="text-muted-foreground">
          Personnalisez les arguments et phrases d'accroche pour aider vos équipes à vendre
        </p>
      </div>
      <ArgumentsManagement />
    </div>
  );
}
