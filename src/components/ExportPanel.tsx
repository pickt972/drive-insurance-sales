import { Sale } from "@/types/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, ChevronDown, Settings, FileText, Cloud, File } from "lucide-react";
import { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from "@/integrations/supabase/client";
import { SaleWithDetails } from "@/types/database";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface SaleForExport {
  id: string;
  employeeName: string;
  clientName: string;
  reservationNumber: string;
  insuranceTypes: string[];
  date: string;
  timestamp: number;
  commissions: number;
}

interface ExportPanelProps {
  sales: SaleForExport[];
}

export const ExportPanel = ({ sales }: ExportPanelProps) => {
  const [googleCredentials, setGoogleCredentials] = useState("");
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const { users } = useSupabaseAuth();

  // Créer une liste des utilisateurs avec des IDs factices pour la compatibilité
  const employees = users.map(user => ({
    user_id: user.username, // Utiliser le username comme ID
    username: user.username
  }));

  const exportToCSV = () => {
    if (sales.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucune vente à exporter.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Date", "Employé", "Client", "N° Réservation", "Assurances", "Commission"];
    const csvContent = [
      headers.join(","),
      ...sales.map(sale => [
        new Date(sale.date).toLocaleDateString('fr-FR'),
        sale.employeeName,
        sale.clientName,
        sale.reservationNumber,
        Array.isArray(sale.insuranceTypes) ? sale.insuranceTypes.join('; ') : sale.insuranceTypes,
        sale.commissions.toFixed(2),
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ventes-assurances-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export réussi",
      description: "Le fichier CSV a été téléchargé.",
    });
  };

  const exportToPDF = () => {
    if (sales.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucune vente à exporter.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(20);
    doc.text('Rapport des Ventes d\'Assurances', 20, 20);
    
    // Date du rapport
    doc.setFontSize(12);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);
    
    // Statistiques
    const totalCommission = sales.reduce((sum, sale) => sum + (sale.commissions || 0), 0);
    doc.text(`Nombre total de ventes: ${sales.length}`, 20, 40);
    doc.text(`Commission totale: ${totalCommission.toFixed(2)} €`, 20, 50);

    // Tableau
    const tableData = sales.map(sale => [
      new Date(sale.date).toLocaleDateString('fr-FR'),
      sale.employeeName,
      sale.clientName,
      sale.reservationNumber,
      Array.isArray(sale.insuranceTypes) ? sale.insuranceTypes.join(', ') : sale.insuranceTypes,
      `${(sale.commissions || 0).toFixed(2)} €`
    ]);

    autoTable(doc, {
      head: [['Date', 'Employé', 'Client', 'N° Réservation', 'Assurance', 'Commission']],
      body: tableData,
      startY: 60,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`ventes-assurances-${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Export réussi",
      description: "Le fichier PDF a été téléchargé.",
    });
  };

  const exportToExcel = () => {
    if (sales.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucune vente à exporter.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Date", "Employé", "Client", "Email", "Téléphone", "N° Réservation", "Assurance", "Commission", "Notes"];
    const htmlContent = `
      <table border="1">
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${sales.map(sale => `
            <tr>
              <td>${new Date(sale.date).toLocaleDateString('fr-FR')}</td>
              <td>${sale.employeeName}</td>
              <td>${sale.clientName}</td>
              <td>${sale.reservationNumber}</td>
              <td>${Array.isArray(sale.insuranceTypes) ? sale.insuranceTypes.join(', ') : sale.insuranceTypes}</td>
              <td>${sale.commissions.toFixed(2)} €</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ventes-assurances-${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export réussi",
      description: "Le fichier Excel a été téléchargé.",
    });
  };

  const uploadToGoogleDrive = async () => {
    if (!googleCredentials.trim()) {
      toast({
        title: "Identifiants manquants",
        description: "Veuillez configurer vos identifiants Google Drive.",
        variant: "destructive",
      });
      return;
    }

    if (sales.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucune vente à exporter vers Google Drive.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Préparer les données à envoyer
      const exportData = {
        sales: sales.map(sale => ({
          date: new Date(sale.date).toLocaleDateString('fr-FR'),
          employee: sale.employeeName,
          client: sale.clientName,
          reservation: sale.reservationNumber,
          insurance: Array.isArray(sale.insuranceTypes) ? sale.insuranceTypes.join(', ') : sale.insuranceTypes,
          commission: sale.commissions.toFixed(2)
        })),
        credentials: JSON.parse(googleCredentials),
        filename: `ventes-assurances-${new Date().toISOString().split('T')[0]}`
      };

      const { data, error } = await supabase.functions.invoke('google-drive-export', {
        body: exportData
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Upload réussi",
        description: `Le fichier a été envoyé vers Google Drive: ${data.fileName}`,
      });

    } catch (error) {
      console.error('Erreur lors de l\'upload vers Google Drive:', error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible d'envoyer le fichier vers Google Drive. Vérifiez vos identifiants.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const exportManualPDF = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Période requise",
        description: "Veuillez sélectionner une date de début et de fin.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // Filtrer les ventes localement pour l'instant
      const startDateTime = new Date(startDate).getTime();
      const endDateTime = new Date(endDate).getTime() + 24*3600*1000 - 1;
      
      let filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date).getTime();
        return saleDate >= startDateTime && saleDate <= endDateTime;
      });

      
      // Si des utilisateurs spécifiques sont sélectionnés, filtrer par nom d'employé
      if (selectedUsers.length > 0) {
        filteredSales = filteredSales.filter(sale => 
          selectedUsers.includes(sale.employeeName)
        );
      }

      // Générer le PDF localement
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text(`Export des ventes du ${startDate} au ${endDate}`, 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);
      
      const totalCommission = filteredSales.reduce((sum, sale) => sum + (sale.commissions || 0), 0);
      doc.text(`Nombre total de ventes: ${filteredSales.length}`, 20, 40);
      doc.text(`Commission totale: ${totalCommission.toFixed(2)} €`, 20, 50);

      const tableData = filteredSales.map(sale => [
        new Date(sale.date).toLocaleDateString('fr-FR'),
        sale.employeeName,
        sale.clientName,
        sale.reservationNumber,
        Array.isArray(sale.insuranceTypes) ? sale.insuranceTypes.join(', ') : sale.insuranceTypes,
        `${(sale.commissions || 0).toFixed(2)} €`
      ]);

      autoTable(doc, {
        head: [['Date', 'Employé', 'Client', 'N° Réservation', 'Assurance', 'Commission']],
        body: tableData,
        startY: 60,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });

      doc.save(`export-ventes-${startDate}_au_${endDate}.pdf`);

      toast({ title: 'Export réussi', description: 'Le PDF a été téléchargé.' });
    } catch (error) {
      console.error('Erreur export manuel:', error);
      toast({ title: 'Erreur', description: "Impossible de générer le PDF.", variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="shadow-card bg-gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Export et sauvegarde
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={exportToCSV} variant="outline" className="h-12">
            <FileText className="mr-2 h-4 w-4" />
            Exporter en CSV
          </Button>
          
          <Button onClick={exportToPDF} variant="outline" className="h-12">
            <File className="mr-2 h-4 w-4" />
            Exporter en PDF
          </Button>
          
          <Button onClick={exportToExcel} variant="outline" className="h-12">
            <FileText className="mr-2 h-4 w-4" />
            Exporter en Excel
          </Button>
        </div>

        <section className="space-y-4">
          <h3 className="text-base font-semibold">Export manuel (PDF)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sélectionner des utilisateurs</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {employees.map((emp) => (
                <label key={emp.user_id} className="flex items-center gap-2">
                  <Checkbox 
                    checked={selectedUsers.includes(emp.user_id)}
                    onCheckedChange={(checked) => {
                      setSelectedUsers((prev) =>
                        checked ? [...prev, emp.user_id] : prev.filter(id => id !== emp.user_id)
                      );
                    }}
                  />
                  <span className="text-sm">{emp.username}</span>
                </label>
              ))}
            </div>
          </div>
          <Button onClick={exportManualPDF} disabled={isExporting} className="w-full md:w-auto">
            {isExporting ? 'Génération…' : 'Exporter le PDF'}
          </Button>
        </section>

        <Collapsible open={isCredentialsOpen} onOpenChange={setIsCredentialsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration Google Drive
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="credentials">
                Identifiants Google Drive (JSON)
              </Label>
              <Textarea
                id="credentials"
                placeholder={`{
  "client_id": "votre_client_id",
  "client_secret": "votre_client_secret", 
  "refresh_token": "votre_refresh_token"
}`}
                value={googleCredentials}
                onChange={(e) => setGoogleCredentials(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
              />
            </div>
            
            <Button 
              onClick={uploadToGoogleDrive} 
              className="w-full bg-gradient-primary hover:bg-primary-hover"
              disabled={sales.length === 0 || isUploading}
            >
              <Cloud className="mr-2 h-4 w-4" />
              {isUploading ? 'Envoi en cours...' : 'Envoyer vers Google Drive'}
            </Button>
          </CollapsibleContent>
        </Collapsible>

        <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
          <p className="font-medium mb-1">💡 Instructions Google Drive :</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Créez un projet sur Google Cloud Console</li>
            <li>Activez l'API Google Drive</li>
            <li>Créez des identifiants OAuth 2.0</li>
            <li>Obtenez un refresh_token via le flow OAuth</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};