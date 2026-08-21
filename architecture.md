# Architecture — Agenda de Planos

## a) Visão geral

Nome: Agenda de Planos (slug: agenda-de-planos)
Descrição: app pessoal onde o usuário cria Planos, escreve Anotações livres
dentro de cada um e promove manualmente trechos dessas anotações para itens
de Checklist rastreáveis.

Stack: Bix Platform Standard (`rules/PLATFORM_STANDARD.md`) — TanStack
Start (SSR) + TanStack Router/Query + shadcn/ui + Tailwind + Supabase
(PostgreSQL + Auth) + Cloudflare Pages.

**Desvio documentado do padrão**: este projeto tem `multiorg: false` (ver
`spec.yaml`). A migration 001 (schema base `organizations` / `profiles` /
`user_roles` / `invitations`) é mantida por consistência de infraestrutura
de Auth (login via Google OAuth continua exigindo `profiles`), mas:
- Não há rota `app.team.tsx` nem fluxo de convite — não faz sentido convidar
  membros num app de usuário único. `invitations` é criada pela migration
  base mas não tem UI nem Edge Function associada nesta versão.
- Nenhuma tabela de módulo (`planos`, `anotacoes`, `checklist_itens`) tem
  `organization_id`. Isolamento é sempre por `owner_id = auth.uid()`.
- RLS não usa `is_org_member`/`has_org_role` nas tabelas de módulo — só
  comparação direta com `auth.uid()`.

```text
┌─────────────────────────────────────────────┐
│                  Agenda de Planos             │
├───────────────┬───────────────┬─────────────┤
│     Auth       │   Settings     │   Planos    │
│ (Google OAuth) │ (perfil básico)│ (core)      │
└───────────────┴───────────────┴─────────────┘
```

## b) Módulos e rotas TanStack

```
Módulo: Auth
Rota:   src/routes/auth.tsx, src/routes/auth.callback.tsx
Entidades: profiles
Perfis com acesso: qualquer visitante (login), usuário autenticado (callback)

Módulo: Settings
Rota:   src/routes/app.settings.tsx
Entidades: profiles
Perfis com acesso: usuario (dono do próprio perfil)

Módulo: Planos
Rota:   src/routes/app.index.tsx        -- lista de Planos + criar Plano
Rota:   src/routes/app.planos.$planoId.tsx -- tela do Plano: Notas + Checklist lado a lado
Rota:   src/routes/app.anotacoes.tsx    -- visão global de Anotações de todos os Planos
Entidades: planos, anotacoes, checklist_itens
Perfis com acesso: usuario (dono dos próprios registros)
```

Não há módulo Admin (`admin_panel: false` no spec) nem módulo Team
(justificado acima).

## c) Modelo de dados resumido

**planos**
- id, owner_id, titulo, status (`ativo` | `pausado` | `concluido`),
  created_at, updated_at

**anotacoes**
- id, owner_id, plano_id (FK → planos), texto, created_at

**checklist_itens**
- id, owner_id, plano_id (FK → planos), descricao, concluido (bool),
  prazo (date, nullable), created_at, updated_at

Relacionamentos: `planos 1—N anotacoes`, `planos 1—N checklist_itens`.
Progresso do Plano é derivado (não persistido): `checklist_itens
concluídos / total` daquele `plano_id`, calculado na leitura (view ou
query agregada), não em coluna própria — evita inconsistência de cache.

## d) Permissões RLS por tabela

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| planos | `owner_id = auth.uid()` | `owner_id = auth.uid()` | `owner_id = auth.uid()` | `owner_id = auth.uid()` |
| anotacoes | `owner_id = auth.uid()` | `owner_id = auth.uid()` | não permitido (imutável após criada) | `owner_id = auth.uid()` |
| checklist_itens | `owner_id = auth.uid()` | `owner_id = auth.uid()` | `owner_id = auth.uid()` | `owner_id = auth.uid()` |

Anotações são imutáveis por design (registro cronológico do que foi
pensado) — só criação e exclusão, sem edição. Se o usuário errar, apaga e
recria.

## e) Edge Functions necessárias

Nenhuma. Todas as operações (CRUD de planos/anotações/checklist) são
diretas via Supabase client + RLS — não há regra de negócio multi-passo que
justifique `SECURITY DEFINER` ou Edge Function.

## f) Fluxos principais

```
Usuário → cria Plano → app.index.tsx → insert direto (Supabase client) → tabela planos
Usuário → escreve Anotação → app.planos.$planoId.tsx → insert direto → tabela anotacoes
Usuário → seleciona trecho de Anotação e clica "virar tarefa" → app.planos.$planoId.tsx → insert direto (descricao pré-preenchida com o trecho) → tabela checklist_itens
Usuário → marca item de Checklist como concluído → app.planos.$planoId.tsx → update direto → tabela checklist_itens
Usuário → abre visão global → app.anotacoes.tsx → select com join em planos → tabelas anotacoes + planos
```

## g) Integrações externas

Nenhuma (`integracoes: []` no spec).
