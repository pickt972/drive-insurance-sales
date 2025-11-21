import { useEffect, useRef } from 'react';
import { versioningSystem } from '@/lib/versioning';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook pour la sauvegarde automatique (TEMPORAIREMENT DÉSACTIVÉ pendant la migration)
 */
export const useAutoSave = () => {
  const { profile } = useAuth();
  
  // Hook désactivé temporairement pendant la migration
  useEffect(() => {
    console.log('⚠️ useAutoSave: Temporairement désactivé pendant la migration');
  }, [profile]);
};
