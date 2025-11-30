import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Sale {
  sale_date: string;
  employee_name: string;
  insurance_type: string;
  contract_number: string;
  amount: number;
  commission: number;
  customer_name?: string;
  vehicle_type?: string;
  notes?: string;
}

export function exportSalesExcel(sales: Sale[], filename: string = 'ventes') {
  // Préparer les données pour Excel
  const data = sales.map(sale => ({
    'Date': format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: fr }),
    'Employé': sale.employee_name,
    'Type Assurance': sale.insurance_type,
    'N° Contrat': sale.contract_number,
    'Montant (€)': sale.amount.toFixed(2),
    'Commission (€)': sale.commission.toFixed(2),
    'Client': sale.customer_name || '-',
    'Véhicule': sale.vehicle_type || '-',
    'Notes': sale.notes || '-'
  }));

  // Calculer les totaux
  const totalAmount = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalCommission = sales.reduce((sum, s) => sum + s.commission, 0);

  // Ajouter une ligne de total
  data.push({
    'Date': 'TOTAL',
    'Employé': '',
    'Type Assurance': '',
    'N° Contrat': '',
    'Montant (€)': totalAmount.toFixed(2),
    'Commission (€)': totalCommission.toFixed(2),
    'Client': '',
    'Véhicule': '',
    'Notes': `${sales.length} ventes`
  });

  // Créer le classeur
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ventes');

  // Définir les largeurs de colonnes
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 20 }, // Employé
    { wch: 18 }, // Type
    { wch: 15 }, // Contrat
    { wch: 14 }, // Montant
    { wch: 16 }, // Commission
    { wch: 25 }, // Client
    { wch: 15 }, // Véhicule
    { wch: 30 }  // Notes
  ];

  // Télécharger le fichier
  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}
