# Plano: Integrar Open Finance no dindin via Belvo

## Contexto

O dindin hoje é uma SPA client-only em Vite/React com DataContext em memória. O objetivo é substituir a simulação de Open Finance por uma integração real, de forma que você (e sua família) consiga conectar contas bancárias reais, importar transações automaticamente e visualizar dados no dashboard.

**Escolhas definidas:**
- **Provedor**: Belvo (Test plan — grátis permanente, até 25 links reais de produção)
- **Uso**: pessoal + família, sem monetização
- **Orçamento**: R$ 0/mês

**Por que Belvo Test plan é a escolha certa aqui:** é o único agregador brasileiro com tier gratuito *permanente* (não é trial). Cobre o volume necessário (25 contas >> você + família) e permite conectar bancos reais, não só sandbox.

## Decisões de arquitetura

O dindin precisa deixar de ser puramente client-only. Três componentes novos:

1. **Backend serverless** — precisa existir porque o `BELVO_SECRET` nunca pode viver no frontend. Recomendação: **Supabase Edge Functions** (Deno/TS) + **Vercel** como alternativa. Ambos têm tier grátis permanente.

2. **Banco de dados** — precisa persistir contas, transações, links Belvo e consentimentos. Recomendação: **Supabase Postgres** (500MB grátis, mais que suficiente para uso familiar).

3. **Auth** — precisa autenticar o usuário antes de criar/consultar links. Recomendação: **Supabase Auth** (email + senha ou magic link, grátis).

**Stack final sugerido (tudo grátis):**
- Frontend: Vite/React (já existe)
- Backend: Supabase Edge Functions
- DB: Supabase Postgres
- Auth: Supabase Auth
- Open Finance: Belvo Test plan

Única dependência externa fora do Supabase é a própria Belvo.

## Fluxo de dados (end-to-end)

```
1. Usuário faz login no dindin (Supabase Auth)
   |
   v
2. Clica "Conectar conta" → Frontend chama /api/belvo/widget-token
   |
   v
3. Backend usa BELVO_SECRET para gerar widget access_token
   |
   v
4. Frontend abre Belvo Widget (React SDK) com o token
   |
   v
5. Usuário escolhe banco + autentica no internet banking
   |
   v
6. Widget retorna link_id → Frontend envia ao backend /api/belvo/link-created
   |
   v
7. Backend salva link_id associado ao user_id no Postgres
   |
   v
8. Backend chama Belvo /accounts + /transactions e persiste no DB
   |
   v
9. Frontend recarrega DataContext via /api/accounts e /api/transactions
   |
   v
10. Belvo dispara webhook quando tem transação nova → Backend sincroniza
```

## Schema do banco (Supabase)

```sql
-- Usuários já vêm do Supabase Auth (auth.users)

create table public.belvo_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  belvo_link_id text unique not null,
  institution text not null,
  status text not null, -- 'valid' | 'invalid' | 'token_required'
  created_at timestamptz default now(),
  last_synced_at timestamptz
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  belvo_account_id text unique not null,
  belvo_link_id uuid references belvo_links not null,
  institution text not null,
  name text not null,
  type text not null, -- CHECKING, SAVINGS, CREDIT_CARD
  balance numeric(15,2) not null default 0,
  credit_limit numeric(15,2),
  currency text not null default 'BRL',
  last_synced_at timestamptz default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  account_id uuid references accounts not null,
  belvo_transaction_id text unique not null,
  description text not null,
  amount numeric(15,2) not null,
  type text not null, -- CREDIT, DEBIT
  category text,
  date date not null,
  status text not null default 'CONFIRMED',
  created_at timestamptz default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  account_id uuid references accounts not null,
  reference_month text not null, -- 'YYYY-MM'
  due_date date not null,
  closing_date date not null,
  total_amount numeric(15,2) not null,
  status text not null -- OPEN, CLOSED, PAID
);

-- RLS: cada usuário só vê seus próprios dados
alter table belvo_links enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table invoices enable row level security;

create policy "users see own data" on belvo_links for all using (auth.uid() = user_id);
create policy "users see own data" on accounts for all using (auth.uid() = user_id);
create policy "users see own data" on transactions for all using (auth.uid() = user_id);
create policy "users see own data" on invoices for all using (auth.uid() = user_id);
```

