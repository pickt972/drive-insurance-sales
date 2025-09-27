import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Trash2, User, FileText } from "lucide-react";
import { Sale } from "@/types";
import { useFirebase } from "@/hooks/useFirebase";

interface SalesHistoryProps {
  sales: Sale[];
}

export const SalesHistory = ({ sales }: SalesHistoryProps) => {
  const { deleteSale, isAdmin } = useFirebase();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async (saleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) {
      await deleteSale(saleId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Historique des ventes ({sales.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune vente enregistrée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sales.map((sale) => (
              <div key={sale.id} className="p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{sale.clientName}</h3>
                      <Badge variant="outline">{sale.reservationNumber}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {sale.employeeName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(sale.createdAt)}
                      </div>
                      <div className="font-medium text-success">
                        {sale.commissionAmount.toFixed(2)} €
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {sale.insuranceTypes.map((insurance) => (
                        <Badge key={insurance} variant="secondary" className="text-xs">
                          {insurance}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(sale.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};