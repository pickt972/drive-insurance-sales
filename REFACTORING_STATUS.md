Erreur critique détectée dans la refactorisation : les composants existants (Dashboard, SalesForm, SalesHistory, AdminPanel) utilisent de nombreuses fonctionnalités (users, sales, insuranceTypes, objectives, etc.) qui n'ont pas été implémentées dans le nouveau hook useAuth simplifié.

**Options:**
1. **Approche progressive (RECOMMANDÉE)**: Restaurer l'ancien système temporairement et migrer progressivement chaque composant
2. **Approche complète**: Réécrire complètement tous les composants pour utiliser directement Supabase au lieu du contexte global
3. **Approche hybride**: Étendre le hook useAuth pour inclure toutes les fonctionnalités manquantes

Quelle approche préfères-tu pour continuer ?