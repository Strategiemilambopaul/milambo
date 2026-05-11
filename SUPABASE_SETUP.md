## Configuration Supabase (synchronisation multi-appareils)

1. Ajouter les variables d'environnement dans Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

2. Creer la table dans Supabase SQL Editor:

```sql
create table if not exists public.budget_sync (
  id text primary key,
  payload jsonb not null
);
```

3. Autoriser les operations avec RLS (exemple simple):

```sql
alter table public.budget_sync enable row level security;

create policy "allow read budget_sync"
on public.budget_sync
for select
to anon
using (true);

create policy "allow upsert budget_sync"
on public.budget_sync
for insert
to anon
with check (true);

create policy "allow update budget_sync"
on public.budget_sync
for update
to anon
using (true)
with check (true);
```

Note: cet exemple est volontairement permissif pour un usage familial. Pour un contexte public, durcir les politiques.
