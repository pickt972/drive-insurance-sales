import { SalesForm } from '@/components/SalesForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

export function AdminNewSalePage() {
  const handleSaleAdded = () => {
    // Rafraîchir les données si nécessaire
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
          <PlusCircle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nouvelle Vente</h1>
          <p className="text-muted-foreground">
            Enregistrer une vente pour vous-même ou pour un autre utilisateur
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <SalesForm onSaleAdded={handleSaleAdded} />
        </CardContent>
      </Card>
    </div>
  );
}
