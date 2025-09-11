import { supabase } from "@/integrations/supabase/client";

export const createDefaultUsers = async () => {
  try {
    console.log('Création des utilisateurs par défaut...');
    
    const { data, error } = await supabase.functions.invoke('create-default-users', {
      body: {}
    });

    if (error) {
      console.error('Erreur lors de la création des utilisateurs:', error);
      return { success: false, error: error.message };
    }

    console.log('Résultat de la création des utilisateurs:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Erreur lors de l\'appel de la fonction:', error);
    return { success: false, error: error.message };
  }
};

// Auto-exécution de la fonction
createDefaultUsers().then(result => {
  if (result.success) {
    console.log('✅ Utilisateurs créés avec succès!', result.data);
  } else {
    console.error('❌ Échec de la création des utilisateurs:', result.error);
  }
});