# Scripts de sauvegarde et restauration

## Sauvegarde des données

### 1. Exporter les types d'assurance
```sql
SELECT 
  'INSERT INTO insurance_types (id, name, commission, is_active) VALUES (''' ||
  id || ''', ''' || name || ''', ' || commission || ', ' || is_active || ');'
FROM insurance_types WHERE is_active = true;
```

### 2. Exporter les profils utilisateurs
```sql
SELECT 
  'INSERT INTO profiles (id, user_id, username, role, is_active) VALUES (''' ||
  id || ''', ''' || user_id || ''', ''' || username || ''', ''' || role || ''', ' || is_active || ');'
FROM profiles WHERE is_active = true;
```

### 3. Exporter les ventes (optionnel)
```sql
SELECT 
  'INSERT INTO sales (id, client_name, reservation_number, employee_name, insurance_type_id, commission_amount, status) VALUES (''' ||
  id || ''', ''' || client_name || ''', ''' || reservation_number || ''', ''' || employee_name || ''', ''' || insurance_type_id || ''', ' || commission_amount || ', ''' || status || ''');'
FROM sales WHERE status = 'active';
```

## Restauration

1. Utilisez le bouton "Créer les utilisateurs" dans l'app
2. Exécutez le script `supabase/seed.sql` dans l'éditeur SQL Supabase
3. Vérifiez que toutes les données sont présentes

## Surveillance

Créez une fonction pour vérifier l'intégrité des données :
```sql
SELECT 
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM insurance_types WHERE is_active = true) as insurance_types_count,
  (SELECT COUNT(*) FROM sales WHERE status = 'active') as active_sales_count;
```