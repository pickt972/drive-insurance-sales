import { supabase } from '@/integrations/supabase/client';

export const createInitialUsers = async () => {
  try {
    console.log('🔧 Création des utilisateurs initiaux...');
    
    const { data, error } = await supabase.functions.invoke('create-users-batch');
    
    if (error) {
      console.error('❌ Erreur création utilisateurs:', error);
      return { success: false, error };
    }
    
    console.log('✅ Utilisateurs créés:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur appel fonction:', error);
    return { success: false, error };
  }
};