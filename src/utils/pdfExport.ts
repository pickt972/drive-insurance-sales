import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Sale {
  sale_date: string;
  employee_name?: string;
  insurance_type: string;
  contract_number: string;
  amount: number;
  commission: number;
  customer_name?: string;
}

interface EmployeeStat {
  name: string;
  totalAmount: number;
  totalCommission: number;
  salesCount: number;
}

export function exportSalesPDF(sales: Sale[], title: string = 'Rapport des ventes') {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235); // Blue
  doc.text('ALOELOCATION', 14, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 30);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 14, 38);

  // Statistiques résumées
  const totalAmount = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalCommission = sales.reduce((sum, s) => sum + s.commission, 0);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total: ${totalAmount.toFixed(2)} €`, 14, 48);
  doc.text(`Commission: ${totalCommission.toFixed(2)} €`, 14, 55);
  doc.text(`Nombre de ventes: ${sales.length}`, 14, 62);

  // Table des ventes
  autoTable(doc, {
    startY: 70,
    head: [['Date', 'Employé', 'Type', 'Contrat', 'Montant', 'Commission']],
    body: sales.map(sale => [
      format(new Date(sale.sale_date), 'dd/MM/yyyy'),
      sale.employee_name || '-',
      sale.insurance_type,
      sale.contract_number,
      `${sale.amount.toFixed(2)} €`,
      `${sale.commission.toFixed(2)} €`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 8 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Sauvegarder
  doc.save(`rapport-ventes-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function exportEmployeeStatsPDF(stats: EmployeeStat[], title: string = 'Classement des vendeurs') {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(220, 38, 38); // Red pour admin
  doc.text('ALOELOCATION', 14, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 30);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 14, 38);

  // Podium
  if (stats.length >= 3) {
    doc.setFontSize(14);
    doc.text('🥇 ' + stats[0].name, 14, 50);
    doc.setFontSize(10);
    doc.text(`${stats[0].totalAmount.toFixed(2)} € - ${stats[0].salesCount} ventes`, 20, 56);

    doc.setFontSize(12);
    doc.text('🥈 ' + stats[1].name, 14, 65);
    doc.setFontSize(10);
    doc.text(`${stats[1].totalAmount.toFixed(2)} € - ${stats[1].salesCount} ventes`, 20, 71);

    doc.setFontSize(12);
    doc.text('🥉 ' + stats[2].name, 14, 80);
    doc.setFontSize(10);
    doc.text(`${stats[2].totalAmount.toFixed(2)} € - ${stats[2].salesCount} ventes`, 20, 86);
  }

  // Table complète
  autoTable(doc, {
    startY: 95,
    head: [['Rang', 'Employé', 'Ventes', 'Montant Total', 'Commission']],
    body: stats.map((emp, index) => [
      `${index + 1}`,
      emp.name,
      emp.salesCount.toString(),
      `${emp.totalAmount.toFixed(2)} €`,
      `${emp.totalCommission.toFixed(2)} €`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38] },
  });

  doc.save(`classement-vendeurs-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
