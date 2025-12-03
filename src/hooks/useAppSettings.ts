import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppSettings {
  app_name: string;
  app_logo: string | null;
}

const DEFAULT_SETTINGS: AppSettings = {
  app_name: 'Gestion des Ventes',
  app_logo: null,
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('system_settings')
        .select('key, value')
        .in('key', ['app_name', 'app_logo']);

      if (error) {
        console.error('Error fetching app settings:', error);
        return;
      }

      const settingsObj: Partial<AppSettings> = {};
      data?.forEach((setting: { key: string; value: any }) => {
        if (setting.key === 'app_name') {
          settingsObj.app_name = setting.value;
        } else if (setting.key === 'app_logo') {
          settingsObj.app_logo = setting.value;
        }
      });

      setSettings({
        ...DEFAULT_SETTINGS,
        ...settingsObj,
      });
    } catch (error) {
      console.error('Error fetching app settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refetch: fetchSettings };
}
