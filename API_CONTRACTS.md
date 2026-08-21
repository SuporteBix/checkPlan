# API Contracts — Agenda de Planos

Contrato de dados entre frontend e backend (Supabase). Todas as tabelas são
acessadas diretamente via `@supabase/supabase-js` com RLS — não há camada
de API própria nem Edge Function. Este documento fixa nome de campo, tipo e
quem popula/lê, para o trabalho de UI e de schema não divergirem.

## Plano

| Campo | Tipo | Popula | Lê |
|---|---|---|---|
| id | uuid | banco (default `gen_random_uuid()`) | UI |
| owner_id | uuid | banco (default `auth.uid()`) | RLS apenas, não exibido |
| titulo | text | UI (form "Novo Plano") | UI |
| status | text (`ativo`\|`pausado`\|`concluido`) | UI (default `ativo` na criação) | UI |
| created_at | timestamptz | banco (default `now()`) | UI (ordenação) |
| updated_at | timestamptz | banco (trigger `touch_updated_at`) | UI |

Campo derivado, calculado no frontend a partir de `checklist_itens` (não
existe coluna `progresso`): `progresso = itens concluídos / total de itens
do plano` (0 se não houver itens).

## Anotação

| Campo | Tipo | Popula | Lê |
|---|---|---|---|
| id | uuid | banco | UI |
| owner_id | uuid | banco (default `auth.uid()`) | RLS apenas |
| plano_id | uuid (FK planos.id) | UI (contexto da tela do Plano) | UI |
| texto | text | UI (campo de nota livre) | UI |
| created_at | timestamptz | banco (default `now()`) | UI (ordenação cronológica) |

Sem `updated_at` — anotação é imutável após criada (ver architecture.md#d).

## Item de Checklist

| Campo | Tipo | Popula | Lê |
|---|---|---|---|
| id | uuid | banco | UI |
| owner_id | uuid | banco (default `auth.uid()`) | RLS apenas |
| plano_id | uuid (FK planos.id) | UI (contexto da tela do Plano) | UI |
| descricao | text | UI — texto livre, ou pré-preenchido com o trecho de anotação selecionado ao "virar tarefa" | UI |
| concluido | boolean | UI (default `false` na criação, toggle depois) | UI |
| prazo | date, nullable | UI (opcional no form) | UI |
| created_at | timestamptz | banco (default `now()`) | UI |
| updated_at | timestamptz | banco (trigger `touch_updated_at`) | UI |

## Visão global de Anotações (`app.anotacoes.tsx`)

Query: `anotacoes` com join em `planos` (`plano_id -> planos.id`), campos
adicionais lidos do join:

| Campo | Origem | Lê |
|---|---|---|
| plano_titulo | `planos.titulo` via join | UI (label "de qual Plano") |
| plano_id | `anotacoes.plano_id` | UI (link para `app.planos.$planoId.tsx`) |

Sem paginação nesta versão — volume esperado é baixo (uso pessoal, 1
usuário).
