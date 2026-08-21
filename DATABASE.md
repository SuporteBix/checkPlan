# DATABASE — Agenda de Planos

Resumo das tabelas criadas pelas migrations em `supabase/migrations/`.
Projeto com `multiorg: false` (ver `architecture.md`): o schema base
multi-tenant é mantido por consistência de infraestrutura de Auth (login
Google OAuth exige `profiles`), mas as tabelas do módulo Planos isolam
dados apenas por `owner_id = auth.uid()`, sem `organization_id`.

Todas as 7 tabelas têm **RLS habilitada**, confirmado nas migrations
(`alter table ... enable row level security`) e validado com testes
funcionais rodados contra um Postgres 15 real (container Docker
descartável): usuário A cria plano/anotação/checklist item com sucesso;
usuário B não vê os registros de A (`SELECT` filtrado) e tem `INSERT`
bloqueado ao tentar referenciar `plano_id` de A; `UPDATE` em `anotacoes`
resulta em `UPDATE 0` (sem policy de UPDATE = imutável).

---

## 0001_base.sql — schema multi-tenant base

### organizations
Empresa/cliente (infraestrutura padrão do pipeline; não exercida por UI
neste projeto).
- `id uuid pk`, `name text not null`, `slug text unique not null`,
  `created_at`, `updated_at`
- Índice: unique em `slug`
- RLS: SELECT (`is_org_member` ou `is_bix_admin`), INSERT (autenticado),
  UPDATE/DELETE (`owner`/`admin` da org ou `is_bix_admin`)

### profiles
Espelho de `auth.users`, criado automaticamente via trigger
`handle_new_user` no signup (necessário para login Google OAuth).
- `id uuid pk references auth.users(id)`, `email text not null`,
  `full_name text`, `avatar_url text`, `is_bix_admin boolean default false`,
  `created_at`, `updated_at`
- RLS: SELECT (próprio perfil, colega de org, ou `is_bix_admin`),
  INSERT/UPDATE (próprio `id`), DELETE (`is_bix_admin` apenas)

### user_roles
Papel do usuário dentro de uma organização.
- `id uuid pk`, `user_id uuid references auth.users(id)`,
  `organization_id uuid references organizations(id)`,
  `role text check (owner|admin|member)`, `created_at`, `updated_at`
- Índices: `user_id`, `organization_id`, unique `(user_id, organization_id)`
- RLS: SELECT (próprio, membro da org, ou admin), INSERT/UPDATE/DELETE
  (`owner`/`admin` da org ou `is_bix_admin`)

### invitations
Convites pendentes por email (tabela base apenas — sem UI nem Edge
Function nesta versão, conforme architecture.md).
- `id uuid pk`, `organization_id uuid references organizations(id)`,
  `email text not null`, `role text check (owner|admin|member)`,
  `token uuid unique default gen_random_uuid()`,
  `invited_by uuid references auth.users(id)`, `accepted_at timestamptz`,
  `expires_at timestamptz default now() + 7 days`, `created_at`, `updated_at`
- Índices: `organization_id`, `email`, unique `token`
- RLS: SELECT (`owner`/`admin` da org, `is_bix_admin`, ou destinatário pelo
  próprio email), INSERT/UPDATE/DELETE (`owner`/`admin` da org ou
  `is_bix_admin`)

### Funções RLS de base
- `is_org_member(org_id uuid) returns boolean`
- `has_org_role(org_id uuid, role text) returns boolean`
- `is_bix_admin() returns boolean`
- `user_org_ids() returns setof uuid`
- `touch_updated_at()` — trigger genérico reutilizado por todas as tabelas
  com `updated_at` (base e módulo Planos)

---

## 0002_planos.sql — módulo Planos

Isolamento direto por `owner_id = auth.uid()`; nenhuma tabela deste módulo
tem `organization_id`.

### planos
- `id uuid pk default gen_random_uuid()`
- `owner_id uuid not null default auth.uid() references auth.users(id)`
- `titulo text not null`
- `status text not null default 'ativo' check (status in ('ativo','pausado','concluido'))`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()` + trigger `touch_updated_at`
- Índice: `owner_id`
- RLS: SELECT/INSERT/UPDATE/DELETE, todas `owner_id = auth.uid()`

### anotacoes
Imutável após criada — sem `updated_at`, sem policy de UPDATE.
- `id uuid pk default gen_random_uuid()`
- `owner_id uuid not null default auth.uid() references auth.users(id)`
- `plano_id uuid not null references planos(id) on delete cascade`
- `texto text not null`
- `created_at timestamptz default now()`
- Índices: `owner_id`, `plano_id`
- RLS: SELECT/INSERT/DELETE apenas, todas `owner_id = auth.uid()`. INSERT
  também exige que o `plano_id` referenciado pertença ao mesmo dono
  (defesa extra além da FK).

### checklist_itens
- `id uuid pk default gen_random_uuid()`
- `owner_id uuid not null default auth.uid() references auth.users(id)`
- `plano_id uuid not null references planos(id) on delete cascade`
- `descricao text not null`
- `concluido boolean not null default false`
- `prazo date` (nullable)
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()` + trigger `touch_updated_at`
- Índices: `owner_id`, `plano_id`
- RLS: SELECT/INSERT/UPDATE/DELETE, todas `owner_id = auth.uid()`.
  INSERT/UPDATE também exigem que o `plano_id` referenciado pertença ao
  mesmo dono.

Progresso do Plano (`concluídos / total` de `checklist_itens` por
`plano_id`) é derivado — calculado na leitura pelo frontend, não existe
coluna própria (ver `API_CONTRACTS.md`).

---

## RLS — confirmação final

| Tabela | RLS habilitada | Policies |
|---|---|---|
| organizations | sim | SELECT, INSERT, UPDATE, DELETE |
| profiles | sim | SELECT, INSERT, UPDATE, DELETE |
| user_roles | sim | SELECT, INSERT, UPDATE, DELETE |
| invitations | sim | SELECT, INSERT, UPDATE, DELETE |
| planos | sim | SELECT, INSERT, UPDATE, DELETE |
| anotacoes | sim | SELECT, INSERT, DELETE (sem UPDATE — imutável) |
| checklist_itens | sim | SELECT, INSERT, UPDATE, DELETE |

Todas as 7 tabelas têm RLS habilitada, sem exceção.
