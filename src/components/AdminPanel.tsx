import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, Euro, Users, Trash2, CreditCard as Edit, Key, Eye, EyeOff, Target, Car, Shield, User, TrendingUp, GitBranch, Save, Download, Upload, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { VersionManager } from "@/components/VersionManager";
import { versioningSystem } from "@/lib/versioning";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const AdminPanel = () => {
  const [newUsername, setNewUsername] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<'admin' | 'employee'>('employee');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<'admin' | 'employee'>('employee');
  const [editUsername, setEditUsername] = useState("");
  const [changingPassword, setChangingPassword] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // États pour la gestion des assurances
  const [newInsuranceName, setNewInsuranceName] = useState("");
  const [newInsuranceCommission, setNewInsuranceCommission] = useState("");
  const [editingInsurance, setEditingInsurance] = useState<any>(null);
  const [editInsuranceName, setEditInsuranceName] = useState("");
  const [editInsuranceCommission, setEditInsuranceCommission] = useState("");
  
  // États pour la gestion des objectifs
  const [newObjectiveEmployee, setNewObjectiveEmployee] = useState("");
  const [newObjectiveType, setNewObjectiveType] = useState<'amount' | 'sales_count'>('amount');
  const [newObjectiveAmount, setNewObjectiveAmount] = useState("");
  const [newObjectiveSales, setNewObjectiveSales] = useState("");
  const [newObjectivePeriod, setNewObjectivePeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [newObjectiveDescription, setNewObjectiveDescription] = useState("");
  
  // États pour l'édition des objectifs
  const [editingObjective, setEditingObjective] = useState<any>(null);
  const [editObjectiveEmployee, setEditObjectiveEmployee] = useState("");
  const [editObjectiveType, setEditObjectiveType] = useState<'amount' | 'sales_count'>('amount');
  const [editObjectiveAmount, setEditObjectiveAmount] = useState("");
  const [editObjectiveSales, setEditObjectiveSales] = useState("");
  const [editObjectivePeriod, setEditObjectivePeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [editObjectiveDescription, setEditObjectiveDescription] = useState("");
  
  // États pour le versioning
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [versionDescription, setVersionDescription] = useState("");
  const [versionChanges, setVersionChanges] = useState("");
  
  const { 
    users, 
    addUser, 
    updateUserRole, 
    removeUser, 
    fetchUsers, 
    updateUser, 
    updatePassword,
    insuranceTypes,
    addInsuranceType,
    updateInsuranceType,
    removeInsuranceType,
    fetchInsuranceTypes,
    sales,
    objectives,
    addObjective,
    updateObjective,
    removeObjective,
    fetchObjectives
  } = useAuth();

  useEffect(() => {
    fetchUsers();
    fetchInsuranceTypes();
    fetchObjectives();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUsername || !newFirstName || !newLastName || !newEmail || !newPassword) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await addUser(newUsername, newFirstName, newLastName, newEmail, newPassword, newRole);
    
    if (result.success) {
      setNewUsername("");
      setNewFirstName("");
      setNewLastName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole('employee');
    }
    
    setLoading(false);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    const result = await updateUser(editingUser.username, {
      username: editUsername,
      firstName: editFirstName,
      lastName: editLastName,
      email: editEmail,
      role: editRole
    });

    if (result.success) {
      setEditingUser(null);
      setEditUsername("");
      setEditFirstName("");
      setEditLastName("");
      setEditEmail("");
      setEditRole('employee');
    }
  };

  const handleChangePassword = (username: string) => {
    setChangingPassword(username);
    setNewPasswordValue("");
    setConfirmPasswordValue("");
    setShowChangePassword(false);
    setShowConfirmPassword(false);
  };

  const handleSavePassword = async () => {
    if (!changingPassword || !newPasswordValue || !confirmPasswordValue) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir et confirmer le nouveau mot de passe",
        variant: "destructive",
      });
      return;
    }

    if (newPasswordValue !== confirmPasswordValue) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    const result = await updatePassword(changingPassword, newPasswordValue);
    
    if (result.success) {
      setChangingPassword(null);
      setNewPasswordValue("");
      setConfirmPasswordValue("");
      setShowChangePassword(false);
      setShowConfirmPassword(false);
    }
  };

  const handleRemoveUser = async (username: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${username} ?`)) {
      await removeUser(username);
    }
  };

  // Gestion des assurances
  const handleAddInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newInsuranceName || !newInsuranceCommission) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    const commission = parseFloat(newInsuranceCommission);
    if (isNaN(commission) || commission < 0) {
      toast({
        title: "Erreur",
        description: "La commission doit être un nombre positif",
        variant: "destructive",
      });
      return;
    }

    const result = await addInsuranceType(newInsuranceName, commission);
    
    if (result.success) {
      setNewInsuranceName("");
      setNewInsuranceCommission("");
    }
  };

  const handleEditInsurance = (insurance: any) => {
    setEditingInsurance(insurance);
    setEditInsuranceName(insurance.name);
    setEditInsuranceCommission(insurance.commission.toString());
  };

  const handleSaveInsuranceEdit = async () => {
    if (!editingInsurance) return;

    const commission = parseFloat(editInsuranceCommission);
    if (isNaN(commission) || commission < 0) {
      toast({
        title: "Erreur",
        description: "La commission doit être un nombre positif",
        variant: "destructive",
      });
      return;
    }

    const result = await updateInsuranceType(editingInsurance.id, editInsuranceName, commission);

    if (result.success) {
      setEditingInsurance(null);
      setEditInsuranceName("");
      setEditInsuranceCommission("");
    }
  };

  const handleRemoveInsurance = async (id: string, name: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'assurance "${name}" ?`)) {
      await removeInsuranceType(id);
    }
  };

  // Gestion des objectifs
  const handleAddObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newObjectiveEmployee || !newObjectiveAmount || !newObjectiveSales) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(newObjectiveAmount);
    const salesCount = parseInt(newObjectiveSales);
    
    if (isNaN(amount) || amount < 0 || isNaN(salesCount) || salesCount < 0) {
      toast({
        title: "Erreur",
        description: "Les montants doivent être des nombres positifs",
        variant: "destructive",
      });
      return;
    }

    // Calculer les dates selon la période
    const now = new Date();
    let startDate: Date, endDate: Date;
    
    switch (newObjectivePeriod) {
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
    }

    console.log('📅 Création objectif - Période:', newObjectivePeriod);
    console.log('📅 Dates calculées:', startDate.toISOString(), 'à', endDate.toISOString());

    const result = await addObjective({
      employeeName: newObjectiveEmployee,
      objectiveType: newObjectiveType,
      targetAmount: amount,
      targetSalesCount: salesCount,
      period: newObjectivePeriod,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      description: newObjectiveDescription || `Objectif ${newObjectivePeriod} pour ${newObjectiveEmployee}`
    });
    
    if (result.success) {
      setNewObjectiveEmployee("");
      setNewObjectiveType('amount');
      setNewObjectiveAmount("");
      setNewObjectiveSales("");
      setNewObjectivePeriod('monthly');
      setNewObjectiveDescription("");
    }
  };

  const handleEditObjective = (objective: any) => {
    setEditingObjective(objective);
    setEditObjectiveEmployee(objective.employeeName);
    setEditObjectiveType(objective.objectiveType);
    setEditObjectiveAmount(objective.targetAmount.toString());
    setEditObjectiveSales(objective.targetSalesCount.toString());
    setEditObjectivePeriod(objective.period);
    setEditObjectiveDescription(objective.description || "");
  };

  const handleSaveObjectiveEdit = async () => {
    if (!editingObjective) return;

    const amount = parseFloat(editObjectiveAmount);
    const salesCount = parseInt(editObjectiveSales);
    
    if (isNaN(amount) || amount < 0 || isNaN(salesCount) || salesCount < 0) {
      toast({
        title: "Erreur",
        description: "Les montants doivent être des nombres positifs",
        variant: "destructive",
      });
      return;
    }

    const result = await updateObjective(editingObjective.id, {
      employeeName: editObjectiveEmployee,
      objectiveType: editObjectiveType,
      targetAmount: amount,
      targetSalesCount: salesCount,
      period: editObjectivePeriod,
      description: editObjectiveDescription || `Objectif ${editObjectivePeriod} pour ${editObjectiveEmployee}`
    });

    if (result.success) {
      setEditingObjective(null);
      setEditObjectiveEmployee("");
      setEditObjectiveType('amount');
      setEditObjectiveAmount("");
      setEditObjectiveSales("");
      setEditObjectivePeriod('monthly');
      setEditObjectiveDescription("");
    }
  };

  const handleRemoveObjective = async (id: string, employeeName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'objectif de ${employeeName} ?`)) {
      await removeObjective(id);
    }
  };

  // Calculer les statistiques d'objectifs
  const getObjectiveProgress = (objective: any) => {
    console.log('🔍 Calcul progression pour:', objective.employeeName);
    console.log('📅 Période objectif:', objective.startDate, 'à', objective.endDate);
    
    const employeeSales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      const startDate = new Date(objective.startDate);
      const endDate = new Date(objective.endDate);
      
      const employeeMatch = sale.employeeName.toLowerCase() === objective.employeeName.toLowerCase();
      const dateMatch = saleDate >= startDate && saleDate <= endDate;
      
      console.log('🔍 Vente:', sale.employeeName, 'vs', objective.employeeName, '=', employeeMatch);
      console.log('📅 Date vente:', saleDate.toLocaleDateString(), 'dans période?', dateMatch);
      console.log('📅 Période:', startDate.toLocaleDateString(), 'à', endDate.toLocaleDateString());
      
      return employeeMatch && dateMatch;
    });
    
    console.log('📊 Ventes trouvées pour', objective.employeeName, ':', employeeSales.length);
    console.log('📊 Détail des ventes:', employeeSales.map(s => ({
      client: s.clientName,
      date: new Date(s.createdAt).toLocaleDateString(),
      commission: s.commissionAmount
    })));
    
    const achievedAmount = employeeSales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
    const achievedSales = employeeSales.length;
    
    console.log('💰 Montant atteint:', achievedAmount, '/ Objectif:', objective.targetAmount);
    console.log('📈 Ventes atteintes:', achievedSales, '/ Objectif:', objective.targetSalesCount);
    
    let progress = 0;
    if (objective.objectiveType === 'amount') {
      progress = Math.min((achievedAmount / objective.targetAmount) * 100, 100);
    } else {
      progress = Math.min((achievedSales / objective.targetSalesCount) * 100, 100);
    }
    
    console.log('📊 Progression calculée:', progress, '%');
    
    return {
      achievedAmount,
      achievedSales,
      progress,
      objectiveType: objective.objectiveType
    };
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600 bg-green-100';
    if (progress >= 75) return 'text-yellow-600 bg-yellow-100';
    if (progress >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  // Fonction pour créer une version manuelle
  const handleCreateVersion = async () => {
    if (!versionDescription.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une description",
        variant: "destructive",
      });
      return;
    }

    try {
      const changes = versionChanges.trim() 
        ? versionChanges.split('\n').map(line => line.trim()).filter(line => line)
        : [];
      
      versioningSystem.createVersion(
        versionDescription.trim(),
        changes,
        `${users.find(u => u.username === 'admin')?.firstName || 'Admin'} ${users.find(u => u.username === 'admin')?.lastName || 'Système'}`
      );

      setVersionDescription("");
      setVersionChanges("");
      setShowVersionDialog(false);

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
    }
  };

  // Fonction pour exporter les données
  const handleExportData = () => {
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
        description: "Sauvegarde téléchargée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Actions de sauvegarde rapides */}
      <div className="modern-card animate-gentle-fade-in max-w-7xl mx-auto">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-0">
            <div className="flex items-center gap-3">
              <div className="icon-wrapper">
                <GitBranch className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold gradient-text">💾 Sauvegarde & Versioning</h2>
                <p className="text-sm text-muted-foreground">Version actuelle: <span className="font-bold text-primary">{versioningSystem.getCurrentVersion()}</span></p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
                <DialogTrigger asChild>
                  <Button className="modern-button text-xs lg:text-sm">
                    <Save className="h-4 w-4 mr-2" />
                    💾 Sauvegarder
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl modern-card border-0">
                  <DialogHeader>
                    <DialogTitle className="text-xl lg:text-2xl font-bold gradient-text">💾 Créer une Sauvegarde</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 lg:space-y-6 mt-4 lg:mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="versionDescription" className="text-sm font-semibold">📝 Description de la sauvegarde *</Label>
                      <Input
                        id="versionDescription"
                        value={versionDescription}
                        onChange={(e) => setVersionDescription(e.target.value)}
                        placeholder="Ex: Sauvegarde après ajout nouveaux utilisateurs"
                        className="friendly-input text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="versionChanges" className="text-sm font-semibold">🔄 Changements effectués (optionnel)</Label>
                      <textarea
                        id="versionChanges"
                        value={versionChanges}
                        onChange={(e) => setVersionChanges(e.target.value)}
                        placeholder="Un changement par ligne&#10;Ex: Ajout utilisateur Julie&#10;Modification objectifs vendeur1"
                        className="friendly-input text-sm min-h-[100px] w-full resize-none"
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">💡 Un changement par ligne</p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowVersionDialog(false)}
                        className="rounded-2xl hover:scale-105 transition-all duration-300 text-sm"
                      >
                        Annuler
                      </Button>
                      <Button 
                        onClick={handleCreateVersion}
                        className="modern-button text-sm"
                      >
                        💾 Créer Sauvegarde
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="rounded-2xl hover:scale-105 transition-all duration-300 text-xs lg:text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                📥 Exporter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets d'administration */}
      <Tabs defaultValue="users" className="max-w-7xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6 lg:mb-8">
          <TabsTrigger value="users" className="text-xs lg:text-sm">👥 Utilisateurs</TabsTrigger>
          <TabsTrigger value="insurances" className="text-xs lg:text-sm">🛡️ Assurances</TabsTrigger>
          <TabsTrigger value="objectives" className="text-xs lg:text-sm">🎯 Objectifs</TabsTrigger>
          <TabsTrigger value="versioning" className="text-xs lg:text-sm">🔄 Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
      {/* Gestion des utilisateurs */}
          <div className="modern-card animate-gentle-fade-in">
        <div className="p-4 lg:p-8">
          <div className="flex items-center gap-3 mb-6 lg:mb-8">
            <div className="icon-wrapper">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg lg:text-2xl font-bold gradient-text">👥 Gestion des Utilisateurs</h2>
          </div>
          
          <form onSubmit={handleAddUser} className="space-y-4 lg:space-y-6 mb-6 lg:mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 lg:gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: vendeur3"
                  className="friendly-input text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-semibold">Prénom</Label>
                <Input
                  id="firstName"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="Ex: Pierre"
                  className="friendly-input text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-semibold">Nom</Label>
                <Input
                  id="lastName"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="Ex: Durand"
                  className="friendly-input text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="vendeur3@aloelocation.com"
                  className="friendly-input text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="friendly-input text-sm pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-xl hover:bg-muted/50"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-semibold">Rôle</Label>
                <select
                  id="role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'employee')}
                  className="friendly-input text-sm"
                >
                  <option value="employee">Employé</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="modern-button w-full" disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "🔄 Ajout..." : "➕ Ajouter"}
                </Button>
              </div>
            </div>
          </form>

          <div className="space-y-4">
            <h3 className="font-bold text-base lg:text-lg text-foreground">Utilisateurs existants</h3>
            {users.map((user) => (
              <div key={user.id} className="modern-card p-3 lg:p-4 animate-elegant-slide">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
                    <div className="icon-wrapper">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm lg:text-base truncate">{user.firstName} {user.lastName}</div>
                      <div className="text-xs lg:text-sm text-muted-foreground truncate">@{user.username}</div>
                      <div className="text-xs text-muted-foreground truncate lg:hidden">{user.email}</div>
                    </div>
                    <div className="hidden lg:block text-xs text-muted-foreground">{user.email}</div>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="rounded-full text-xs">
                      {user.role === 'admin' ? 'Admin' : 'Employé'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 lg:gap-2 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="rounded-2xl hover:scale-105 transition-all duration-300 h-8 w-8 lg:h-9 lg:w-auto lg:px-3"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="hidden lg:inline ml-2">Modifier</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangePassword(user.username)}
                      className="rounded-2xl hover:scale-105 transition-all duration-300 h-8 w-8 lg:h-9 lg:w-auto lg:px-3"
                    >
                      <Key className="h-4 w-4" />
                      <span className="hidden lg:inline ml-2">MDP</span>
                    </Button>
                    {user.username !== 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveUser(user.username)}
                        className="rounded-2xl hover:scale-105 transition-all duration-300 text-destructive hover:text-destructive h-8 w-8 lg:h-9 lg:w-auto lg:px-3"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden lg:inline ml-2">Suppr</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="insurances">
      {/* Dialog d'édition utilisateur */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier {editingUser?.firstName} {editingUser?.lastName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editUsername">Nom d'utilisateur</Label>
              <Input
                id="editUsername"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Nom d'utilisateur"
              />
            </div>
            <div>
              <Label htmlFor="editFirstName">Prénom</Label>
              <Input
                id="editFirstName"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                placeholder="Prénom"
              />
            </div>
            <div>
              <Label htmlFor="editLastName">Nom</Label>
              <Input
                id="editLastName"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                placeholder="Nom de famille"
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="editRole">Rôle</Label>
              <select
                id="editRole"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as 'admin' | 'employee')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="employee">Employé</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Annuler
              </Button>
              <Button onClick={handleSaveEdit}>
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gestion des assurances */}
          <div className="modern-card animate-smooth-scale-in">
        <div className="p-4 lg:p-8">
          <div className="flex items-center gap-3 mb-6 lg:mb-8">
            <div className="icon-wrapper">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg lg:text-2xl font-bold gradient-text">🛡️ Gestion des Assurances</h2>
          </div>
          
          <form onSubmit={handleAddInsurance} className="space-y-4 lg:space-y-6 mb-6 lg:mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 lg:gap-4">
              <div className="lg:col-span-2 space-y-2">
                <Label htmlFor="insuranceName" className="text-sm font-semibold">Nom de l'assurance</Label>
                <Input
                  id="insuranceName"
                  value={newInsuranceName}
                  onChange={(e) => setNewInsuranceName(e.target.value)}
                  placeholder="Ex: Assurance Tous Risques"
                  className="friendly-input text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceCommission" className="text-sm font-semibold">Commission (€)</Label>
                <Input
                  id="insuranceCommission"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newInsuranceCommission}
                  onChange={(e) => setNewInsuranceCommission(e.target.value)}
                  placeholder="25.00"
                  className="friendly-input text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="modern-button w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  ➕ Ajouter
                </Button>
              </div>
            </div>
          </form>

          <div className="space-y-4">
            <h3 className="font-bold text-base lg:text-lg text-foreground">Assurances disponibles</h3>
            {insuranceTypes.filter(ins => ins.isActive).map((insurance) => (
              <div key={insurance.id} className="modern-card p-3 lg:p-4 animate-elegant-slide">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
                    <div className="icon-wrapper">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold text-sm lg:text-base truncate">{insurance.name}</span>
                  </div>
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="success-indicator text-xs lg:text-sm">
                      <Euro className="h-4 w-4" />
                      <span className="font-bold">{insurance.commission.toFixed(2)} €</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditInsurance(insurance)}
                      className="rounded-2xl hover:scale-105 transition-all duration-300 h-8 w-8 lg:h-9 lg:w-auto lg:px-3"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="hidden lg:inline ml-2">Modifier</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveInsurance(insurance.id, insurance.name)}
                      className="rounded-2xl hover:scale-105 transition-all duration-300 text-destructive hover:text-destructive h-8 w-8 lg:h-9 lg:w-auto lg:px-3"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden lg:inline ml-2">Suppr</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="objectives">
      {/* Dialog d'édition assurance */}
      <Dialog open={!!editingInsurance} onOpenChange={(open) => !open && setEditingInsurance(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier {editingInsurance?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editInsuranceName">Nom de l'assurance</Label>
              <Input
                id="editInsuranceName"
                value={editInsuranceName}
                onChange={(e) => setEditInsuranceName(e.target.value)}
                placeholder="Nom de l'assurance"
              />
            </div>
            <div>
              <Label htmlFor="editInsuranceCommission">Commission (€)</Label>
              <Input
                id="editInsuranceCommission"
                type="number"
                step="0.01"
                min="0"
                value={editInsuranceCommission}
                onChange={(e) => setEditInsuranceCommission(e.target.value)}
                placeholder="25.00"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingInsurance(null)}>
                Annuler
              </Button>
              <Button onClick={handleSaveInsuranceEdit}>
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gestion des objectifs */}
          <div className="modern-card animate-smooth-scale-in">
        <div className="p-4 lg:p-8">
          <div className="flex items-center gap-3 mb-6 lg:mb-8">
            <div className="icon-wrapper">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg lg:text-2xl font-bold gradient-text">🎯 Gestion des Objectifs</h2>
          </div>
          
          <form onSubmit={handleAddObjective} className="space-y-4 lg:space-y-6 mb-6 lg:mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 lg:gap-4">
              <div className="space-y-2">
                <Label htmlFor="objectiveEmployee" className="text-sm font-semibold">Employé</Label>
                <select
                  id="objectiveEmployee"
                  value={newObjectiveEmployee}
                  onChange={(e) => setNewObjectiveEmployee(e.target.value)}
                  className="friendly-input text-sm"
                >
                  <option value="">Sélectionner</option>
                  {users.filter(u => u.role === 'employee').map(user => (
                    <option key={user.username} value={user.username}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="objectiveType" className="text-sm font-semibold">Type</Label>
                <select
                  id="objectiveType"
                  value={newObjectiveType}
                  onChange={(e) => setNewObjectiveType(e.target.value as 'amount' | 'sales_count')}
                  className="friendly-input text-sm"
                >
                  <option value="amount">Chiffre d'affaires</option>
                  <option value="sales_count">Nombre de ventes</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="objectiveAmount">
                  CA (€)
                </Label>
                <Input
                  id="objectiveAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newObjectiveAmount}
                  onChange={(e) => setNewObjectiveAmount(e.target.value)}
                  placeholder="500.00"
                  className="friendly-input text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objectiveSales">
                  Ventes
                </Label>
                <Input
                  id="objectiveSales"
                  type="number"
                  min="0"
                  value={newObjectiveSales}
                  onChange={(e) => setNewObjectiveSales(e.target.value)}
                  placeholder="20"
                  className="friendly-input text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objectivePeriod" className="text-sm font-semibold">Période</Label>
                <select
                  id="objectivePeriod"
                  value={newObjectivePeriod}
                  onChange={(e) => setNewObjectivePeriod(e.target.value as 'monthly' | 'quarterly' | 'yearly')}
                  className="friendly-input text-sm"
                >
                  <option value="monthly">Mensuel</option>
                  <option value="quarterly">Trimestriel</option>
                  <option value="yearly">Annuel</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="objectiveDescription" className="text-sm font-semibold">Description</Label>
                <Input
                  id="objectiveDescription"
                  value={newObjectiveDescription}
                  onChange={(e) => setNewObjectiveDescription(e.target.value)}
                  placeholder="Optionnel"
                  className="friendly-input text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="modern-button w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  🎯 Créer
                </Button>
              </div>
            </div>
          </form>

          <div className="space-y-6">
            <h3 className="font-bold text-base lg:text-lg text-foreground">Objectifs actifs avec progression</h3>
            {objectives.map((objective) => {
              const progress = getObjectiveProgress(objective);
              const progressColor = getProgressColor(progress.progress);
              
              return (
                <div key={objective.id} className="modern-card p-4 lg:p-6 animate-elegant-slide">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3 lg:gap-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base lg:text-lg truncate">
                        {users.find(u => u.username === objective.employeeName)?.firstName} {users.find(u => u.username === objective.employeeName)?.lastName}
                      </div>
                      <div className="text-sm lg:text-base text-muted-foreground">
                        {objective.description} • {objective.period === 'monthly' ? 'Mensuel' : objective.period === 'quarterly' ? 'Trimestriel' : 'Annuel'} • {objective.objectiveType === 'amount' ? 'CA' : 'Ventes'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-3">
                      <div className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-2xl text-sm lg:text-base font-bold ${progressColor}`}>
                        {progress.progress.toFixed(0)}%
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditObjective(objective)}
                        className="rounded-2xl hover:scale-105 transition-all duration-300 h-8 w-8 lg:h-9 lg:w-auto lg:px-3"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="hidden lg:inline ml-2">Modifier</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveObjective(objective.id, objective.employeeName)}
                        className="rounded-2xl hover:scale-105 transition-all duration-300 text-destructive hover:text-destructive h-8 w-8 lg:h-9 lg:w-auto lg:px-3"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden lg:inline ml-2">Suppr</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 lg:space-y-3">
                    {objective.objectiveType === 'amount' ? (
                      <div>
                        <div className="text-sm lg:text-base font-semibold text-muted-foreground mb-2">💰 Chiffre d'affaires</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm lg:text-base font-medium">{progress.achievedAmount.toFixed(2)} € / {objective.targetAmount.toFixed(2)} €</span>
                          <span className="text-sm lg:text-base font-bold">{progress.progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 lg:h-4 mt-2">
                          <div 
                            className={`h-3 lg:h-4 rounded-full transition-all duration-500 ${
                              progress.progress >= 100 ? 'bg-gradient-to-r from-success to-success-variant' :
                              progress.progress >= 75 ? 'bg-gradient-to-r from-warning to-orange' :
                              progress.progress >= 50 ? 'bg-gradient-to-r from-orange to-destructive' : 'bg-gradient-to-r from-destructive to-destructive/80'
                            }`}
                            style={{ width: `${Math.min(progress.progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm lg:text-base font-semibold text-muted-foreground mb-2">📊 Nombre de ventes</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm lg:text-base font-medium">{progress.achievedSales} / {objective.targetSalesCount}</span>
                          <span className="text-sm lg:text-base font-bold">{progress.progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 lg:h-4 mt-2">
                          <div 
                            className={`h-3 lg:h-4 rounded-full transition-all duration-500 ${
                              progress.progress >= 100 ? 'bg-gradient-to-r from-success to-success-variant' :
                              progress.progress >= 75 ? 'bg-gradient-to-r from-warning to-orange' :
                              progress.progress >= 50 ? 'bg-gradient-to-r from-orange to-destructive' : 'bg-gradient-to-r from-destructive to-destructive/80'
                            }`}
                            style={{ width: `${Math.min(progress.progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {objectives.length === 0 && (
              <div className="text-center py-8 lg:py-16 text-muted-foreground">
                <div className="icon-wrapper mx-auto mb-6 opacity-50">
                  <Target className="h-12 lg:h-16 w-12 lg:w-16" />
                </div>
                <p className="text-base lg:text-lg">Aucun objectif défini</p>
              </div>
            )}
          </div>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="versioning">
          <VersionManager />
        </TabsContent>
      </Tabs>

      {/* Dialog d'édition objectif */}
      <Dialog open={!!editingObjective} onOpenChange={(open) => !open && setEditingObjective(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'objectif de {editingObjective?.employeeName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editObjectiveEmployee">Employé</Label>
                <select
                  id="editObjectiveEmployee"
                  value={editObjectiveEmployee}
                  onChange={(e) => setEditObjectiveEmployee(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {users.filter(u => u.role === 'employee').map(user => (
                    <option key={user.username} value={user.username}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="editObjectiveType">Type d'objectif</Label>
                <select
                  id="editObjectiveType"
                  value={editObjectiveType}
                  onChange={(e) => setEditObjectiveType(e.target.value as 'amount' | 'sales_count')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="amount">Chiffre d'affaires</option>
                  <option value="sales_count">Nombre de ventes</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="editObjectiveAmount">Objectif CA (€)</Label>
                <Input
                  id="editObjectiveAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editObjectiveAmount}
                  onChange={(e) => setEditObjectiveAmount(e.target.value)}
                  placeholder="500.00"
                />
              </div>
              <div>
                <Label htmlFor="editObjectiveSales">Nb Ventes</Label>
                <Input
                  id="editObjectiveSales"
                  type="number"
                  min="0"
                  value={editObjectiveSales}
                  onChange={(e) => setEditObjectiveSales(e.target.value)}
                  placeholder="20"
                />
              </div>
              <div>
                <Label htmlFor="editObjectivePeriod">Période</Label>
                <select
                  id="editObjectivePeriod"
                  value={editObjectivePeriod}
                  onChange={(e) => setEditObjectivePeriod(e.target.value as 'monthly' | 'quarterly' | 'yearly')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="monthly">Mensuel</option>
                  <option value="quarterly">Trimestriel</option>
                  <option value="yearly">Annuel</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="editObjectiveDescription">Description</Label>
              <Input
                id="editObjectiveDescription"
                value={editObjectiveDescription}
                onChange={(e) => setEditObjectiveDescription(e.target.value)}
                placeholder="Description de l'objectif"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingObjective(null)}>
                Annuler
              </Button>
              <Button onClick={handleSaveObjectiveEdit}>
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de changement de mot de passe - déplacé ici pour éviter les conflits */}
      <Dialog open={!!changingPassword} onOpenChange={(open) => !open && setChangingPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le mot de passe de {changingPassword}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showChangePassword ? "text" : "password"}
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowChangePassword(!showChangePassword)}
                >
                  {showChangePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPasswordValue}
                  onChange={(e) => setConfirmPasswordValue(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setChangingPassword(null)}>
                Annuler
              </Button>
              <Button onClick={handleSavePassword}>
                Changer le mot de passe
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};