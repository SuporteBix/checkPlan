━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BIX FACTORY — EXECUTION GOAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT
Agenda de Planos (slug: agenda-de-planos)

OBJECTIVE
Anotações de planos/projetos ficam soltas e sem virar ação concreta — falta
um lugar onde a anotação livre se transforma em tarefas rastreáveis dentro
do mesmo contexto do plano.

CONTEXT
Pedido do próprio usuário, para uso pessoal (solo). Hoje as anotações sobre
planos/projetos ficam soltas em blocos de notas ou apps de nota genéricos e
não se transformam em ações rastreáveis. Não substitui nenhum sistema
anterior — é um projeto novo.

FUNCTIONAL REQUIREMENTS
Módulo Planos:
- Criar Plano (título, status inicial "ativo")
- Listar Planos existentes
- Alterar status do Plano (ativo, pausado, concluído)
- Dentro de um Plano: escrever e listar Anotações (texto livre,
  cronológico)
- Dentro de um Plano: promover manualmente um trecho de Anotação para um
  item de Checklist
- Dentro de um Plano: listar Checklist (itens de um nível), marcar item
  como concluído/não concluído, prazo opcional por item
- Exibir progresso do Plano (% de itens de Checklist concluídos)
- Visão global: listar Anotações de todos os Planos juntas, com indicação
  de a qual Plano cada uma pertence

BUSINESS RULES
- Cada Plano, Anotação e item de Checklist pertence exclusivamente ao
  usuário dono da conta
- Um item de Checklist sempre pertence a um Plano — não existe item solto
- Progresso do Plano é calculado automaticamente: itens de Checklist
  concluídos / total de itens do Plano (0% se não houver itens)
- Checklist tem um nível só — sem subtarefas
- Promoção de Anotação para Checklist é sempre uma ação manual do usuário —
  nunca automática/gerada por IA

USERS / ROLES
Perfil único: "usuario", acesso total aos próprios dados. Sem super-admin.
Sem hierarquia de permissões — o sistema não é multiempresa.

ENTITIES
- Plano: título, status (ativo/pausado/concluído). Dono: usuário
  individual.
- Anotação: texto, timestamp de criação, pertence a um Plano. Dono: usuário
  individual.
- Item de Checklist: descrição, feito/não feito, prazo opcional, pertence a
  um Plano. Dono: usuário individual.

MAIN FLOWS
1. Usuário → cria Plano → tela "Novo Plano" → server function de criação →
   tabela planos
2. Usuário → escreve Anotação dentro de um Plano → tela do Plano → server
   function de criação de anotação → tabela anotacoes
3. Usuário → seleciona trecho de Anotação e promove para Checklist → tela
   do Plano → server function de criação de item de checklist → tabela
   checklist_itens
4. Usuário → marca item de Checklist como concluído → tela do Plano →
   server function de atualização → tabela checklist_itens (progresso do
   Plano recalculado na leitura)
5. Usuário → acessa visão global de Anotações → tela "Todas as Anotações"
   → server function de listagem cross-Plano → tabela anotacoes (join com
   planos)

INTEGRATIONS
Nenhuma.

ARCHITECTURE
Bix Platform Standard (`rules/PLATFORM_STANDARD.md`). Sistema não
multi-tenant — sem conceito de organização, apenas isolamento por usuário
dono dos dados.

CONSTRAINTS
Sem modo offline. Sem tempo real (sem notificações instantâneas, sem
sincronização ao vivo entre dispositivos). Apenas web padrão (desktop e
mobile responsivo) — sem dispositivo especial (TV, tablet, totem). Sem
auditoria/compliance. Escala esperada: 1 usuário simultâneo.

NON-GOALS
- Sem transformação automática de nota em tarefa via IA (promoção é manual)
- Sem subtarefas (checklist de um nível só)
- Sem compartilhamento/colaboração com outras pessoas
- Sem app mobile nativo (só web)
- Sem upload de arquivos/mídia
- Sem modo offline
- Sem integrações externas
- Sem relatórios/exportação

ACCEPTANCE CRITERIA
- ✓/✗ Usuário consegue criar um Plano com título e status inicial "ativo"
- ✓/✗ Usuário consegue escrever e salvar Anotações dentro de um Plano
- ✓/✗ Usuário consegue promover um trecho de Anotação para item de
  Checklist
- ✓/✗ Usuário consegue marcar item de Checklist como concluído/não
  concluído
- ✓/✗ Progresso do Plano (%) reflete os itens de Checklist concluídos
- ✓/✗ Existe uma visão que lista Anotações de todos os Planos juntas,
  identificando o Plano de origem de cada uma
- ✓/✗ Usuário consegue mudar o status do Plano (ativo/pausado/concluído)

DEFINITION OF DONE
- [ ] Todas as Acceptance Criteria atendidas
- [ ] Migrations com RLS aplicadas
- [ ] Nenhuma vulnerabilidade CRITICAL/HIGH em aberto na auditoria de
      segurança
- [ ] Build, lint, typecheck e testes passando
- [ ] Revisão final com veredito PASS
- [ ] Commit final pronto na branch da Task, com descrição de PR sugerida

STANDARDS REVISION
bb882b1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END EXECUTION GOAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
