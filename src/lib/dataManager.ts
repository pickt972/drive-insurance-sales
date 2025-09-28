/**
 * Gestionnaire de données centralisé avec versioning intégré
 * Intercepte toutes les modifications pour créer des sauvegardes intelligentes
 */

import { versioningSystem } from './versioning';

export class DataManager {
  private static instance: DataManager;
  private readonly STORAGE_PREFIX = 'aloelocation_';

  private constructor() {}

  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  /**
   * Sauvegarde des données avec versioning automatique
   */
  public saveData(key: string, data: any, description?: string, author?: string): boolean {
    try {
      const oldData = this.getData(key);
      const hasChanged = JSON.stringify(oldData) !== JSON.stringify(data);

      // Sauvegarder les données
      localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(data));

      // Créer une version si les données ont changé significativement
      if (hasChanged && this.shouldCreateVersion(key, oldData, data)) {
        const changes = this.detectChanges(key, oldData, data);
        const versionDescription = description || `Modification ${key}`;
        
        versioningSystem.createVersion(
          versionDescription,
          changes,
          author || 'Système'
        );
      }

      return true;
    } catch (error) {
      console.error(`Erreur sauvegarde ${key}:`, error);
      return false;
    }
  }

  /**
   * Récupération des données
   */
  public getData(key: string): any {
    try {
      const data = localStorage.getItem(this.STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Erreur récupération ${key}:`, error);
      return null;
    }
  }

  /**
   * Détermine si une version doit être créée
   */
  private shouldCreateVersion(key: string, oldData: any, newData: any): boolean {
    // Toujours créer une version pour les changements critiques
    const criticalKeys = ['users', 'sales', 'objectives', 'insurance_types'];
    if (criticalKeys.includes(key)) {
      return true;
    }

    // Pour les autres données, vérifier l'ampleur du changement
    if (!oldData) return true; // Première sauvegarde
    
    const oldSize = JSON.stringify(oldData).length;
    const newSize = JSON.stringify(newData).length;
    const sizeDiff = Math.abs(newSize - oldSize) / oldSize;
    
    // Créer une version si le changement est > 5%
    return sizeDiff > 0.05;
  }

  /**
   * Détecte les changements spécifiques
   */
  private detectChanges(key: string, oldData: any, newData: any): string[] {
    const changes: string[] = [];

    switch (key) {
      case 'users':
        if (Array.isArray(oldData) && Array.isArray(newData)) {
          const oldCount = oldData.length;
          const newCount = newData.length;
          if (newCount > oldCount) {
            const newUsers = newData.slice(oldCount);
            changes.push(...newUsers.map((user: any) => `Ajout utilisateur: ${user.firstName} ${user.lastName}`));
          } else if (newCount < oldCount) {
            changes.push(`Suppression de ${oldCount - newCount} utilisateur(s)`);
          }
        }
        break;

      case 'sales':
        if (Array.isArray(oldData) && Array.isArray(newData)) {
          const oldCount = oldData.length;
          const newCount = newData.length;
          if (newCount > oldCount) {
            const newSales = newData.slice(0, newCount - oldCount);
            changes.push(...newSales.map((sale: any) => `Nouvelle vente: ${sale.clientName} (${sale.commissionAmount}€)`));
          } else if (newCount < oldCount) {
            changes.push(`Suppression de ${oldCount - newCount} vente(s)`);
          }
        }
        break;

      case 'objectives':
        if (Array.isArray(oldData) && Array.isArray(newData)) {
          const oldCount = oldData.length;
          const newCount = newData.length;
          if (newCount > oldCount) {
            changes.push(`Ajout de ${newCount - oldCount} objectif(s)`);
          } else if (newCount < oldCount) {
            changes.push(`Suppression de ${oldCount - newCount} objectif(s)`);
          }
        }
        break;

      case 'insurance_types':
        if (Array.isArray(oldData) && Array.isArray(newData)) {
          const oldCount = oldData.length;
          const newCount = newData.length;
          if (newCount > oldCount) {
            const newInsurances = newData.slice(oldCount);
            changes.push(...newInsurances.map((ins: any) => `Nouvelle assurance: ${ins.name} (${ins.commission}€)`));
          } else if (newCount < oldCount) {
            changes.push(`Suppression de ${oldCount - newCount} assurance(s)`);
          }
        }
        break;

      default:
        changes.push(`Modification ${key}`);
    }

    return changes;
  }

  /**
   * Sauvegarde d'urgence
   */
  public emergencyBackup(reason: string = 'Sauvegarde d\'urgence'): boolean {
    try {
      versioningSystem.createVersion(
        reason,
        ['Sauvegarde d\'urgence déclenchée'],
        'Système d\'urgence'
      );
      console.log('🚨 Sauvegarde d\'urgence effectuée');
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde d\'urgence:', error);
      return false;
    }
  }

  /**
   * Récupère les statistiques de stockage
   */
  public getStorageStats(): any {
    try {
      let totalSize = 0;
      const keys: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          keys.push(key);
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }

      return {
        totalKeys: keys.length,
        totalSize,
        formattedSize: this.formatBytes(totalSize),
        keys: keys.map(key => ({
          key: key.replace(this.STORAGE_PREFIX, ''),
          size: localStorage.getItem(key)?.length || 0
        }))
      };
    } catch (error) {
      console.error('Erreur statistiques stockage:', error);
      return null;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Instance globale
export const dataManager = DataManager.getInstance();