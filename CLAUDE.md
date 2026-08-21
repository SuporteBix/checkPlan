# Agenda de Planos

Anotações de planos/projetos ficam soltas e sem virar ação concreta — falta
um lugar onde a anotação livre se transforma em tarefas rastreáveis dentro
do mesmo contexto do plano. Uso pessoal (solo), sem multi-tenant.

## Stack

Bix Platform Standard — ver `$BIX_STANDARDS_DIR/rules/PLATFORM_STANDARD.md`
(TanStack Start + Supabase + Cloudflare). Não é a mesma stack do BixAi
(Vite + React Router) — não misturar padrões dos dois.

`BIX_STANDARDS_DIR` deve estar definida no ambiente deste projeto (shell
profile, `.envrc`, `ENV` do Dockerfile, secret de CI), apontando para onde o
bixdata-standards está disponível aqui — submodule, clone separado ou volume
montado pela sandbox. Ver `docs/PORTABILITY.md` do bixdata-standards para os
mecanismos possíveis.

## Como rodar

```bash
npm install
supabase db push
npm run dev
```

## Padrões deste projeto

Este projeto nasceu do pipeline Bix Factory (`bix-discovery → bix-build →
bix-dev`). Ele segue, sempre:

- `$BIX_STANDARDS_DIR/rules/AGENT_RULES.md` — comportamento sempre ativo do agente
- `$BIX_STANDARDS_DIR/rules/GIT_RULES.md` — fluxo de Git e sandbox
- `$BIX_STANDARDS_DIR/rules/PLATFORM_STANDARD.md` — stack e convenções técnicas
- `EXECUTION_GOAL.md` (raiz deste projeto) — o contrato do que este projeto deve fazer
- `architecture.md` (raiz deste projeto) — módulos, rotas, RLS, fluxos

Antes de qualquer alteração de segurança, banco ou API, consulte também as
skills `$BIX_STANDARDS_DIR/skills/backend-seguro` e
`$BIX_STANDARDS_DIR/skills/frontend-ux`.

## Agentes

Uma alteração neste projeto é uma nova Task → nova branch → nova sandbox a
partir do estado atual (nunca reaproveitar sandbox antiga). Ver
`$BIX_STANDARDS_DIR/docs/AGENT_WORKFLOW.md` para qual equipe de
agentes usar por tipo de mudança.