## Fases de implementação

### Fase 0 — Setup das contas (manual, você faz)

Ações que só você pode fazer (precisa ter as credenciais antes de programar):

1. Criar projeto no **Supabase** (supabase.com) — grátis.
2. Criar conta no **Belvo** (belvo.com) e ativar Test plan — grátis.
3. Na dashboard Belvo, pegar `BELVO_SECRET_ID` e `BELVO_SECRET_PASSWORD` do ambiente **Sandbox** primeiro (pra testar), depois do ambiente de **Production**.
4. Anotar `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

Depois disso, eu posso usar os MCP tools de Supabase que você já tem disponíveis pra criar o schema e rodar migrations direto daqui.

### Fase 1 — Supabase setup (schema + auth)

1. Rodar a migration com o schema acima usando o MCP `mcp__supabase__apply_migration`.
2. Configurar Supabase Auth — habilitar email/password.
3. Adicionar `@supabase/supabase-js` ao projeto Vite.
4. Criar `src/lib/supabase.ts` com o client singleton.
5. Criar componente `LoginPage` simples (email + senha) e route guard pras páginas internas.

**Critério de sucesso:** você consegue criar conta, logar, e o DataContext carrega dados do Postgres (vazio inicialmente) em vez de do mock.

### Fase 2 — Backend serverless (Edge Functions)

Criar 4 Edge Functions em `supabase/functions/`:

1. **`belvo-widget-token`** (POST) — valida JWT do usuário, chama Belvo `/api/token/` com `{id, password, scopes: "read_institutions,write_links,read_consents,write_consents"}`, retorna o `access` token pro frontend.

2. **`belvo-register-link`** (POST) — recebe `{link_id, institution}` do frontend após sucesso do widget, salva em `belvo_links`, dispara sync inicial.

3. **`belvo-sync`** (POST) — recebe `{link_id}`, chama Belvo `/accounts/` e `/transactions/`, persiste no Postgres com upsert por `belvo_account_id` e `belvo_transaction_id` (idempotente — sem duplicatas).

4. **`belvo-webhook`** (POST) — endpoint público que recebe notificações Belvo. Eventos relevantes: `transactions/new_transactions_available`, `accounts/new_accounts_available`, `links/token_required`. Para cada evento, chama a lógica de sync.

**Segredos no Supabase Vault:**
- `BELVO_SECRET_ID`
- `BELVO_SECRET_PASSWORD`
- `BELVO_WEBHOOK_SECRET` (Belvo assina webhooks — você valida a assinatura HMAC)

**Critério de sucesso:** você consegue chamar cada endpoint via `curl` e ver o comportamento correto. Sync funciona idempotente (rodar 2x não duplica).

### Fase 3 — Frontend: Belvo Widget + Supabase reads

1. Instalar `belvo-widget` (script tag) ou usar integração via URL.
2. Atualizar `src/context/DataContext.tsx`:
   - Substituir o estado in-memory por queries Supabase (`supabase.from('accounts').select()` etc).
   - `connectInstitution` agora abre o Belvo Widget em vez de simular.
   - `syncTransactions` chama Edge Function `belvo-sync`.
3. Substituir a `ConnectionsPage` — em vez de listar instituições mockadas, lista os `belvo_links` reais do Postgres, com botão "Conectar nova" que abre o widget.
4. Tratar estados de erro do widget (user cancelou, banco fora do ar, 2FA falhou).

**Critério de sucesso:** você consegue clicar "Conectar conta", abrir widget Belvo, escolher "Bradesco Sandbox" (credenciais de teste fornecidas pela Belvo), completar o fluxo, e ver contas + transações aparecendo no dashboard.

### Fase 4 — Dados reais

Quando tudo estiver funcionando em Sandbox:

1. Trocar credenciais do ambiente Belvo de Sandbox pra Production.
2. Conectar sua conta real de um banco suportado pela Belvo (lista em developers.belvo.com).
3. Validar que categorização, saldos e extrato batem com o que você vê no app do banco.
4. Se os dados derivados (`monthlyData`, `categorySpending`, `patrimony`) ainda estão no `useMemo` do DataContext — manter, porque agora eles derivam dos dados reais automaticamente.

### Fase 5 — LGPD + housekeeping

1. Criar página `/privacidade` com política clara: quais dados, por quanto tempo, direito de revogação.
2. Adicionar botão "Desconectar conta" na ConnectionsPage que chama `DELETE /api/belvo/link/:id` (Edge Function que chama Belvo `DELETE /links/{id}/` e remove do Postgres).
3. Habilitar encryption at rest no Supabase (grátis, só ativar).
4. Logs de acesso: Supabase já tem auditoria básica incluída.

## Arquivos que vão ser criados/modificados

**Novos arquivos:**
- `supabase/migrations/0001_initial_schema.sql`
- `supabase/functions/belvo-widget-token/index.ts`
- `supabase/functions/belvo-register-link/index.ts`
- `supabase/functions/belvo-sync/index.ts`
- `supabase/functions/belvo-webhook/index.ts`
- `src/lib/supabase.ts` — client singleton
- `src/lib/belvo.ts` — helpers de fetch pras Edge Functions
- `src/pages/Login.tsx` — tela de login
- `src/components/AuthGuard.tsx` — route guard
- `src/pages/Privacy.tsx` — política de privacidade

**Modificações significativas:**
- `src/context/DataContext.tsx` — substituir mocks por Supabase queries
- `src/pages/Connections.tsx` — substituir lista mockada por `belvo_links` reais + Belvo Widget
- `src/App.tsx` — adicionar AuthGuard, rota de login, rota de privacidade
- `package.json` — adicionar `@supabase/supabase-js`

**Arquivos que podem ser deletados:**
- `src/lib/mock-data.ts` (já está vazio, pode sumir)
- Schema manual de `initialConnections` no DataContext

## Verificação end-to-end

Depois de tudo:

1. **Teste de auth**: criar conta nova, logar, deslogar.
2. **Teste Sandbox**: conectar um link Belvo Sandbox (eles fornecem credenciais fake), ver contas/transações populando.
3. **Teste de idempotência**: chamar `belvo-sync` 3 vezes seguidas — saldos e transações não podem duplicar (isso reusa o fix que já fizemos do P1-A).
4. **Teste de webhook**: forçar uma transação nova no sandbox Belvo, ver webhook chegando e sync automático rodando.
5. **Teste de produção**: conectar conta real, verificar que saldos batem.
6. **Teste de desconexão**: desconectar link, confirmar que dados ficam (histórico) mas novas syncs não acontecem.

## Riscos e coisas pra ficar atento

- **Limite de 25 links**: Belvo Test plan contabiliza cada conexão como 1 link. Se você conectar 3 bancos diferentes, são 3 links — pode acabar rápido se testar muito. Delete links antigos durante desenvolvimento.
- **Sandbox ≠ Production**: cada ambiente usa credenciais diferentes, e contas Sandbox não funcionam em Production. Planeja essa troca.
- **Webhook público precisa de URL estável**: Edge Functions do Supabase já têm URL pública fixa, então funciona. Se migrar pra outro host, atualizar em Belvo dashboard.
- **Rate limits**: Belvo tem limites no Test plan (não publicados mas conservadores). Pra uso pessoal não bate, mas evita polling agressivo.
- **Sem auto-sync no Test plan?** Confirmar na doc Belvo se webhooks e auto-refresh funcionam no Test plan ou só no Launch (US$ 1.000/mês). Se só no pago, **polling manual via botão "Sincronizar" resolve** pra uso familiar.

## Próximos passos imediatos

Quando você aprovar o plano, a ordem vai ser:

1. **Você faz a Fase 0** (criar contas Supabase + Belvo, passar as credenciais).
2. **Eu faço Fase 1** usando MCP Supabase (schema + auth).
3. **Eu faço Fase 2** (Edge Functions).
4. **Eu faço Fase 3** (frontend Belvo Widget).
5. **Juntos testamos** Sandbox → Production.
6. **Fase 5** (LGPD) antes de qualquer uso com dados reais.
