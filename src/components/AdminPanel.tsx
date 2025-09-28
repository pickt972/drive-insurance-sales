import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, Euro, Users, Trash2, CreditCard as Edit, Key, Eye, EyeOff, Target, Car, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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
  const [newObjectiveAmount, setNewObjectiveAmount] = useState("");
  const [newObjectiveSales, setNewObjectiveSales] = useState("");
  const [newObjectivePeriod, setNewObjectivePeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [newObjectiveDescription, setNewObjectiveDescription] = useState("");
  
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
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    const result = await updateUser(editingUser.username, {
      firstName: editFirstName,
      lastName: editLastName,
      email: editEmail,
      role: editRole
    });

    if (result.success) {
      setEditingUser(null);
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

    const result = await addObjective({
      employeeName: newObjectiveEmployee,
      targetAmount: amount,
      targetSalesCount: salesCount,
      period: newObjectivePeriod,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      description: newObjectiveDescription || `Objectif ${newObjectivePeriod} pour ${newObjectiveEmployee}`
    });
    
    if (result.success) {
      setNewObjectiveEmployee("");
      setNewObjectiveAmount("");
      setNewObjectiveSales("");
      setNewObjectivePeriod('monthly');
      setNewObjectiveDescription("");
    }
  };

  const handleRemoveObjective = async (id: string, employeeName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'objectif de ${employeeName} ?`)) {
      await removeObjective(id);
    }
  };

  // Calculer les statistiques d'objectifs
  const getObjectiveProgress = (objective: any) => {
    const employeeSales = sales.filter(sale => 
      sale.employeeName === objective.employeeName &&
      new Date(sale.createdAt) >= new Date(objective.startDate) &&
      new Date(sale.createdAt) <= new Date(objective.endDate)
    );
    
    const achievedAmount = employeeSales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
    const achievedSales = employeeSales.length;
    
    const amountProgress = Math.min((achievedAmount / objective.targetAmount) * 100, 100);
    const salesProgress = Math.min((achievedSales / objective.targetSalesCount) * 100, 100);
    
    return {
      achievedAmount,
      achievedSales,
      amountProgress,
      salesProgress,
      overallProgress: (amountProgress + salesProgress) / 2
    };
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600 bg-green-100';
    if (progress >= 75) return 'text-yellow-600 bg-yellow-100';
    if (progress >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Gestion des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gestion des Utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddUser} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              <div>
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: vendeur3"
                />
              </div>
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="Ex: Pierre"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="Ex: Durand"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="vendeur3@aloelocation.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <select
                  id="role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'employee')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="employee">Employé</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "Ajout..." : "Ajouter"}
                </Button>
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <h3 className="font-medium">Utilisateurs existants</h3>
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-sm text-muted-foreground">@{user.username}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Admin' : 'Employé'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangePassword(user.username)}
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                  {user.username !== 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveUser(user.username)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog d'édition utilisateur */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier {editingUser?.firstName} {editingUser?.lastName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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

      {/* Dialog de changement de mot de passe */}
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

      {/* Gestion des assurances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Gestion des Assurances Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddInsurance} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="insuranceName">Nom de l'assurance</Label>
                <Input
                  id="insuranceName"
                  value={newInsuranceName}
                  onChange={(e) => setNewInsuranceName(e.target.value)}
                  placeholder="Ex: Assurance Tous Risques"
                />
              </div>
              <div>
                <Label htmlFor="insuranceCommission">Commission (€)</Label>
                <Input
                  id="insuranceCommission"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newInsuranceCommission}
                  onChange={(e) => setNewInsuranceCommission(e.target.value)}
                  placeholder="25.00"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <h3 className="font-medium">Assurances disponibles</h3>
            {insuranceTypes.filter(ins => ins.isActive).map((insurance) => (
              <div key={insurance.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Car className="h-4 w-4 text-primary" />
                  <span className="font-medium">{insurance.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-success font-medium">
                    <Euro className="h-4 w-4" />
                    <span>{insurance.commission.toFixed(2)} €</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditInsurance(insurance)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveInsurance(insurance.id, insurance.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Gestion des Objectifs Commerciaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddObjective} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <Label htmlFor="objectiveEmployee">Employé</Label>
                <select
                  id="objectiveEmployee"
                  value={newObjectiveEmployee}
                  onChange={(e) => setNewObjectiveEmployee(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner</option>
                  {users.filter(u => u.role === 'employee').map(user => (
                    <option key={user.username} value={user.username}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="objectiveAmount">Objectif CA (€)</Label>
                <Input
                  id="objectiveAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newObjectiveAmount}
                  onChange={(e) => setNewObjectiveAmount(e.target.value)}
                  placeholder="500.00"
                />
              </div>
              <div>
                <Label htmlFor="objectiveSales">Nb Ventes</Label>
                <Input
                  id="objectiveSales"
                  type="number"
                  min="0"
                  value={newObjectiveSales}
                  onChange={(e) => setNewObjectiveSales(e.target.value)}
                  placeholder="20"
                />
              </div>
              <div>
                <Label htmlFor="objectivePeriod">Période</Label>
                <select
                  id="objectivePeriod"
                  value={newObjectivePeriod}
                  onChange={(e) => setNewObjectivePeriod(e.target.value as 'monthly' | 'quarterly' | 'yearly')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="monthly">Mensuel</option>
                  <option value="quarterly">Trimestriel</option>
                  <option value="yearly">Annuel</option>
                </select>
              </div>
              <div>
                <Label htmlFor="objectiveDescription">Description</Label>
                <Input
                  id="objectiveDescription"
                  value={newObjectiveDescription}
                  onChange={(e) => setNewObjectiveDescription(e.target.value)}
                  placeholder="Optionnel"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer
                </Button>
              </div>
            </div>
          </form>

          <div className="space-y-4">
            <h3 className="font-medium">Objectifs actifs avec progression</h3>
            {objectives.map((objective) => {
              const progress = getObjectiveProgress(objective);
              const progressColor = getProgressColor(progress.overallProgress);
              
              return (
                <div key={objective.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">
                        {users.find(u => u.username === objective.employeeName)?.firstName} {users.find(u => u.username === objective.employeeName)?.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {objective.description} • {objective.period === 'monthly' ? 'Mensuel' : objective.period === 'quarterly' ? 'Trimestriel' : 'Annuel'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${progressColor}`}>
                        {progress.overallProgress.toFixed(0)}%
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveObjective(objective.id, objective.employeeName)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Chiffre d'affaires</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{progress.achievedAmount.toFixed(2)} € / {objective.targetAmount.toFixed(2)} €</span>
                        <span className="text-sm font-medium">{progress.amountProgress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progress.amountProgress >= 100 ? 'bg-green-500' :
                            progress.amountProgress >= 75 ? 'bg-yellow-500' :
                            progress.amountProgress >= 50 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(progress.amountProgress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Nombre de ventes</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{progress.achievedSales} / {objective.targetSalesCount}</span>
                        <span className="text-sm font-medium">{progress.salesProgress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progress.salesProgress >= 100 ? 'bg-green-500' :
                            progress.salesProgress >= 75 ? 'bg-yellow-500' :
                            progress.salesProgress >= 50 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(progress.salesProgress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {objectives.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun objectif défini</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Statistiques Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{users.length}</div>
              <div className="text-sm text-muted-foreground">Utilisateurs</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-success">{insuranceTypes.filter(ins => ins.isActive).length}</div>
              <div className="text-sm text-muted-foreground">Types d'assurances</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-warning">{sales.length}</div>
              <div className="text-sm text-muted-foreground">Ventes totales</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};