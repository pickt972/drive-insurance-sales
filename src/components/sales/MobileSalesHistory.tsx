import { Sale } from "@/types/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search } from "lucide-react";
import { SalesHistoryCard } from "./SalesHistoryCard";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface MobileSalesHistoryProps {
  sales: Sale[];
  onDeleteSale: (id: string) => void;
  onEditSale?: (sale: Sale) => void;
}

export const MobileSalesHistory = ({ sales, onDeleteSale, onEditSale }: MobileSalesHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrer les ventes selon le terme de recherche
  const filteredSales = sales.filter(sale => 
    sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.reservationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.insuranceTypes.some(insurance => 
      insurance.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* En-tête avec recherche */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Historique des ventes ({sales.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par client, employé, réservation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des ventes */}
      {filteredSales.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="text-center py-8 text-muted-foreground">
            {searchTerm ? (
              <>
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune vente ne correspond à votre recherche</p>
                <p className="text-sm mt-2">Essayez avec d'autres termes</p>
              </>
            ) : (
              <>
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune vente enregistrée</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSales.map((sale) => (
            <SalesHistoryCard
              key={sale.id}
              sale={sale}
              onDeleteSale={onDeleteSale}
              onEditSale={onEditSale}
            />
          ))}
        </div>
      )}

      {/* Affichage du nombre de résultats filtrés */}
      {searchTerm && filteredSales.length > 0 && (
        <div className="text-center text-sm text-muted-foreground py-2">
          {filteredSales.length} résultat{filteredSales.length > 1 ? 's' : ''} trouvé{filteredSales.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};