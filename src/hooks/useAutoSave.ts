import { useEffect, useRef } from 'react';
import { versioningSystem } from '@/lib/versioning';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook pour la sauvegarde automatique intelligente
 * Détecte les changements et crée des versions automatiquement
 */
export const useAutoSave = () => {
  const { profile, sales, users, insuranceTypes, objectives } = useAuth();
  const lastDataRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Créer un snapshot des données actuelles
    const currentData = {
      users: users.length,
      sales: sales.length,
      insuranceTypes: insuranceTypes.length,
      objectives: objectives.length,
      lastSale: sales[0]?.id || null,
      lastUser: users[users.length - 1]?.id || null
    };

    const currentDataString = JSON.stringify(currentData);

    // Vérifier si les données ont changé
    if (lastDataRef.current && lastDataRef.current !== currentDataString) {
      // Annuler le timer précédent
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Programmer une sauvegarde avec délai (debounce)
      saveTimeoutRef.current = setTimeout(() => {
        try {
          const changes = detectChanges(
            JSON.parse(lastDataRef.current),
            currentData
          );

          if (changes.length > 0) {
            versioningSystem.createVersion(
              'Sauvegarde automatique - Changements détectés',
              changes,
              `${profile?.firstName} ${profile?.lastName}` || 'Système'
            );
            console.log('💾 Sauvegarde automatique effectuée:', changes);
          }
        } catch (error) {
          console.error('Erreur sauvegarde automatique:', error);
        }
      }, 5000); // Attendre 5 secondes après le dernier changement
    }

    lastDataRef.current = currentDataString;

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [users, sales, insuranceTypes, objectives, profile]);
};

/**
 * Détecte les changements entre deux états de données
 */
function detectChanges(oldData: any, newData: any): string[] {
  const changes: string[] = [];

  if (newData.users !== oldData.users) {
    const diff = newData.users - oldData.users;
    if (diff > 0) {
      changes.push(`Ajout de ${diff} utilisateur(s)`);
    } else if (diff < 0) {
      changes.push(`Suppression de ${Math.abs(diff)} utilisateur(s)`);
    }
  }

  if (newData.sales !== oldData.sales) {
    const diff = newData.sales - oldData.sales;
    if (diff > 0) {
      changes.push(`Ajout de ${diff} vente(s)`);
    } else if (diff < 0) {
      changes.push(`Suppression de ${Math.abs(diff)} vente(s)`);
    }
  }

  if (newData.insuranceTypes !== oldData.insuranceTypes) {
    const diff = newData.insuranceTypes - oldData.insuranceTypes;
    if (diff > 0) {
      changes.push(`Ajout de ${diff} type(s) d'assurance`);
    } else if (diff < 0) {
      changes.push(`Suppression de ${Math.abs(diff)} type(s) d'assurance`);
    }
  }

  if (newData.objectives !== oldData.objectives) {
    const diff = newData.objectives - oldData.objectives;
    if (diff > 0) {
      changes.push(`Ajout de ${diff} objectif(s)`);
    } else if (diff < 0) {
      changes.push(`Suppression de ${Math.abs(diff)} objectif(s)`);
    }
  }

  if (newData.lastSale !== oldData.lastSale) {
    changes.push('Nouvelle vente enregistrée');
  }

  if (newData.lastUser !== oldData.lastUser) {
    changes.push('Nouvel utilisateur créé');
  }

  return changes;
}