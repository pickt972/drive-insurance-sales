/**
 * Système de versioning et sauvegarde complet pour Aloe Location
 * Gère les sauvegardes automatiques, la restauration et l'historique des versions
 */

export interface AppVersion {
  version: string;
  timestamp: string;
  description: string;
  data: {
    users: any[];
    passwords: Record<string, string>;
    insuranceTypes: any[];
    sales: any[];
    objectives: any[];
    settings: any;
  };
  changes: string[];
  author: string;
  hash: string;
}

export interface BackupMetadata {
  totalVersions: number;
  lastBackup: string;
  autoBackupEnabled: boolean;
  backupInterval: number; // en minutes
  maxVersions: number;
}

export class VersioningSystem {
  private static instance: VersioningSystem;
  private readonly STORAGE_PREFIX = 'aloelocation_';
  private readonly VERSION_KEY = 'versions';
  private readonly METADATA_KEY = 'backup_metadata';
  private readonly CURRENT_VERSION_KEY = 'current_version';
  
  private autoBackupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeVersioning();
    this.startAutoBackup();
  }

  public static getInstance(): VersioningSystem {
    if (!VersioningSystem.instance) {
      VersioningSystem.instance = new VersioningSystem();
    }
    return VersioningSystem.instance;
  }

  /**
   * Initialise le système de versioning
   */
  private initializeVersioning(): void {
    const metadata = this.getMetadata();
    if (!metadata) {
      const defaultMetadata: BackupMetadata = {
        totalVersions: 0,
        lastBackup: new Date().toISOString(),
        autoBackupEnabled: true,
        backupInterval: 30, // 30 minutes
        maxVersions: 50
      };
      this.saveMetadata(defaultMetadata);
      console.log('🔧 Système de versioning initialisé');
    }
  }

  /**
   * Génère un hash unique pour une version
   */
  private generateHash(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Récupère les métadonnées de sauvegarde
   */
  private getMetadata(): BackupMetadata | null {
    try {
      const metadata = localStorage.getItem(this.STORAGE_PREFIX + this.METADATA_KEY);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      console.error('Erreur récupération métadonnées:', error);
      return null;
    }
  }

  /**
   * Sauvegarde les métadonnées
   */
  private saveMetadata(metadata: BackupMetadata): void {
    try {
      localStorage.setItem(this.STORAGE_PREFIX + this.METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Erreur sauvegarde métadonnées:', error);
    }
  }

  /**
   * Récupère toutes les données actuelles de l'application
   */
  private getCurrentData(): AppVersion['data'] {
    try {
      return {
        users: JSON.parse(localStorage.getItem(this.STORAGE_PREFIX + 'users') || '[]'),
        passwords: JSON.parse(localStorage.getItem(this.STORAGE_PREFIX + 'passwords') || '{}'),
        insuranceTypes: JSON.parse(localStorage.getItem(this.STORAGE_PREFIX + 'insurance_types') || '[]'),
        sales: JSON.parse(localStorage.getItem(this.STORAGE_PREFIX + 'sales') || '[]'),
        objectives: JSON.parse(localStorage.getItem(this.STORAGE_PREFIX + 'objectives') || '[]'),
        settings: JSON.parse(localStorage.getItem(this.STORAGE_PREFIX + 'settings') || '{}')
      };
    } catch (error) {
      console.error('Erreur récupération données:', error);
      return {
        users: [],
        passwords: {},
        insuranceTypes: [],
        sales: [],
        objectives: [],
        settings: {}
      };
    }
  }

  /**
   * Crée une nouvelle version/sauvegarde
   */
  public createVersion(description: string, changes: string[] = [], author: string = 'Système'): AppVersion {
    try {
      const currentData = this.getCurrentData();
      const timestamp = new Date().toISOString();
      const versions = this.getAllVersions();
      
      // Générer le numéro de version
      const versionNumber = this.generateVersionNumber(versions.length);
      
      const newVersion: AppVersion = {
        version: versionNumber,
        timestamp,
        description,
        data: currentData,
        changes,
        author,
        hash: this.generateHash(currentData)
      };

      // Sauvegarder la nouvelle version
      const updatedVersions = [...versions, newVersion];
      
      // Limiter le nombre de versions
      const metadata = this.getMetadata()!;
      if (updatedVersions.length > metadata.maxVersions) {
        updatedVersions.splice(0, updatedVersions.length - metadata.maxVersions);
      }

      localStorage.setItem(this.STORAGE_PREFIX + this.VERSION_KEY, JSON.stringify(updatedVersions));
      localStorage.setItem(this.STORAGE_PREFIX + this.CURRENT_VERSION_KEY, newVersion.version);

      // Mettre à jour les métadonnées
      metadata.totalVersions = updatedVersions.length;
      metadata.lastBackup = timestamp;
      this.saveMetadata(metadata);

      console.log(`💾 Version ${versionNumber} créée: ${description}`);
      return newVersion;
    } catch (error) {
      console.error('Erreur création version:', error);
      throw new Error('Impossible de créer la version');
    }
  }

  /**
   * Génère un numéro de version sémantique
   */
  private generateVersionNumber(totalVersions: number): string {
    const major = Math.floor(totalVersions / 100) + 1;
    const minor = Math.floor((totalVersions % 100) / 10);
    const patch = totalVersions % 10;
    return `${major}.${minor}.${patch}`;
  }

  /**
   * Récupère toutes les versions
   */
  public getAllVersions(): AppVersion[] {
    try {
      const versions = localStorage.getItem(this.STORAGE_PREFIX + this.VERSION_KEY);
      return versions ? JSON.parse(versions) : [];
    } catch (error) {
      console.error('Erreur récupération versions:', error);
      return [];
    }
  }

  /**
   * Récupère une version spécifique
   */
  public getVersion(version: string): AppVersion | null {
    const versions = this.getAllVersions();
    return versions.find(v => v.version === version) || null;
  }

  /**
   * Restaure une version spécifique
   */
  public restoreVersion(version: string): boolean {
    try {
      const versionData = this.getVersion(version);
      if (!versionData) {
        throw new Error(`Version ${version} non trouvée`);
      }

      // Créer une sauvegarde avant restauration
      this.createVersion(`Sauvegarde avant restauration vers ${version}`, ['Sauvegarde automatique'], 'Système');

      // Restaurer les données
      const { data } = versionData;
      localStorage.setItem(this.STORAGE_PREFIX + 'users', JSON.stringify(data.users));
      localStorage.setItem(this.STORAGE_PREFIX + 'passwords', JSON.stringify(data.passwords));
      localStorage.setItem(this.STORAGE_PREFIX + 'insurance_types', JSON.stringify(data.insuranceTypes));
      localStorage.setItem(this.STORAGE_PREFIX + 'sales', JSON.stringify(data.sales));
      localStorage.setItem(this.STORAGE_PREFIX + 'objectives', JSON.stringify(data.objectives));
      localStorage.setItem(this.STORAGE_PREFIX + 'settings', JSON.stringify(data.settings));
      localStorage.setItem(this.STORAGE_PREFIX + this.CURRENT_VERSION_KEY, version);

      console.log(`🔄 Version ${version} restaurée avec succès`);
      return true;
    } catch (error) {
      console.error('Erreur restauration version:', error);
      return false;
    }
  }

  /**
   * Supprime une version
   */
  public deleteVersion(version: string): boolean {
    try {
      const versions = this.getAllVersions();
      const updatedVersions = versions.filter(v => v.version !== version);
      
      localStorage.setItem(this.STORAGE_PREFIX + this.VERSION_KEY, JSON.stringify(updatedVersions));
      
      const metadata = this.getMetadata()!;
      metadata.totalVersions = updatedVersions.length;
      this.saveMetadata(metadata);

      console.log(`🗑️ Version ${version} supprimée`);
      return true;
    } catch (error) {
      console.error('Erreur suppression version:', error);
      return false;
    }
  }

  /**
   * Exporte toutes les versions en JSON
   */
  public exportVersions(): string {
    const versions = this.getAllVersions();
    const metadata = this.getMetadata();
    
    const exportData = {
      metadata,
      versions,
      exportDate: new Date().toISOString(),
      appName: 'Aloe Location - Gestion Assurances'
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Importe des versions depuis un JSON
   */
  public importVersions(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.versions || !Array.isArray(importData.versions)) {
        throw new Error('Format de données invalide');
      }

      // Créer une sauvegarde avant import
      this.createVersion('Sauvegarde avant import', ['Import de versions'], 'Système');

      // Importer les versions
      localStorage.setItem(this.STORAGE_PREFIX + this.VERSION_KEY, JSON.stringify(importData.versions));
      
      if (importData.metadata) {
        this.saveMetadata(importData.metadata);
      }

      console.log(`📥 ${importData.versions.length} versions importées`);
      return true;
    } catch (error) {
      console.error('Erreur import versions:', error);
      return false;
    }
  }

  /**
   * Compare deux versions
   */
  public compareVersions(version1: string, version2: string): any {
    const v1 = this.getVersion(version1);
    const v2 = this.getVersion(version2);
    
    if (!v1 || !v2) {
      return null;
    }

    return {
      version1: v1.version,
      version2: v2.version,
      timeDiff: new Date(v2.timestamp).getTime() - new Date(v1.timestamp).getTime(),
      dataChanges: {
        users: v2.data.users.length - v1.data.users.length,
        sales: v2.data.sales.length - v1.data.sales.length,
        objectives: v2.data.objectives.length - v1.data.objectives.length,
        insuranceTypes: v2.data.insuranceTypes.length - v1.data.insuranceTypes.length
      }
    };
  }

  /**
   * Démarre la sauvegarde automatique
   */
  private startAutoBackup(): void {
    const metadata = this.getMetadata();
    if (!metadata?.autoBackupEnabled) return;

    this.autoBackupTimer = setInterval(() => {
      this.createVersion('Sauvegarde automatique', ['Sauvegarde périodique'], 'Système Auto');
    }, metadata.backupInterval * 60 * 1000);

    console.log(`⏰ Sauvegarde automatique activée (${metadata.backupInterval} min)`);
  }

  /**
   * Arrête la sauvegarde automatique
   */
  public stopAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
      console.log('⏹️ Sauvegarde automatique arrêtée');
    }
  }

  /**
   * Configure la sauvegarde automatique
   */
  public configureAutoBackup(enabled: boolean, intervalMinutes: number = 30): void {
    const metadata = this.getMetadata()!;
    metadata.autoBackupEnabled = enabled;
    metadata.backupInterval = intervalMinutes;
    this.saveMetadata(metadata);

    this.stopAutoBackup();
    if (enabled) {
      this.startAutoBackup();
    }
  }

  /**
   * Nettoie les anciennes versions
   */
  public cleanupOldVersions(keepCount: number = 20): number {
    try {
      const versions = this.getAllVersions();
      if (versions.length <= keepCount) return 0;

      const versionsToKeep = versions.slice(-keepCount);
      const deletedCount = versions.length - versionsToKeep.length;

      localStorage.setItem(this.STORAGE_PREFIX + this.VERSION_KEY, JSON.stringify(versionsToKeep));
      
      const metadata = this.getMetadata()!;
      metadata.totalVersions = versionsToKeep.length;
      this.saveMetadata(metadata);

      console.log(`🧹 ${deletedCount} anciennes versions supprimées`);
      return deletedCount;
    } catch (error) {
      console.error('Erreur nettoyage versions:', error);
      return 0;
    }
  }

  /**
   * Récupère la version actuelle
   */
  public getCurrentVersion(): string {
    return localStorage.getItem(this.STORAGE_PREFIX + this.CURRENT_VERSION_KEY) || '1.0.0';
  }

  /**
   * Récupère les statistiques du système
   */
  public getStats(): any {
    const versions = this.getAllVersions();
    const metadata = this.getMetadata();
    
    if (versions.length === 0) {
      return {
        totalVersions: 0,
        oldestVersion: null,
        newestVersion: null,
        totalSize: 0,
        averageSize: 0,
        metadata
      };
    }

    const totalSize = JSON.stringify(versions).length;
    const averageSize = totalSize / versions.length;

    return {
      totalVersions: versions.length,
      oldestVersion: versions[0],
      newestVersion: versions[versions.length - 1],
      totalSize,
      averageSize,
      metadata
    };
  }

  /**
   * Vérifie l'intégrité des données
   */
  public checkIntegrity(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      const versions = this.getAllVersions();
      const metadata = this.getMetadata();

      if (!metadata) {
        errors.push('Métadonnées manquantes');
      }

      versions.forEach((version, index) => {
        if (!version.version || !version.timestamp || !version.data) {
          errors.push(`Version ${index} corrompue`);
        }
        
        if (!version.hash || version.hash !== this.generateHash(version.data)) {
          errors.push(`Hash invalide pour version ${version.version}`);
        }
      });

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Erreur lors de la vérification d\'intégrité']
      };
    }
  }

  /**
   * Répare les données corrompues
   */
  public repairData(): boolean {
    try {
      const integrity = this.checkIntegrity();
      if (integrity.valid) return true;

      console.log('🔧 Réparation des données en cours...');
      
      // Recalculer les hash
      const versions = this.getAllVersions();
      const repairedVersions = versions.map(version => ({
        ...version,
        hash: this.generateHash(version.data)
      }));

      localStorage.setItem(this.STORAGE_PREFIX + this.VERSION_KEY, JSON.stringify(repairedVersions));
      
      console.log('✅ Données réparées avec succès');
      return true;
    } catch (error) {
      console.error('Erreur réparation données:', error);
      return false;
    }
  }
}

// Instance globale
export const versioningSystem = VersioningSystem.getInstance();