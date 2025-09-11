import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, User, CreditCard, Phone, Mail, FileText, DollarSign } from "lucide-react";
import { Sale } from "@/types/sales";

interface SaleDetailModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SaleDetailModal = ({ sale, isOpen, onClose }: SaleDetailModalProps) => {
  if (!sale) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => `${amount.toFixed(2)} €`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Détail de la vente
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Information client */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Client
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{sale.clientName}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information vente */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Détails de la vente
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">N° Réservation:</span>
                  <span className="font-mono">{sale.reservationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendeur:</span>
                  <Badge variant="outline">{sale.employeeName}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(sale.date)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assurances */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Assurances souscrites
              </h3>
              <div className="flex flex-wrap gap-2">
                {sale.insuranceTypes.map((insurance) => (
                  <Badge key={insurance} variant="secondary" className="px-3 py-1">
                    {insurance}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Commission */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Commission
              </h3>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(sale.commissions)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total commission
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </DialogContent>
    </Dialog>
  );
};