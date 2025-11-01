# 📘 Régénération des Types Supabase

## 🚨 Problème Actuel

Le fichier `src/integrations/supabase/types.d.ts` contient des types vides :

```typescript
export type Database = {
  public: {
    Tables: {}
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
```

Cela signifie qu'il n'y a **aucun typage TypeScript** pour les opérations Supabase, ce qui peut causer des bugs et réduit l'autocomplete.

---

## ✅ Solution : Régénérer les Types

### Méthode 1: Via Supabase CLI (Recommandé)

1. **Installer Supabase CLI** (si pas déjà fait)
```bash
npm install -g supabase
```

2. **Se connecter à votre projet Supabase**
```bash
supabase login
```

3. **Lier le projet local**
```bash
supabase link --project-ref jwvkvyhwhpbyruattzbx
```

4. **Générer les types**
```bash
supabase gen types typescript --project-id jwvkvyhwhpbyruattzbx > src/integrations/supabase/types.d.ts
```

---

### Méthode 2: Via l'interface Supabase

1. Aller sur https://supabase.com/dashboard/project/jwvkvyhwhpbyruattzbx
2. Cliquer sur "Database" dans la sidebar
3. Cliquer sur "Types" en haut
4. Copier le contenu généré
5. Remplacer le contenu de `src/integrations/supabase/types.d.ts`

---

## 📋 Types Attendus

Une fois régénérés, les types devraient contenir :

```typescript
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          first_name: string | null
          last_name: string | null
          role: string
          is_active: boolean
          // ...
        }
        Insert: {
          // ...
        }
        Update: {
          // ...
        }
      }
      sales: {
        // ...
      }
      insurance_types: {
        // ...
      }
      employee_objectives: {
        // ...
      }
      // ... autres tables
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: 'admin' | 'employee'
        }
        Returns: boolean
      }
      get_current_profile: {
        // ...
      }
      // ... autres fonctions
    }
    Enums: {
      app_role: 'admin' | 'employee'
    }
  }
}
```

---

## 🔄 Quand Régénérer ?

Régénérez les types après chaque :
- Création/modification de table
- Ajout/modification de colonne
- Création/modification de fonction RPC
- Ajout d'enum

---

## 🎯 Avantages des Types Corrects

- ✅ **Autocomplete** dans VS Code
- ✅ **Détection d'erreurs** à la compilation
- ✅ **Documentation** intégrée
- ✅ **Refactoring** plus sûr
- ✅ **Moins de bugs** en production

---

## 📚 Ressources

- [Documentation Supabase CLI](https://supabase.com/docs/guides/cli)
- [Génération des types TypeScript](https://supabase.com/docs/guides/api/generating-types)
