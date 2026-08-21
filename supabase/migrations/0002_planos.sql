-- 0002_planos.sql
-- Módulo Planos: planos, anotacoes, checklist_itens.
-- Isolamento sempre por owner_id = auth.uid() (multiorg: false neste
-- projeto — ver architecture.md) — nenhuma destas tabelas tem
-- organization_id nem usa is_org_member/has_org_role.

-- ============================================================================
-- planos
-- ============================================================================

create table public.planos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo text not null,
  status text not null default 'ativo' check (status in ('ativo', 'pausado', 'concluido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index planos_owner_id_idx on public.planos (owner_id);

create trigger planos_touch_updated_at
  before update on public.planos
  for each row
  execute function public.touch_updated_at();

-- ============================================================================
-- anotacoes
-- Imutável após criada: sem updated_at, sem policy de UPDATE (ver
-- architecture.md#d).
-- ============================================================================

create table public.anotacoes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plano_id uuid not null references public.planos (id) on delete cascade,
  texto text not null,
  created_at timestamptz not null default now()
);

create index anotacoes_owner_id_idx on public.anotacoes (owner_id);
create index anotacoes_plano_id_idx on public.anotacoes (plano_id);

-- ============================================================================
-- checklist_itens
-- ============================================================================

create table public.checklist_itens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plano_id uuid not null references public.planos (id) on delete cascade,
  descricao text not null,
  concluido boolean not null default false,
  prazo date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index checklist_itens_owner_id_idx on public.checklist_itens (owner_id);
create index checklist_itens_plano_id_idx on public.checklist_itens (plano_id);

create trigger checklist_itens_touch_updated_at
  before update on public.checklist_itens
  for each row
  execute function public.touch_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.planos enable row level security;
alter table public.anotacoes enable row level security;
alter table public.checklist_itens enable row level security;

-- planos: SELECT/INSERT/UPDATE/DELETE, sempre owner_id = auth.uid()
create policy planos_select on public.planos
  for select
  using (owner_id = auth.uid());

create policy planos_insert on public.planos
  for insert
  with check (owner_id = auth.uid());

create policy planos_update on public.planos
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy planos_delete on public.planos
  for delete
  using (owner_id = auth.uid());

-- anotacoes: SELECT/INSERT/DELETE apenas — imutável, sem UPDATE.
-- INSERT também exige que o plano referenciado pertença ao mesmo dono,
-- evitando anotação presa a um plano de outro usuário.
create policy anotacoes_select on public.anotacoes
  for select
  using (owner_id = auth.uid());

create policy anotacoes_insert on public.anotacoes
  for insert
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.planos p
      where p.id = plano_id and p.owner_id = auth.uid()
    )
  );

create policy anotacoes_delete on public.anotacoes
  for delete
  using (owner_id = auth.uid());

-- checklist_itens: SELECT/INSERT/UPDATE/DELETE, sempre owner_id = auth.uid().
-- INSERT/UPDATE também exigem que o plano referenciado pertença ao mesmo
-- dono, evitando item preso a um plano de outro usuário.
create policy checklist_itens_select on public.checklist_itens
  for select
  using (owner_id = auth.uid());

create policy checklist_itens_insert on public.checklist_itens
  for insert
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.planos p
      where p.id = plano_id and p.owner_id = auth.uid()
    )
  );

create policy checklist_itens_update on public.checklist_itens
  for update
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.planos p
      where p.id = plano_id and p.owner_id = auth.uid()
    )
  );

create policy checklist_itens_delete on public.checklist_itens
  for delete
  using (owner_id = auth.uid());
