import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Download, Upload, History, Trash2, RefreshCw, Settings, Shield, Clock, Database, FileText, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, GitBranch, Archive } from "lucide-react";
import { versioningSystem, AppVersion } from "@/lib/versioning";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export const VersionManager = () => {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // États pour création de version
  const [newVersionDescription, setNewVersionDescription] = useState("");
  const [newVersionChanges, setNewVersionChanges] = useState("");
  
  // États pour les paramètres
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupInterval, setBackupInterval] = useState(30);
  const [maxVersions, setMaxVersions] = useState(50);
  
  // États pour l'import
  const [importData, setImportData] = useState("");
  
  const { profile } = useAuth();

  useEffect(() => {
    loadVersions();
    loadSettings();
  }, []);

  const loadVersions = () => {
    try {
      const allVersions = versioningSystem.getAllVersions();
      setVersions(allVersions.reverse()); // Plus récentes en premier
    } catch (error) {
      console.error('Erreur chargement versions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les versions",
        variant: "destructive",
      });
    }
  };

  const loadSettings = () => {
    try {
      const stats = versioningSystem.getStats();
      if (stats.metadata) {
        setAutoBackupEnabled(stats.metadata.autoBackupEnabled);
        setBackupInterval(stats.metadata.backupInterval);
        setMaxVersions(stats.metadata.maxVersions);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  const handleCreateVersion = async () => {
    if (!newVersionDescription.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une description",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const changes = newVersionChanges.trim() 
        ? newVersionChanges.split('\n').map(line => line.trim()).filter(line => line)
        : [];
      
      versioningSystem.createVersion(
        newVersionDescription.trim(),
        changes,
        `${profile?.firstName} ${profile?.lastName}` || 'Utilisateur'
      );

      setNewVersionDescription("");
      setNewVersionChanges("");
      setShowCreateDialog(false);
      loadVersions();

      toast({
        title: "Version créée",
        description: "Nouvelle version sauvegardée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la version",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (version: string) => {
    setLoading(true);
    try {
      const success = versioningSystem.restoreVersion(version);
      if (success) {
        toast({
          title: "Version restaurée",
          description: `Version ${version} restaurée avec succès`,
        });
        
        // Recharger la page pour appliquer les changements
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error('Échec de la restauration');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer la version",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVersion = async (version: string) => {
    try {
      const success = versioningSystem.deleteVersion(version);
      if (success) {
        loadVersions();
        toast({
          title: "Version supprimée",
          description: `Version ${version} supprimée`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la version",
        variant: "destructive",
      });
    }
  };

  const handleExportVersions = () => {
    try {
      const exportData = versioningSystem.exportVersions();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aloelocation_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Toutes les versions ont été exportées",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les versions",
        variant: "destructive",
      });
    }
  };

  const handleImportVersions = () => {
    if (!importData.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez coller les données à importer",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = versioningSystem.importVersions(importData);
      if (success) {
        setImportData("");
        setShowImportDialog(false);
        loadVersions();
        
        toast({
          title: "Import réussi",
          description: "Versions importées avec succès",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Format de données invalide",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = () => {
    try {
      versioningSystem.configureAutoBackup(autoBackupEnabled, backupInterval);
      
      const metadata = versioningSystem.getStats().metadata;
      metadata.maxVersions = maxVersions;
      
      setShowSettingsDialog(false);
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Configuration mise à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    }
  };

  const handleCleanupVersions = () => {
    try {
      const deletedCount = versioningSystem.cleanupOldVersions(20);
      loadVersions();
      
      toast({
        title: "Nettoyage effectué",
        description: `${deletedCount} anciennes versions supprimées`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de nettoyer les versions",
        variant: "destructive",
      });
    }
  };

  const checkIntegrity = () => {
    const integrity = versioningSystem.checkIntegrity();
    
    if (integrity.valid) {
      toast({
        title: "Intégrité OK",
        description: "Toutes les données sont valides",
      });
    } else {
      toast({
        title: "Problèmes détectés",
        description: `${integrity.errors.length} erreur(s) trouvée(s)`,
        variant: "destructive",
      });
    }
  };

  const repairData = () => {
    try {
      const success = versioningSystem.repairData();
      if (success) {
        loadVersions();
        toast({
          title: "Réparation réussie",
          description: "Données réparées avec succès",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de réparer les données",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stats = versioningSystem.getStats();
  const currentVersion = versioningSystem.getCurrentVersion();

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header avec actions principales */}
      <div className="modern-card animate-gentle-fade-in max-w-7xl mx-auto">
        <div className="p-4 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-0 mb-6 lg:mb-8">
            <div className="flex items-center gap-3">
              <div className="icon-wrapper">
                <GitBranch className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg lg:text-2xl font-bold gradient-text">🔄 Gestionnaire de Versions</h2>
                <p className="text-sm text-muted-foreground">Version actuelle: <span className="font-bold text-primary">{currentVersion}</span></p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="modern-button text-xs lg:text-sm">
                    <Save className="h-4 w-4 mr-2" />
                    💾 Créer Version
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportVersions}
                className="rounded-2xl hover:scale-105 transition-all duration-300 text-xs lg:text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                📥 Exporter
              </Button>
              
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl hover:scale-105 transition-all duration-300 text-xs lg:text-sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    📤 Importer
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl hover:scale-105 transition-all duration-300 text-xs lg:text-sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    ⚙️ Config
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>

          {/* Statistiques du système */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="icon-wrapper p-1.5 lg:p-3">
                  <Archive className="h-6 w-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-xl lg:text-3xl font-bold text-primary">{stats.totalVersions}</p>
                  <p className="text-xs lg:text-sm text-muted-foreground">Versions</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="icon-wrapper p-1.5 lg:p-3">
                  <Database className="h-6 w-6 text-success" />
                </div>
                <div className="text-right">
                  <p className="text-lg lg:text-2xl font-bold text-success">{formatSize(stats.totalSize)}</p>
                  <p className="text-xs lg:text-sm text-muted-foreground">Taille totale</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="icon-wrapper p-1.5 lg:p-3">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div className="text-right">
                  <p className="text-sm lg:text-lg font-bold text-warning">
                    {stats.metadata?.autoBackupEnabled ? `${stats.metadata.backupInterval}min` : 'OFF'}
                  </p>
                  <p className="text-xs lg:text-sm text-muted-foreground">Auto-backup</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="icon-wrapper p-1.5 lg:p-3">
                  <Shield className="h-6 w-6 text-info" />
                </div>
                <div className="text-right">
                  <p className="text-lg lg:text-2xl font-bold text-info">
                    {versioningSystem.checkIntegrity().valid ? '✅' : '❌'}
                  </p>
                  <p className="text-xs lg:text-sm text-muted-foreground">Intégrité</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions de maintenance */}
          <div className="flex flex-wrap gap-2 lg:gap-3 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={checkIntegrity}
              className="rounded-2xl hover:scale-105 transition-all duration-300 text-xs lg:text-sm"
            >
              <Shield className="h-4 w-4 mr-2" />
              🔍 Vérifier
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={repairData}
              className="rounded-2xl hover:scale-105 transition-all duration-300 text-xs lg:text-sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              🔧 Réparer
            </Button>
            
            <ConfirmDialog
              title="Nettoyer les anciennes versions"
              description="Cela supprimera toutes les versions sauf les 20 plus récentes. Cette action est irréversible."
              onConfirm={handleCleanupVersions}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-2xl hover:scale-105 transition-all duration-300 text-xs lg:text-sm"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  🧹 Nettoyer
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Liste des versions */}
      <div className="modern-card animate-smooth-scale-in max-w-7xl mx-auto" style={{ animationDelay: '0.2s' }}>
        <div className="p-4 lg:p-8">
          <div className="flex items-center gap-3 mb-6 lg:mb-8">
            <div className="icon-wrapper">
              <History className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold gradient-text">📚 Historique des Versions</h3>
          </div>
          
          {versions.length === 0 ? (
            <div className="text-center py-8 lg:py-16 text-muted-foreground">
              <div className="icon-wrapper mx-auto mb-6 opacity-50">
                <History className="h-12 lg:h-16 w-12 lg:w-16" />
              </div>
              <p className="text-base lg:text-lg">Aucune version sauvegardée</p>
              <p className="text-sm text-muted-foreground mt-2">Créez votre première version pour commencer</p>
            </div>
          ) : (
            <div className="space-y-3 lg:space-y-4">
              {versions.map((version, index) => (
                <div key={version.version} className="modern-card p-4 lg:p-6 animate-elegant-slide" style={{ animationDelay: `${0.3 + index * 0.05}s` }}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-0">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:gap-4 mb-3">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <Badge variant={index === 0 ? "default" : "secondary"} className="rounded-full px-3 py-1 text-xs font-bold">
                            {index === 0 ? '🔥 ACTUELLE' : `v${version.version}`}
                          </Badge>
                          {index === 0 && (
                            <Badge variant="success" className="rounded-full px-2 py-1 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              EN COURS
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-bold text-base lg:text-lg">{version.description}</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6 text-xs lg:text-sm text-muted-foreground mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(version.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Par {version.author}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            <span>
                              {version.data.users.length} utilisateurs, {version.data.sales.length} ventes
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span className="font-mono text-xs">#{version.hash.substring(0, 8)}</span>
                          </div>
                        </div>
                      </div>

                      {version.changes.length > 0 && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-xl">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">📝 Changements :</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {version.changes.slice(0, 3).map((change, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>{change}</span>
                              </li>
                            ))}
                            {version.changes.length > 3 && (
                              <li className="text-primary font-medium">... et {version.changes.length - 3} autres</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 lg:ml-4">
                      {index !== 0 && (
                        <ConfirmDialog
                          title="Restaurer cette version"
                          description={`Êtes-vous sûr de vouloir restaurer la version ${version.version} ? L'état actuel sera sauvegardé automatiquement.`}
                          onConfirm={() => handleRestoreVersion(version.version)}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={loading}
                              className="rounded-2xl hover:scale-105 transition-all duration-300 h-8 w-8 lg:h-9 lg:w-auto lg:px-3"
                            >
                              <RefreshCw className="h-4 w-4" />
                              <span className="hidden lg:inline ml-2">Restaurer</span>
                            </Button>
                          }
                        />
                      )}
                      
                      {index !== 0 && (
                        <ConfirmDialog
                          title="Supprimer cette version"
                          description={`Êtes-vous sûr de vouloir supprimer définitivement la version ${version.version} ?`}
                          onConfirm={() => handleDeleteVersion(version.version)}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-2xl hover:scale-105 transition-all duration-300 text-destructive hover:text-destructive h-8 w-8 lg:h-9 lg:w-auto lg:px-3"
                            >
                              <Trash2 className="h-5 w-5" />
                              <span className="hidden lg:inline ml-2">Supprimer</span>
                            </Button>
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de création de version */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl modern-card border-0">
          <DialogHeader>
            <DialogTitle className="text-xl lg:text-2xl font-bold gradient-text">💾 Créer une Nouvelle Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 lg:space-y-6 mt-4 lg:mt-6">
            <div className="space-y-2">
              <Label htmlFor="versionDescription" className="text-sm font-semibold">📝 Description de la version *</Label>
              <Input
                id="versionDescription"
                value={newVersionDescription}
                onChange={(e) => setNewVersionDescription(e.target.value)}
                placeholder="Ex: Ajout de nouveaux utilisateurs et objectifs"
                className="friendly-input text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="versionChanges" className="text-sm font-semibold">🔄 Liste des changements (optionnel)</Label>
              <Textarea
                id="versionChanges"
                value={newVersionChanges}
                onChange={(e) => setNewVersionChanges(e.target.value)}
                placeholder="Un changement par ligne&#10;Ex: Ajout utilisateur Julie&#10;Modification objectifs vendeur1&#10;Nouvelle assurance Tous Risques"
                className="friendly-input text-sm min-h-[100px]"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">💡 Un changement par ligne</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                className="rounded-2xl hover:scale-105 transition-all duration-300 text-sm"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleCreateVersion} 
                disabled={loading}
                className="modern-button text-sm"
              >
                {loading ? "🔄 Création..." : "💾 Créer Version"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog des paramètres */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-xl modern-card border-0">
          <DialogHeader>
            <DialogTitle className="text-xl lg:text-2xl font-bold gradient-text">⚙️ Configuration du Versioning</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 lg:space-y-6 mt-4 lg:mt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">🔄 Sauvegarde automatique</Label>
                <p className="text-xs text-muted-foreground">Créer des versions automatiquement</p>
              </div>
              <Switch
                checked={autoBackupEnabled}
                onCheckedChange={setAutoBackupEnabled}
              />
            </div>

            {autoBackupEnabled && (
              <div className="space-y-2">
                <Label htmlFor="backupInterval" className="text-sm font-semibold">⏰ Intervalle (minutes)</Label>
                <Input
                  id="backupInterval"
                  type="number"
                  min="5"
                  max="1440"
                  value={backupInterval}
                  onChange={(e) => setBackupInterval(parseInt(e.target.value) || 30)}
                  className="friendly-input text-sm"
                />
                <p className="text-xs text-muted-foreground">Entre 5 minutes et 24 heures</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="maxVersions" className="text-sm font-semibold">📦 Nombre max de versions</Label>
              <Input
                id="maxVersions"
                type="number"
                min="10"
                max="200"
                value={maxVersions}
                onChange={(e) => setMaxVersions(parseInt(e.target.value) || 50)}
                className="friendly-input text-sm"
              />
              <p className="text-xs text-muted-foreground">Les plus anciennes seront supprimées automatiquement</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowSettingsDialog(false)}
                className="rounded-2xl hover:scale-105 transition-all duration-300 text-sm"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSaveSettings}
                className="modern-button text-sm"
              >
                💾 Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'import */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl modern-card border-0">
          <DialogHeader>
            <DialogTitle className="text-xl lg:text-2xl font-bold gradient-text">📤 Importer des Versions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 lg:space-y-6 mt-4 lg:mt-6">
            <div className="space-y-2">
              <Label htmlFor="importData" className="text-sm font-semibold">📋 Données JSON à importer</Label>
              <Textarea
                id="importData"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Collez ici le contenu du fichier JSON exporté..."
                className="friendly-input text-sm min-h-[200px]"
                rows={8}
              />
              <p className="text-xs text-muted-foreground">⚠️ Une sauvegarde automatique sera créée avant l'import</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowImportDialog(false)}
                className="rounded-2xl hover:scale-105 transition-all duration-300 text-sm"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleImportVersions}
                className="modern-button text-sm"
              >
                📤 Importer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};