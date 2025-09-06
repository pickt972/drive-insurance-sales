import { Sale } from "@/types/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, ChevronDown, Settings, FileText, Cloud } from "lucide-react";
import { useState } from "react";

interface ExportPanelProps {
  sales: Sale[];
}

export const ExportPanel = ({ sales }: ExportPanelProps) => {
  const [googleCredentials, setGoogleCredentials] = useState("");
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const { toast } = useToast();

  const exportToCSV = () => {
    if (sales.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucune vente à exporter.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Date", "Employé", "Client", "N° Réservation", "Assurances"];
    const csvContent = [
      headers.join(","),
      ...sales.map(sale => [
        sale.date,
        sale.employeeName,
        sale.clientName,
        sale.reservationNumber,
        `"${sale.insuranceTypes.join("; ")}"`,
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

  const exportToExcel = () => {
    if (sales.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucune vente à exporter.",
        variant: "destructive",
      });
      return;
    }

    // Create a simplified Excel-compatible HTML table
    const headers = ["Date", "Employé", "Client", "N° Réservation", "Assurances"];
    const htmlContent = `
      <table border="1">
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${sales.map(sale => `
            <tr>
              <td>${sale.date}</td>
              <td>${sale.employeeName}</td>
              <td>${sale.clientName}</td>
              <td>${sale.reservationNumber}</td>
              <td>${sale.insuranceTypes.join("; ")}</td>
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

  const uploadToGoogleDrive = () => {
    if (!googleCredentials.trim()) {
      toast({
        title: "Identifiants manquants",
        description: "Veuillez configurer vos identifiants Google Drive.",
        variant: "destructive",
      });
      return;
    }

    // Simulate Google Drive upload
    toast({
      title: "Upload simulé",
      description: "Cette fonctionnalité nécessite une intégration backend complète avec l'API Google Drive.",
      variant: "default",
    });
  };

  return (
    <Card className="shadow-card bg-gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Export et sauvegarde
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={exportToCSV} variant="outline" className="h-12">
            <FileText className="mr-2 h-4 w-4" />
            Exporter en CSV
          </Button>
          
          <Button onClick={exportToExcel} variant="outline" className="h-12">
            <FileText className="mr-2 h-4 w-4" />
            Exporter en Excel
          </Button>
        </div>

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
                Identifiants Google (client_id, client_secret, refresh_token)
              </Label>
              <Textarea
                id="credentials"
                placeholder="Collez ici vos identifiants Google Drive au format JSON..."
                value={googleCredentials}
                onChange={(e) => setGoogleCredentials(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <Button 
              onClick={uploadToGoogleDrive} 
              className="w-full bg-gradient-primary hover:bg-primary-hover"
              disabled={sales.length === 0}
            >
              <Cloud className="mr-2 h-4 w-4" />
              Envoyer vers Google Drive
            </Button>
          </CollapsibleContent>
        </Collapsible>

        <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
          <p className="font-medium mb-1">💡 Note :</p>
          <p>
            L'intégration Google Drive complète nécessite un backend sécurisé. 
            Cette version propose une simulation de l'interface.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};