import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Database, 
  Download, 
  Upload,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  Archive
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const SystemSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleExportData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('export-sales-report', {
        body: { format: 'csv' }
      });

      if (error) throw error;

      toast({
        title: "Export réussi",
        description: "Les données ont été exportées avec succès",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    const confirmText = "RESET";
    const userInput = prompt(
      `⚠️ ATTENTION: Cette action va supprimer TOUTES les données.\n\nTapez "${confirmText}" pour confirmer:`
    );

    if (userInput !== confirmText) {
      toast({
        title: "Action annulée",
        description: "La base de données n'a pas été réinitialisée",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.functions.invoke('reset-database');

      if (error) throw error;

      toast({
        title: "Base de données réinitialisée",
        description: "Toutes les données ont été supprimées et l'admin par défaut recréé",
      });

      // Redirect to login after reset
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
    } catch (error) {
      console.error('Error resetting database:', error);
      toast({
        title: "Erreur de réinitialisation",
        description: "Impossible de réinitialiser la base de données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Gestion des données
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Export des données</h4>
              <p className="text-sm text-muted-foreground">
                Exporter toutes les ventes et statistiques en CSV
              </p>
              <Button 
                onClick={handleExportData}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Exporter les données
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Rapports automatiques</h4>
              <p className="text-sm text-muted-foreground">
                Configuration des exports automatiques
              </p>
              <Button 
                variant="outline"
                className="w-full"
                disabled
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Configurer (Bientôt)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            État du système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Base de données
              </Badge>
              <p className="text-sm text-success">Connectée</p>
            </div>
            
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Authentification
              </Badge>
              <p className="text-sm text-success">Active</p>
            </div>
            
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                API Supabase
              </Badge>
              <p className="text-sm text-success">Opérationnelle</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zone dangereuse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-destructive/10 rounded-lg">
            <h4 className="font-medium text-destructive mb-2">
              Réinitialiser la base de données
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              ⚠️ Cette action supprimera TOUTES les données (ventes, utilisateurs, etc.) 
              et recréera uniquement l'utilisateur admin par défaut.
            </p>
            <Button 
              variant="destructive"
              onClick={handleResetDatabase}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Réinitialiser la base de données
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};