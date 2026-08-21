# Security Report — Agenda de Planos

Checklist aplicado: `rules/SECURITY_RULES.md`. Escopo: diff completo
(migrations + frontend), branch `feature/mvp-agenda-de-planos`.

## Findings

### MEDIUM — Sessão Supabase em Local Storage sem mitigação explícita
**Arquivo:** `src/lib/supabase.ts` (cliente criado com `createClient` padrão)
**Cenário de exploração:** o cliente `@supabase/supabase-js` usado aqui
persiste `access_token`/`refresh_token` em `localStorage` por padrão (é o
comportamento default da lib para SPAs). `rules/SECURITY_RULES.md` pede
justificativa forte + mitigação para esse padrão ("Nunca armazene JWT/
refresh token em Local Storage ou Session Storage sem justificativa forte e
mitigação explícita"). Se, no futuro, alguma dependência de terceiros
injetar um script malicioso (supply-chain) ou surgir um XSS em qualquer
ponto da aplicação, o atacante consegue ler `localStorage` e sequestrar a
sessão do usuário sem precisar de outra vulnerabilidade de auth. Hoje não
há sink de XSS identificado no código (sem `dangerouslySetInnerHTML`, sem
`eval`), então o risco é de segunda ordem — mas a mitigação (sessão via
cookie HttpOnly, usando `@supabase/ssr` no lugar de `@supabase/supabase-js`
puro) não foi implementada nem justificada por escrito.
**Agente responsável:** frontend-agent — trocar para `@supabase/ssr` com
cookies HttpOnly/Secure/SameSite é a correção completa; alternativa mínima
é documentar a aceitação do risco no `architecture.md` (app de usuário
único, não B2B, superfície de ataque menor) se a troca for adiada.
**Bloqueante:** não (é MEDIUM, não CRITICAL/HIGH — não há sink de XSS
concreto no diff atual que explore isso hoje).

## Itens verificados sem finding

- **Segredos:** nenhuma Service Role Key, senha ou token hardcoded em
  frontend; `.env.example` só lista nomes de variável, sem valor real.
- **RLS:** todas as 7 tabelas (`organizations`, `profiles`, `user_roles`,
  `invitations`, `planos`, `anotacoes`, `checklist_itens`) têm RLS
  habilitada com policy por operação. `anotacoes`/`checklist_itens` também
  validam, no INSERT/UPDATE, que o `plano_id` referenciado pertence ao
  mesmo `owner_id` — evita um usuário anexar registro a um Plano de outro
  usuário mesmo definindo `owner_id` corretamente no payload.
- **Autorização client-side:** o guard de sessão em `app.tsx` (`beforeLoad`)
  é só UX (evita mostrar tela vazia antes do redirect) — a autorização real
  de dado é sempre a RLS no banco, então um bypass do guard client-side não
  expõe dado de outro usuário.
- **XSS:** nenhum `dangerouslySetInnerHTML`, `eval` ou `new Function` no
  diff; todo texto de usuário (`anotacao.texto`, `item.descricao`) é
  renderizado via JSX (escapado por padrão pelo React).
- **Injection SQL:** nenhuma query concatenada — todas via
  `@supabase/supabase-js` (parametrizado) ou SQL de migration estático sem
  interpolação de input de usuário.
- **Validação de entrada:** título de Plano, texto de anotação e descrição
  de item validados via Zod antes do insert (mínimo 1 caractere; título com
  limite de 200).
- **Dependências novas:** `@radix-ui/react-checkbox`, `@radix-ui/react-label`,
  `@radix-ui/react-select`, `class-variance-authority`,
  `@hookform/resolvers` — todas de baixo risco, sem CVE conhecida associada
  a essas versões no momento da auditoria.

## Veredito

1 finding MEDIUM, 0 CRITICAL, 0 HIGH. Não bloqueia `review-agent`.
