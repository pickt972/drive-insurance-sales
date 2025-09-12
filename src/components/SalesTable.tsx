import { useState } from "react";
import { Sale } from "@/types/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Calendar, Eye, Edit } from "lucide-react";
import { SaleDetailModal } from "./SaleDetailModal";

interface SalesTableProps {
  sales: Sale[];
  onDeleteSale: (id: string) => void;
  onEditSale?: (sale: Sale) => void;
}

export const SalesTable = ({ sales, onDeleteSale, onEditSale }: SalesTableProps) => {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleViewDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedSale(null);
  };

  return (
    <Card className="shadow-card bg-gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Historique des ventes ({sales.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune vente enregistrée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employé</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>N° Réservation</TableHead>
                  <TableHead>Assurances</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(sale.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/10">
                        {sale.employeeName}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{sale.clientName}</TableCell>
                    <TableCell className="font-mono text-sm">{sale.reservationNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {sale.insuranceTypes.map((insurance) => (
                          <Badge key={insurance} variant="secondary" className="text-xs">
                            {insurance}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetail(sale)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {onEditSale && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditSale(sale)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeleteSale(sale.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      <SaleDetailModal 
        sale={selectedSale}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
      />
    </Card>
  );
};