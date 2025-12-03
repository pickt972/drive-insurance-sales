import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemSetting {
  key: string;
  value: any;
}

export function SystemSettings() {
  const [settings, setSettings] = useState({
    app_name: 'Gestion des Ventes',
    auto_export_enabled: false,
    auto_export_day: 1,
    notification_email: '',
    commission_rate: 15,
    max_sales_per_day: 50,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('system_settings')
        .select('*');

      if (error) throw error;

      // Convertir les données en objet
      const settingsObj: any = {};
      data?.forEach((setting: SystemSetting) => {
        settingsObj[setting.key] = setting.value;
      });

      setSettings({
        app_name: settingsObj.app_name || 'Gestion des Ventes',
        auto_export_enabled: settingsObj.auto_export_enabled || false,
        auto_export_day: settingsObj.auto_export_day || 1,
        notification_email: settingsObj.notification_email || '',
        commission_rate: settingsObj.commission_rate || 15,
        max_sales_per_day: settingsObj.max_sales_per_day || 50,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les paramètres',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Sauvegarder chaque paramètre
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await (supabase as any)
          .from('system_settings')
          .upsert({
            key,
            value,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          });

        if (error) throw error;
      }

      toast({
        title: '✅ Paramètres sauvegardés',
        description: 'Les paramètres système ont été mis à jour',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Nom de l'application */}
      <Card className="modern-card animate-gentle-fade-in md:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Identité de l'application</CardTitle>
              <CardDescription>Nom affiché dans l'en-tête une fois connecté</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label htmlFor="app-name">Nom de l'application</Label>
            <Input
              id="app-name"
              type="text"
              placeholder="Ex: ALOELOCATION, Mon Entreprise..."
              value={settings.app_name}
              onChange={(e) => 
                setSettings({ ...settings, app_name: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Ce nom sera affiché en haut à gauche de l'application pour tous les utilisateurs connectés
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Exports automatiques */}
      <Card className="modern-card animate-gentle-fade-in">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple/10 to-purple/5">
              <Settings className="h-5 w-5 text-purple" />
            </div>
            <div>
              <CardTitle>Exports automatiques</CardTitle>
              <CardDescription>Configuration des exports mensuels</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-export">Activer les exports automatiques</Label>
            <Switch
              id="auto-export"
              checked={settings.auto_export_enabled}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, auto_export_enabled: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="export-day">Jour d'export (1-28)</Label>
            <Input
              id="export-day"
              type="number"
              min={1}
              max={28}
              value={settings.auto_export_day}
              onChange={(e) => 
                setSettings({ ...settings, auto_export_day: parseInt(e.target.value) })
              }
              disabled={!settings.auto_export_enabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notif-email">Email de notification</Label>
            <Input
              id="notif-email"
              type="email"
              placeholder="admin@aloelocation.internal"
              value={settings.notification_email}
              onChange={(e) => 
                setSettings({ ...settings, notification_email: e.target.value })
              }
              disabled={!settings.auto_export_enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Paramètres métier */}
      <Card className="modern-card animate-gentle-fade-in">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-info/10 to-info/5">
              <Settings className="h-5 w-5 text-info" />
            </div>
            <div>
              <CardTitle>Paramètres métier</CardTitle>
              <CardDescription>Règles de gestion des ventes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="commission-rate">Taux de commission par défaut (%)</Label>
            <Input
              id="commission-rate"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={settings.commission_rate}
              onChange={(e) => 
                setSettings({ ...settings, commission_rate: parseFloat(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              Taux appliqué lors de la création d'une vente
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-sales">Limite de ventes par jour</Label>
            <Input
              id="max-sales"
              type="number"
              min={1}
              max={200}
              value={settings.max_sales_per_day}
              onChange={(e) => 
                setSettings({ ...settings, max_sales_per_day: parseInt(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              Nombre maximum de ventes qu'un employé peut créer par jour
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Boutons d'action */}
      <div className="md:col-span-2 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={fetchSettings}
          disabled={loading || saving}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Recharger
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>
    </div>
  );
}
