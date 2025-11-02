# Guide de Migration Supabase

Ce guide explique comment appliquer les migrations SQL pour finaliser l'application de reporting de ventes d'assurance.

## 🚀 Changements Effectués

### 1. Schéma de Base de Données

Les migrations SQL suivantes ont été créées dans `supabase/migrations/` :

- **20240101000000_initial_schema.sql** : Schéma complet de la base de données
  - Tables : `profiles`, `user_roles`, `insurance_types`, `sales`, `sale_insurances`, `objectives`
  - Indexes pour optimiser les performances
  - Fonctions RPC : `get_current_profile()`, `has_role()`
  - Triggers pour les timestamps automatiques

- **20240101000001_rls_policies.sql** : Politiques de sécurité RLS (Row Level Security)
  - Politiques pour tous les niveaux d'utilisateur (admin, employé)
  - Accès sécurisé aux données selon les rôles
  - Les employés ne voient que leurs propres données
  - Les admins ont accès à toutes les données

### 2. Migration des Données

Les fonctionnalités suivantes ont été migrées depuis localStorage vers Supabase :

✅ **Objectifs de Vente**
- Stockage maintenant dans la table `objectives`
- CRUD complet via API Supabase

✅ **Types d'Assurance**
- Stockage maintenant dans la table `insurance_types`
- CRUD complet via API Supabase

### 3. Types TypeScript

Le fichier `src/integrations/supabase/types.d.ts` a été mis à jour avec tous les types correspondant au schéma de base de données.

### 4. Nettoyage du Code

- Suppression du debug box en bas de page
- Suppression des console.log de développement
- Conservation des console.error uniquement en mode DEV

## 📋 Étapes pour Appliquer les Migrations

### Option 1 : Via l'interface Supabase (Recommandé)

1. **Connectez-vous à votre projet Supabase**
   - URL : https://supabase.com/dashboard/project/jwvkvyhwhpbyruattzbx

2. **Accédez à l'éditeur SQL**
   - Dans le menu latéral, cliquez sur "SQL Editor"

3. **Exécutez la première migration (Schéma)**
   - Ouvrez le fichier `supabase/migrations/20240101000000_initial_schema.sql`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur SQL de Supabase
   - Cliquez sur "Run" pour exécuter

4. **Exécutez la deuxième migration (RLS Policies)**
   - Ouvrez le fichier `supabase/migrations/20240101000001_rls_policies.sql`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur SQL de Supabase
   - Cliquez sur "Run" pour exécuter

5. **Vérifiez les tables créées**
   - Dans le menu latéral, cliquez sur "Table Editor"
   - Vous devriez voir toutes les tables créées

### Option 2 : Via Supabase CLI

Si vous avez installé Supabase CLI :

```bash
# Installez Supabase CLI si ce n'est pas déjà fait
npm install -g supabase

# Liez votre projet
supabase link --project-ref jwvkvyhwhpbyruattzbx

# Appliquez les migrations
supabase db push
```

## 🔐 Configuration RLS

Les politiques RLS (Row Level Security) sont automatiquement appliquées lors de la migration. Elles garantissent que :

- **Employés** :
  - Peuvent lire leur propre profil et rôles
  - Peuvent créer/lire/modifier leurs propres ventes
  - Peuvent lire leurs propres objectifs
  - Peuvent lire tous les types d'assurance actifs

- **Administrateurs** :
  - Ont accès à toutes les données
  - Peuvent gérer les utilisateurs et leurs rôles
  - Peuvent gérer les types d'assurance
  - Peuvent créer/modifier/supprimer les objectifs
  - Peuvent voir toutes les ventes

## 🗃️ Migration des Données Existantes (localStorage → Supabase)

### Objectifs

Si vous avez des objectifs existants dans localStorage :

1. Connectez-vous en tant qu'administrateur
2. Les objectifs seront automatiquement vides après la migration
3. Recréez les objectifs via le panneau d'administration

### Types d'Assurance

Si vous avez des types d'assurance dans localStorage :

1. Connectez-vous en tant qu'administrateur
2. Allez dans "Administration" → "Types d'assurance"
3. Ajoutez les types d'assurance via l'interface

**Types d'assurance courants** :
- CDW (Collision Damage Waiver) - Commission: 15€
- TP (Theft Protection) - Commission: 10€
- PAI (Personal Accident Insurance) - Commission: 8€
- Super Cover - Commission: 25€

### Ventes Existantes

Les ventes existantes dans Supabase sont conservées. Aucune action n'est nécessaire.

## ✅ Vérification Post-Migration

Après avoir appliqué les migrations, vérifiez que :

1. ✅ Toutes les tables sont créées dans Supabase
2. ✅ Les politiques RLS sont actives (icône cadenas dans Table Editor)
3. ✅ Vous pouvez vous connecter avec un compte admin
4. ✅ Le panneau Administration est visible pour les admins
5. ✅ Vous pouvez créer un nouvel objectif
6. ✅ Vous pouvez créer un nouveau type d'assurance
7. ✅ Vous pouvez créer une nouvelle vente

## 🔧 Dépannage

### Erreur "relation does not exist"
- Vérifiez que les migrations ont été exécutées dans le bon ordre
- Exécutez d'abord `20240101000000_initial_schema.sql`
- Puis `20240101000001_rls_policies.sql`

### Erreur "permission denied"
- Vérifiez que les politiques RLS sont appliquées
- Vérifiez que l'utilisateur connecté a le bon rôle dans `user_roles`

### Les objectifs/assurances ne s'affichent pas
- Ouvrez la console du navigateur (F12)
- Vérifiez s'il y a des erreurs
- Vérifiez que les tables sont créées dans Supabase

### L'onglet Admin n'apparaît pas
- Vérifiez que l'utilisateur a le rôle 'admin' dans la table `user_roles`
- Déconnectez-vous et reconnectez-vous

## 🎉 Application Finalisée

Une fois les migrations appliquées, votre application est 100% fonctionnelle avec :

✅ Base de données complète sur Supabase
✅ Sécurité RLS active
✅ Gestion des objectifs
✅ Gestion des types d'assurance
✅ Gestion des ventes
✅ Gestion des utilisateurs
✅ Tableaux de bord et statistiques
✅ Exports CSV
✅ Interface responsive (mobile & desktop)

## 📞 Support

En cas de problème, vérifiez :
1. Les logs de la console navigateur (F12)
2. Les logs SQL dans Supabase Dashboard
3. Les politiques RLS dans Table Editor

Bon reporting ! 🚀
