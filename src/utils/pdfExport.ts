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
  doc.text(`Genere le ${format(new Date(), 'dd MMMM yyyy a HH:mm', { locale: fr })}`, 14, 38);

  // Podium
  if (stats.length >= 3) {
    doc.setFontSize(14);
    doc.text('1er ' + stats[0].name, 14, 50);
    doc.setFontSize(10);
    doc.text(`${stats[0].totalAmount.toFixed(2)} EUR - ${stats[0].salesCount} ventes`, 20, 56);

    doc.setFontSize(12);
    doc.text('2e ' + stats[1].name, 14, 65);
    doc.setFontSize(10);
    doc.text(`${stats[1].totalAmount.toFixed(2)} EUR - ${stats[1].salesCount} ventes`, 20, 71);

    doc.setFontSize(12);
    doc.text('3e ' + stats[2].name, 14, 80);
    doc.setFontSize(10);
    doc.text(`${stats[2].totalAmount.toFixed(2)} EUR - ${stats[2].salesCount} ventes`, 20, 86);
  }

  // Table complete
  autoTable(doc, {
    startY: 95,
    head: [['Rang', 'Employe', 'Ventes', 'Montant Total', 'Commission']],
    body: stats.map((emp, index) => [
      `${index + 1}`,
      emp.name,
      emp.salesCount.toString(),
      `${emp.totalAmount.toFixed(2)} EUR`,
      `${emp.totalCommission.toFixed(2)} EUR`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38] },
  });

  doc.save(`classement-vendeurs-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

interface UserPerformance {
  id: string;
  name: string;
  ventes: number;
  commission: number;
  count: number;
}

export function exportPerformanceComparisonPDF(
  users: UserPerformance[], 
  periodLabel: string,
  title: string = 'Comparaison des performances'
) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(147, 51, 234); // Purple
  doc.text('ALOELOCATION', 14, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 30);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Periode: ${periodLabel}`, 14, 38);

  doc.setFontSize(10);
  doc.text(`Genere le ${format(new Date(), 'dd MMMM yyyy a HH:mm', { locale: fr })}`, 14, 45);

  // Statistiques globales
  const totalVentes = users.reduce((sum, u) => sum + u.ventes, 0);
  const totalCommission = users.reduce((sum, u) => sum + u.commission, 0);
  const totalCount = users.reduce((sum, u) => sum + u.count, 0);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total CA: ${totalVentes.toFixed(2)} EUR`, 14, 55);
  doc.text(`Total Commission: ${totalCommission.toFixed(2)} EUR`, 80, 55);
  doc.text(`Total Ventes: ${totalCount}`, 150, 55);

  // Podium Top 3
  doc.setFontSize(14);
  doc.setTextColor(147, 51, 234);
  doc.text('Podium', 14, 68);

  if (users.length >= 1) {
    doc.setFontSize(12);
    doc.setTextColor(255, 215, 0); // Gold
    doc.text('1er', 14, 78);
    doc.setTextColor(0, 0, 0);
    doc.text(`${users[0].name}`, 28, 78);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${users[0].commission.toFixed(2)} EUR commission - ${users[0].count} ventes`, 28, 84);
  }

  if (users.length >= 2) {
    doc.setFontSize(11);
    doc.setTextColor(192, 192, 192); // Silver
    doc.text('2e', 14, 93);
    doc.setTextColor(0, 0, 0);
    doc.text(`${users[1].name}`, 28, 93);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${users[1].commission.toFixed(2)} EUR commission - ${users[1].count} ventes`, 28, 99);
  }

  if (users.length >= 3) {
    doc.setFontSize(11);
    doc.setTextColor(205, 127, 50); // Bronze
    doc.text('3e', 14, 108);
    doc.setTextColor(0, 0, 0);
    doc.text(`${users[2].name}`, 28, 108);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${users[2].commission.toFixed(2)} EUR commission - ${users[2].count} ventes`, 28, 114);
  }

  // Table complete
  autoTable(doc, {
    startY: 125,
    head: [['Rang', 'Utilisateur', 'Nb Ventes', 'CA', 'Commission', 'Moy/Vente']],
    body: users.map((user, index) => [
      `${index + 1}`,
      user.name,
      user.count.toString(),
      `${user.ventes.toFixed(2)} EUR`,
      `${user.commission.toFixed(2)} EUR`,
      user.count > 0 ? `${(user.commission / user.count).toFixed(2)} EUR` : '0.00 EUR',
    ]),
    theme: 'grid',
    headStyles: { fillColor: [147, 51, 234] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 45 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
  });

  // Footer avec pagination
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

  doc.save(`comparaison-performances-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

interface BonusExport {
  employeeName: string;
  periodStart: string;
  periodEnd: string;
  totalSales: number | null;
  totalAmount: number | null;
  totalCommission: number | null;
  achievementPercent: number | null;
  bonusRate: number | null;
  bonusAmount: number | null;
  status: string | null;
}

export function exportBonusesPDF(bonuses: BonusExport[], title: string = 'Rapport des Primes') {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(34, 197, 94); // Green
  doc.text('ALOELOCATION', 14, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 30);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 14, 38);

  // Statistiques résumées
  const totalBonusAmount = bonuses.reduce((sum, b) => sum + (b.bonusAmount || 0), 0);
  const pendingCount = bonuses.filter(b => b.status === 'pending').length;
  const approvedCount = bonuses.filter(b => b.status === 'approved').length;
  const paidCount = bonuses.filter(b => b.status === 'paid').length;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total des primes: ${totalBonusAmount.toFixed(2)} €`, 14, 50);
  doc.text(`En attente: ${pendingCount} | Approuvées: ${approvedCount} | Payées: ${paidCount}`, 14, 58);

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'paid': return 'Payée';
      case 'rejected': return 'Refusée';
      default: return '-';
    }
  };

  // Table des primes
  autoTable(doc, {
    startY: 68,
    head: [['Employé', 'Période', 'Ventes', 'CA', 'Commission', 'Atteinte', 'Prime', 'Statut']],
    body: bonuses.map(bonus => [
      bonus.employeeName,
      `${format(new Date(bonus.periodStart), 'dd/MM/yy')} - ${format(new Date(bonus.periodEnd), 'dd/MM/yy')}`,
      bonus.totalSales?.toString() || '-',
      bonus.totalAmount ? `${bonus.totalAmount.toFixed(0)} €` : '-',
      bonus.totalCommission ? `${bonus.totalCommission.toFixed(2)} €` : '-',
      bonus.achievementPercent ? `${bonus.achievementPercent.toFixed(0)}%` : '-',
      bonus.bonusAmount ? `${bonus.bonusAmount.toFixed(2)} €` : '-',
      getStatusLabel(bonus.status),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [34, 197, 94], fontSize: 8 },
    styles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 32 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 22 },
    },
  });

  // Footer avec pagination
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

  doc.save(`rapport-primes-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
