import { Sale } from "@/types/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, Filter } from "lucide-react";
import { SalesHistoryCard } from "./SalesHistoryCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { EMPLOYEES, INSURANCE_TYPES } from "@/types/sales";

interface MobileSalesHistoryProps {
  sales: Sale[];
  onDeleteSale: (id: string) => void;
  onEditSale?: (sale: Sale) => void;
}

export const MobileSalesHistory = ({ sales, onDeleteSale, onEditSale }: MobileSalesHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEmployee, setFilterEmployee] = useState<string>("");
  const [filterInsurance, setFilterInsurance] = useState<string>("");

  // Filtrer les ventes selon les critères
  const filteredSales = sales.filter(sale => {
    const matchesSearch = !searchTerm || (
      sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.reservationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.insuranceTypes.some(insurance => 
        insurance.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    const matchesEmployee = !filterEmployee || sale.employeeName === filterEmployee;
    const matchesInsurance = !filterInsurance || sale.insuranceTypes.includes(filterInsurance);

    return matchesSearch && matchesEmployee && matchesInsurance;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setFilterEmployee("");
    setFilterInsurance("");
  };

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
        <CardContent className="pt-0 space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par client, employé, réservation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtres */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Employé</Label>
              <Select value={filterEmployee} onValueChange={(v) => setFilterEmployee(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les employés</SelectItem>
                  {EMPLOYEES.map(employee => (
                    <SelectItem key={employee} value={employee}>
                      {employee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Assurance</Label>
              <Select value={filterInsurance} onValueChange={(v) => setFilterInsurance(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les assurances</SelectItem>
                  {INSURANCE_TYPES.map(insurance => (
                    <SelectItem key={insurance} value={insurance}>
                      {insurance}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bouton pour effacer les filtres et compteur */}
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="flex items-center gap-2 h-8 text-xs"
            >
              <Filter className="h-3 w-3" />
              Effacer
            </Button>
            <span className="text-xs text-muted-foreground">
              {filteredSales.length} résultat{filteredSales.length > 1 ? 's' : ''}
            </span>
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

    </div>
  );
};