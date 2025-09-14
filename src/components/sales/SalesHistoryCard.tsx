import { useState } from "react";
import { Sale } from "@/types/sales";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2, Eye, Edit, User, FileText } from "lucide-react";
import { SaleDetailModal } from "../SaleDetailModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface SalesHistoryCardProps {
  sale: Sale;
  onDeleteSale: (id: string) => void;
  onEditSale?: (sale: Sale) => void;
}

export const SalesHistoryCard = ({ sale, onDeleteSale, onEditSale }: SalesHistoryCardProps) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetail = () => {
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
  };

  return (
    <>
      <Card className="shadow-card bg-card hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          {/* En-tête avec date et actions */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formatDate(sale.date)}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetail}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-3 w-3" />
              </Button>
              {onEditSale && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditSale(sale)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              <ConfirmDialog
                title="Confirmer la suppression"
                description={`Supprimer la vente de ${sale.clientName} ? Cette action est irréversible.`}
                onConfirm={() => onDeleteSale(sale.id)}
                trigger={
                  <Button variant="destructive" size="sm" className="h-8 w-8 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                }
              />
            </div>
          </div>

          {/* Informations principales */}
          <div className="space-y-3">
            {/* Client */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">{sale.clientName}</span>
              </div>
            </div>

            {/* Employé et réservation */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-primary/10">
                {sale.employeeName}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span className="font-mono">{sale.reservationNumber}</span>
              </div>
            </div>

            {/* Assurances */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">Assurances :</div>
              <div className="flex flex-wrap gap-1">
                {sale.insuranceTypes.map((insurance) => (
                  <Badge key={insurance} variant="secondary" className="text-xs">
                    {insurance}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SaleDetailModal 
        sale={sale}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
      />
    </>
  );
};