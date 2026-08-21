# QA Report — Agenda de Planos

## Comandos rodados (independente da implementação, reconfirmado)

| Comando | Resultado |
|---|---|
| `npm run typecheck` (`tsc --noEmit`) | ✓ Passou, sem erros |
| `npm run lint` (`eslint .`) | ✓ Passou, sem erros |
| `npm run test` (`vitest run`) | ✓ Passou — 1 arquivo, 4 testes (`src/lib/progresso.test.ts`) |
| `npm run build` (client + SSR) | ✓ Passou — build client e SSR completos, sem erro |

Cobertura de teste original do diff: 0 testes (nenhum arquivo `*.test.*`
existia). Adicionei `src/lib/progresso.ts` (extraindo a lógica de cálculo de
progresso, antes duplicada em `app.index.tsx` e
`app.planos.$planoId.tsx`, para uma função pura) e
`src/lib/progresso.test.ts` (4 casos: zero itens, todos concluídos,
arredondamento, nenhum concluído) — cobre a única lógica de negócio não
trivial do diff que não depende de I/O. Fluxos de CRUD contra Supabase não
têm teste automatizado nesta versão (exigiria banco real rodando na
sandbox, conforme a convenção "sem mock de banco" — não configurado neste
estágio); validação de RLS foi feita separadamente pelo agente de banco
(ver `DATABASE.md` / relato da Task, testes manuais num Postgres real via
Docker: isolamento entre usuários e imutabilidade de `anotacoes`
confirmados).

## Acceptance Criteria (`EXECUTION_GOAL.md`)

| Critério | Status | Evidência |
|---|---|---|
| Criar Plano com título e status inicial "ativo" | ✓ | `app.index.tsx` — form RHF+Zod, insert com `status: "ativo"` |
| Escrever e salvar Anotações dentro de um Plano | ✓ | `app.planos.$planoId.tsx` — form + insert em `anotacoes` |
| Promover trecho de Anotação para item de Checklist | ✓ | botão "Virar tarefa" pré-preenche o form de checklist com o texto da anotação, editável antes de confirmar (decisão registrada em comentário no código — promove a nota inteira como texto de partida, não seleção de substring) |
| Marcar item de Checklist concluído/não concluído | ✓ | `Checkbox` + mutation `toggleChecklistItem` |
| Progresso do Plano (%) reflete itens concluídos | ✓ | `calcularProgresso()`, usado em lista e detalhe do Plano, coberto por teste unitário |
| Visão que lista Anotações de todos os Planos, identificando origem | ✓ | `app.anotacoes.tsx` — query com join em `planos(titulo)`, link para o Plano de origem |
| Mudar status do Plano (ativo/pausado/concluído) | ✓ | `Select` em `app.planos.$planoId.tsx`, mutation `atualizarStatus` |

Todos os 7 critérios ✓. Nenhum ⚠.

## Regressão

Não aplicável — projeto novo, sem funcionalidade anterior a proteger.

## Gaps não bloqueantes (fora do escopo dos Acceptance Criteria)

- `architecture.md` descreve exclusão de Anotação como permitida (RLS tem
  policy de DELETE), mas a UI não expõe essa ação — não é um Acceptance
  Criteria do Execution Goal, não bloqueia release.
