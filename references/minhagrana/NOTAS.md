# MinhаGrana — Referências de Design

Pasta para salvar screenshots e notas de análise do app minhagrana.com.br.
Foco: módulo de **Planejamento** (orçamento pessoal, despesas, metas financeiras).

---

## 01 — Seleção de Módulos (`selecionar-modulo`)

**Arquivo:** `01-selecionar-modulo.png`

### O que foi observado:
- **Background:** Preto profundo (~`#0a0a0a`)
- **Logo:** "MINHAGRANA_" — tipografia bold com cursor piscando, verde teal (#00d4a1 aprox)
- **3 módulos em cards:**
  - 🟢 **RENDA VARIÁVEL** — badge "POPULAR" (verde), ícone gráfico de tendência
  - 🟣 **PLANEJAMENTO** — badge "NOVIDADE" (roxo), ícone carteira — *foco nosso*
  - 🟡 **ACADEMIA** — badge "EM BREVE" (laranja), ícone capelo
- **Cards:** Borda colorida sutil, fundo escuro (~`#111`), hover com glow da cor do módulo
- **CTA cards:** "ACESSAR MÓDULO →" em verde teal
- **Footer bar:** botões "SAIR" e "LANDING PAGE" com ícones
- **Tipografia:** Sans-serif moderna, tudo uppercase nas labels

### Padrões de UX identificados:
- Badge de status no canto superior do card (cor informativa)
- Ícone do módulo em quadrado arredondado com fundo levemente mais claro
- Separação clara entre módulos com borda colorida única por módulo
- Texto de descrição curto e objetivo abaixo do título

---

## Próximas screenshots a coletar:
- [x] Dashboard principal do Planejamento
- [x] Tela de Transações
- [ ] Formulário "+Nova Transação" (modal/drawer aberto)
- [ ] Tela de categorias
- [ ] Relatórios / gráficos
- [ ] Metas financeiras

---

## 02 — Dashboard Planejamento Financeiro (`/planejamento-financeiro`)

**URL:** `app.minhagrana.com.br/planejamento-financeiro`

### O que foi observado:
- **Layout geral:** Sidebar esquerda com nav + área principal com lista de itens em linhas
- **Header fixo:** Barra superior escura com info do usuário, saldo e botões de ação
- **Sub-header colorido:** Barra horizontal verde teal (destaque) — provavelmente resumo do mês
- **Lista de transações:** Linhas com avatar/ícone de categoria, nome, data e valor (vermelho/verde)
  - Valores negativos em vermelho (despesas)
  - Valores positivos em verde (receitas)
- **Modal de onboarding:** "O sistema precisa de dados!"
  - Ícone roxo com símbolo de atividade (waveform/heartbeat)
  - Opção: **"Controle Financeiro"** — "Lance manualmente sua receita e despesa."
  - Botão "Depois" (link simples, sem destaque)
  - Glassmorphism no modal: fundo escuro semi-transparente com blur no background

### Padrões de UX identificados:
- **Onboarding progressivo:** Modal só aparece se não há dados, guiando o usuário
- **Blur no background** quando modal está aberto (efeito glassmorphism)
- **Ícone de categoria por transação** (avatar colorido na esquerda de cada linha)
- **Cores semânticas:** vermelho = despesa, verde = receita (consistente)
- **Tipografia:** "Planejamento Financeiro" em bold grande como título da seção
- Barra de progresso/resumo no topo em teal verde (provavelmente % do orçamento usado)

---

## 03 — Tela de Transações (`/movimentacoes` ou similar)

### Layout geral:
- **Sidebar esquerda (estreita, icon-only):** 5 ítens com ícones
  - Análise, Portfólio, Movimentações (ativo, glow verde), Ferramentas, Configurações
  - Item ativo tem fundo verde escuro + ícone teal + label visível
- **Ticker bar horizontal:** Mercado em tempo real scrollando (DOW JONES, CAC, NIKKEI, BTC, SELIC, CDI, USD, EUR, IBOVESPA) com valores e variações coloridas

### Métricas KPI (4 cards no topo):
| Card | Valor |
|------|-------|
| Total Saídas | R$ 0,00 — ícone seta laranja/vermelha |
| Méd. Diária Saída | R$ 0,00 — ícone de info |
| Total Entradas | R$ 0,00 — ícone seta verde |
| Méd. Diária Entrada | R$ 0,00 — ícone de info |
- Cards com **borda esquerda teal**, fundo escuro (~#111), label uppercase pequeno

### Filtros de Busca (seção colapsável):
- Termo de busca (input com lupa)
- Tipo: dropdown (Todos)
- Categoria: dropdown (Todas)
- Conta: dropdown (Todas)
- De / Até: date pickers (dd/mm/aaaa)

### Ações no header da página:
- `Recategorizar com IA` — botão outline teal com ícone de IA
- `Apagar Todos` — botão cinza escuro
- `+ Nova Transação` — botão primário teal (CTA principal)

### Empty state:
- Ícone de documento centralizado
- "Nenhuma transação encontrada"
- Subtítulo encorajando o primeiro registro

### FAB (Floating Action Button):
- Círculo teal fixo no canto inferior direito
- Ícone de "i" ou "+" (ação rápida)

---

## 04 — Modal de Info (botão "i" no header)

### Estrutura:
- Título: **"2025 MinhaGrana"** com logo (ícone carteira verde teal em quadrado arredondado)
- Accordions expandíveis com ícone colorido + label + chevron:
  - 📘 **Recursos** (laranja/vermelho) — expandível
  - ⚙️ **Suporte** (laranja) — expandível → sub-items: "Suporte - Email", "Suporte - WhatsApp"
  - 📄 **Legal** (laranja) — expandível
  - 🕐 **Changelog** (amarelo) — expandível
- Footer: "Desenvolvido por MinhaGrana. Todos os direitos reservados."

### UX Pattern — **Hover effect nos itens do accordion:**
- Ao hover, o item ganha **highlight colorido na esquerda** (border-left teal) + leve mudança de fundo
- Animação suave de transição (não instantânea)
- Sub-items indentados com ícones próprios (menor)
- **Cores por categoria de item** — cada seção tem sua cor de acento

---

## Paleta de Cores Identificada

| Token | Hex aproximado | Uso |
|-------|---------------|-----|
| Background principal | `#0a0b0d` | Fundo da app |
| Card background | `#111318` | Cards e painéis |
| Accent teal | `#00d4a1` | Cor principal, CTAs, ícones ativos |
| Accent roxo | `#7c3aed` | Módulo Planejamento |
| Texto primário | `#ffffff` | Títulos |
| Texto secundário | `#8b9099` | Labels, subtítulos |
| Receita (positivo) | `#22c55e` | Valores de entrada |
| Despesa (negativo) | `#ef4444` | Valores de saída |
| Borda card | `#1e2229` | Separadores suaves |

---

## 05 — Dashboard Planejamento Financeiro: Distribuição (`/planejamento-financeiro`)

### Header / Contexto da Tela:
- Título majestoso: **Planejamento Financeiro** ("Visão geral das suas finanças pessoais")
- Barra verde de seleção de mês: `< Março 2026 >` occupying fully the container width.

### Secao 1: Cartões Superiores (4 cartões semelhantes à tela de transações, mas com foco em metas)
- **RENDA MENSAL** (Indicador "Automático"). Botão interno "Cadastre entradas" com borda amarela.
- **RECEITA TOTAL** (Valor e ícone verde).
- **DESPESA TOTAL** (Valor e ícone vermelho).
- **RECORRÊNCIAS** (Seletor/Dropdown, atualmente "Sem ocorrências").

### Secao 2: DISTRIBUIÇÃO DE PLANEJAMENTO (O Coração do Budgeting)
- Badge verde no canto direito: `100.0% BALANCEADO` (feedback visual se a soma das fatias não der 100%).
- Texto de instrução claro: "Ajuste os percentuais de cada categoria para totalizar 100%"

### UX Pattern das Categorias Fixas (Sliders Mágicos):
O sistema fornece categorias macro pré-definidas (muito comum em gestão financeira simplificada como a Regra 50/30/20, aqui adaptada para 5).

Cada linha/categoria tem:
- **Ícone + Nome**: Um emoji/ícone detalhado acompanhado de um Título Forte e um subtítulo (A faixa ideal recomendada, ex: `FAIXA: 40-60%`).
- **Slider interativo**: Uma barra cinza escura onde repousa um "thumb" (o botão de arrastar). O thumb de cada categoria tem uma cor distinta e um brilho suave ("glow"). Quando se ajusta, ele atualiza a porcentagem final.
- **Valores Consolidados**: À direita absoluta de cada linha, o percentual (`50.0%`, em fonte grande com a cor da categoria) e embaixo o valor financeiro absoluto derivado dessa porcentagem (`R$ 0,00`).

**Mapeamento das 5 Categorias Predefinidas e seus atributos visuais:**
1. 🏠 **Necessidades**
   - Recomendação: `FAIXA: 40-60%`
   - Cor do destaque/slider: Azul vibrante (`#3b82f6` ou similar).
2. 🎉 **Lazer e Bem-Estar**
   - Recomendação: `FAIXA: 10-20%`
   - Cor do destaque/slider: Roxo/Lilás (`#a855f7` ou similar).
3. 📈 **Investimentos e Poupança**
   - Recomendação: `FAIXA: 10-25%`
   - Cor do destaque/slider: Verde Teal (a cor da marca).
4. 📚 **Educação e Desenvolvimento**
   - Recomendação: `FAIXA: 5-15%`
   - Cor do destaque/slider: Amarelo/Laranja/Dourado (`#eab308` ou similar).
5. ❤️ **Impacto e Solidariedade**
   - Recomendação: `FAIXA: 0-10%`
   - Cor do destaque/slider: Vermelho/Rosa choque (`#ef4444` ou `#ec4899`).

### Por que essas categorias fixas são boas (Design Review)?
- Reduzem a fricção ("O que eu devo criar? Quanto devo gastar?"). A faixa recomendada atua como um educador financeiro embarcado (guiderrail).
- Visualmente deslumbrante associar cores únicas por macro-área que depois podem se propagar pelos relatórios gráficos.
- Desabilitar a edição/criação de top-levels simplifica o onboarding do usuário massivamente, enquanto mantém o uso de subcategorias (tags) se for o caso para dentro de cada "balde".

---

## 06 — Comportamento da Sidebar (Menu Lateral)

### Hover e Submenus (Flyout/Popover):
- A sidebar principal é enxuta (icon-only mode com texto pequeno embaixo).
- **Estado Ativo/Hover na Sidebar:**
  - Borda esquerda fina e brilhante (verde teal).
  - Fundo sutilmente esverdeado escuro.
  - Ícone e texto mudam para verde teal.
- **Menu Flyout (Submenu):**
  - Ao passar o mouse sobre um item principal (ex: "Portfólio"), um painel flutuante se abre à direita da sidebar (sem empurrar o conteúdo principal, é um overlay).
  - O painel tem fundo bem escuro (`#111318` ou similar) com borda/sombra muito sutil.
  - **Header do Flyout:** Repete o ícone e o nome da seção principal em UPPERCASE (ex: `[ícone] PORTFÓLIO`).
  - **Lista de Sub-itens:**
    - Ícones da cor cinza/branca.
    - Tipografia clara e legível (ex: "Dashboard", "Minhas Contas", "Assinaturas e Recorrências").
    - Presença de Badges nos sub-itens (ex: um badge amarelo "PRO" ou similar cortado na imagem em "Assinaturas").

### Análise de UX:
- Esse padrão economiza espaço horizontal insano, focando a atenção nos dados (dashboards, tabelas).
### Estrutura Completa de Menus Mapeada:
1. **📊 Análise**
   - Planejamento Financeiro
   - Rendimento Líquido
   - Cenário Econômico `[PRO]`
2. **💼 Portfólio**
   - Dashboard
   - Minhas Contas
   - Assinaturas e Recorrências `[PRO]`
3. **⇄ Movimentações**
   - Transações
   - Importar Extrato Bancário
4. **🏢 Ferramentas**
   - *(Ainda não vimos as opções internas, mas segue o mesmo padrão de hover)*
5. **👤 Configurações**
   - Meu Perfil
   - Minha Assinatura
   - Clube MinhaGrana

---

## 07 — Menu Dropdown Superior Direito (Header)

### Contexto:
No canto superior direito (header fixo), ao lado da barra de "Buscar... `Ctrl+K`", existe um botão de menu (hambúrguer ou avatar) que, ao ser clicado (na imagem mostra um "X" verde indicando que está aberto), revela um menu suspenso (dropdown menu).

### Estrutura e Itens do Dropdown:
- Fundo muito escuro (`#111318` ou similar), bordas sutis.
- Lista de opções com ícones à esquerda e texto claro:
  - 🔔 **Histórico de Notificações** (Possui um *badge* circular azul vibrante com um número, ex: `7`).
  - 📈 **Ver carteira**
  - 👁️ **Ocultar valores** (Eye icon - toggle de privacidade).
  - ☀️ **Modo Claro** (Icone de sol - toggle de tema).
  - *(Separador horizontal sutil)*
  - 🚪 **Sair** (Ícone de logout).

### Padrão de UX:
- Uso do canto superior direito para configurações globais da *sessão* do usuário (tema, privacidade, notificações, logout).
- Isso libera a barra lateral estritamente para a navegação de *conteúdo* e módulos do app.
- O badge azul quebra o padrão de cores para chamar atenção imediata para notificações não lidas.

---

## 08 — Painel de Histórico de Notificações

### Estrutura Geral:
- Parece ser um dropdown nativo ou um flyout grande que se abre a partir do item "Histórico de Notificações" do menu header. Ou possivelmente um Drawer/Modal separado. Na imagem, ele ocupa uma área retangular grande.

### Header do Painel:
Dividido em duas linhas lógicas com alinhamentos:
- **Linha 1:**
  - Esquerda: `Notificações` (Título bold grande, branco)
  - Direita: `Marcar todas como lidas` (Link sutil e clicável, cinza)
- **Linha 2:**
  - Esquerda: `7 não lidas` (Subtítulo informativo, cinza esmoecido)
  - Direita: `Últimas 7 mensagens` (Status de paginação/volume, cinza)

### Corpo/Itens (Cards de Notificação)
O visual dos cards de notificação não lida é riquíssimo:
- **Base:** Fundo cinza escuro (`#1a1d24` aprox), borda inferior divisória e uma **Borda Esquerda Verde Teal (espessa)** que denota estado "Não lido" ou "Sucesso" (dependendo do contexto).
- **Indicador:** Um *dot* (ponto) circular minúsculo no canto superior direito do card, azul (combina com o *badge* do menu root), indicando que é nova.

**Estrutura interna do Card:**
- **Cabeçalho:** 
  - Um ícone pequeno verde (checkmark circular) à esquerda.
  - O Título do alerta forte (ex: "🎁 Indique amigos e ganhe dias extras..." ou "🚀 Atualizações"), em texto branco em negrito.
- **Corpo:** Texto corrido explicando a notificação. Fonte light/cinza.
- **Seção inferior:**
  - Esquerda: *Timestamp* sutil ("21/03/26, 15:01").
  - Direita: Link em cor de acento ("Marcar como lida" em azul claro) e um botão de `X` minúsculo para dar "Dismiss" do card independentemente.

### UX Review
- Uso fenomenal de hierarquia espacial. Elementos da interface guiam perfeitamente os olhos.
- O card de "Atualizações" usa HTML dentro do conteúdo pra criar checkmarks de lista de novidades, facilitando a quebra visual para o usuário ler as features.
- Múltiplas formas de fechar alertas demonstração cuidado (clicar no card, botão x, ou marcar "todas como lidas" globalmente no topo).

---

## 09 — Dashboard Rendimento Líquido (`/rendimento-liquido`)

### Cabeçalho da Página:
- Ícone de "saco de dinheiro" (💰) + **Rendimento Líquido** em destaque.
- Subtítulo: "Acompanhe seu rendimento em tempo real".
- Logo abaixo (visível no topo escuro do layout global): "Nenhum ativo em carteira" indicando possivelmente um fallback ou alerta global quando não há investimentos cadastrados (apesar da tela ser de rendimento).

### Estrutura dos Cards de Métricas (KPIs):
Todos os cards têm o mesmo padrão de design:
- Fundo muito escuro (`#111318`).
- Bordas muito sutis.
- Acentos verdes (esverdeados) que parecem colchetes `L` nos 4 cantos dos cards (dá um ar "tech/cyber" elegante).
- Cabeçalhos curtos, em maiúsculas com ícone e cor de "label" (ex: verde teal).

**1. Main Hero Card (Rendimento Acumulado):**
- Ocupa largura total da grade (span 2 em grid css, por exemplo).
- Título: `RENDIMENTO ACUMULADO` (com ícone de engrenagem no canto superior direito para ajustes, ex: ajustar a meta ou o salário base).
- Valor em super destaque: `R$ 3.428,57` (verde, indicando positivo).
- Base Mensal: `R$ 4.500,00` logo abaixo.
- Sub-informação: Ícone de calendário com os `Dias de trabalho: SEG, TER, QUA, QUI, SEX`.

**2. Secundários (Grid 2x2 logo abaixo do Hero):**
- `PRÓXIMO PAGAMENTO`: "em 7 dias" (texto azul claro).
- `PROGRESSO DO MÊS`: "81% do mês trabalhado" (texto roxo pastel).
- `GANHO POR HORA`: "R$ 26,79" (texto verde).
- `GANHO POR DIA`: "R$ 214,29" (texto verde).

### Painel Colapsável Inferior (Impacto da Inflação):
- Trata-se de um painel estilo *accordion* expansível/colapsável.
- **Header do painel:** Ícone de tendência de queda vermelho + Título "Impacto da Inflação" + Subtítulo explicando. À direita, um chevron (seta p/ cima, indicando que está aberto).
- **Cards Internos (Grid 2x2):**
  - Mesma estética "cyber" nos cantos.
  - Oposição de cores clara: Valores base (Verde) vs Perda (Vermelho).
  - Exibe "Rendimento Atual" (Verde), frente a "Perda pela Inflação" (Vermelho).
  - Exibe "Inflação (12 meses)" (em Verde Teal, indicando o dado cru), frente a "Poder de Compra Ajustado" (Vermelho, indicando erosão do dinheiro).

---

## 10 — Dashboard Principal Consolidado (Portfólio > Dashboard)

### Cabeçalho e Controles:
- **Título**: `📊 Dashboard` ("Visão unificada dos seus investimentos e finanças")
- **Controladores de Período (Canto direito)**: Botões de toggle agrupados `[ Mensal | Anual ]` (com 'Anual' destacado em verde teal) e um seletor de ano `[ 2026 v ]`.

### KPIs (Top Row):
Linha superior com 4 cartões idênticos em estrutura aos já vistos, estabelecendo um padrão consistente:
1. `SAÍDA MÉDIA MENSAL` (Ícone seta pra baixo vermelho/rosa).
2. `TOTAL SAÍDAS` (Ícone carteira laranja).
3. `ENTRADA MÉDIA MENSAL` (Ícone seta subindo azul).
4. `TOTAL ENTRADAS` (Ícone vazio/verde).

### Widgets Analíticos (Grid de 2 Colunas para Gráficos):
Abaixo dos KPIs, a tela se divide numa grade (aparentemente CSS Grid 2 colunas para desktop). Notei 4 blocos principais:

1. **Rendimentos Mês a Mês:**
   - Empty state visualizado: Retângulo central mais escuro com borda sutil contendo o texto "Nenhum rendimento encontrado". Simples e não intromissivo.
2. **Comparação Mensal (Gatilho Premium/Upsell):**
   - Este bloco exibe propositalmente um cadeado amarelo estilo "desbloqueio".
   - Título: "Comparação Mensal"
   - Subtítulo: "Esta análise é exclusiva para assinantes Premium. Desbloqueie todo o potencial da sua carteira."
   - Botão call-to-action chamativo verde teal: `Desbloquear Gráfico`.
   - *UX Patter:* Excelente técnica de upsell SaaS. Mostra aonde o recurso estaria para gerar desejo/curiosidade, forçando o plano pago ao invés de ocultar o widget totalmente.
3. **Top 10 Subcategorias (Gatilho Premium):**
   - Outro bloco bloqueado usando a mesma exata estética do item 2.
4. **Gastos Cartão de Crédito:**
   - Empty state simples similar ao bloco 1 ("Nenhum gasto com cartão de crédito encontrado").

### Padrão de UX Consolidado:
- Uso massivo de "Widgets" de tamanho padronizado (cards).
- Bordas minimalistas verdes "em L" reforçam a estética *cyberpunk/fintech* refinada.
- Empty states são elegantes (não usam ilustrações gigantes infantis, mantendo a sobriedade).
- Áreas premium são integradas organicamente na interface como "recursos bloqueados" ao invés de menus escondidos.

---

## 11 — Tela de Minhas Contas (`/planejamento-financeiro/contas`)

### Cabeçalho da Página:
- Ícone de "cofrinho" (🐷) + **Minhas Contas** em destaque.
- Subtítulo: "Gerencie suas contas bancárias e carteiras".

### Estrutura do Painel de Cadastro:
O layout principal é um grande card dividido em duas colunas (Split View). O contêiner inteiro possui o header "CONTAS BANCÁRIAS" e a mesma estética com cantoneiras de borda teal.

#### Coluna Esquerda: Formulário "Nova Conta"
- **Seleção Rápida de Bancos (Visual Picker):** Ao invés de um dropdown chato, o sistema oferece um Grid de cartões selecionáveis para os bancos mais populares.
  - Exemplos visíveis: `C6 Bank`, `Nubank`, `Banco Inter`, `BTG Pactual` e a opção `Outro`.
  - Cada mini-card exibe a logo do banco e o nome.
  - **UX Pattern:** O card ativo (selecionado) ganha um highlight fortíssimo com borda `Azul Primário`. Reduz muito o atrito de digitação no onboarding.
- **Campo "Tipo":** Um menu dropdown (`<select>`) padrão escuro. O usuário pode escolher "Conta Corrente", "Cartão de Crédito", "Conta Poupança", etc.
- **Botão CTA:** "Criar Conta", preenchimento total na largura formulário, cor `Azul Primário` (combinando com o highlight do card de banco).

#### Coluna Direita: Listagem "Suas Contas"
- Exibe o inventário das contas já criadas.
- **Empty State Atual:** "Nenhuma conta cadastrada ainda" (centralizado com texto em cinza escuro, mantendo a limpeza global do design).

---

## 12 — Ferramentas: Indicadores Financeiros (`/indicadores`)

### Cabeçalho da Página:
- Ícone de "gráfico de barras" (📊) + **Indicadores Financeiros** em destaque.
- Subtítulo: "Selic, IPCA, IGPM e principais indicadores econômicos".
- Canto direito superior da página: Dropdown de filtro global de tempo (`[ 1 Ano v ]`).

### Seção 1: SELEÇÃO DE INDICADORES (Filtros Ativos)
- Trata-se de botões "Toggle" (Ligar/Desligar) lado a lado (flex wrap).
- **UX Pattern:** Cada botão tem uma cor base diferente que corresponde à cor da linha no gráfico principal depois.
  - Ex: `IPCA` (Botão ativo: Fundo Laranja).
  - Ex: `IGP-M` (Botão inativo: Fundo cinza escuro/preto, texto cinza).
  - Ex: `CDI` (Verde), `SELIC` (Cinza/inativo na imagem), `IBOVESPA` (Vermelho), `IFIX` (Ciano/Teal).

### Seção 2: COMPARATIVO DE RENTABILIDADE (Gráfico Principal)
- Um imenso gráfico de linhas cruzadas (estilo Recharts/Chart.js).
- Legenda centralizada no topo reflete as seleções ativas (`IBOVESPA`, `IFIX`, `CDI`, `IPCA`) usando pequenas "bolinhas" da respectiva cor.
- O Gráfico em si traça linhas coloridas (sem fundo preenchido) num grid esuro para fácil leitura da ascensão do IBOVESPA contra a inflação, etc. Y-axis exibe taxas percentuais e X-axis exibe os últimos meses (escala de 1 Ano).

### Seção 3: Grid de Mini-Gráficos Isolados (2 Colunas)
Abaixo do main chart, a tela empilha pequenos *Area Charts* (linhas arredondadas com um gradiente esmaecido do topo para a base) detalhando cada índice isolado com estética deslumbrante:
- **Painel IPCA:** Cor Laranja. Título + Subtítulo na Esquerda Topo. "3.81% Acumulado" na Direita Topo. Lindo gradiente laranja no fundo do gráfico.
- **Painel IGP-M:** Cor Amarela. Linha declinando (gráfico de queda) com preenchimento recheando até a base.
- **Painel CDI:** Cor Verde. Exibe a rampa crescente de 14.65% acumulado.
- **Painel SELIC:** Cor Azul. Similar ao CDI.

### Análise Pragmática:
- A tela é um "masterclass" de **Data Visualization em Dark Mode**.
- Associar um seletor (Os botões retangulares do topo) a uma legenda do card principal *E TAMBÉM* padronizar a cor do botão com a cor da linha renderizada no gráfico é essencial e evita confusão mental. A paleta de cores para gráficos exige cores bem contrastantes com o preto (Amarelo, Laranja, Azul Turqueza, Verde Limão, Vermelho Brilhante).

---

## 13 — Ferramentas: Calculadora de Aposentadoria

### Layout Geral e Propósito:
Uma ferramenta imersiva, "data-heavy", dividida em duas grandes colunas: **Inputs** (Esquerda) e **Resultados Mágicos** (Direita).

### Coluna da Esquerda (Controles):
Composta de 3 blocos empilhados:
1. **Parâmetros:**
   - Inputs de texto/número limpos (Renda desejada, Patrimônio, Aporte, Idades).
   - Destaque para um microcopy inteligente: Abaixo do input de "Renda deseja hoje: R$ 15.000" existe um texto menor "Equivalente a R$ 59.191/mês aos 65 anos", calculando inflação em tempo real.
2. **Configurações Avançadas (Sliders):**
   - É aqui que a UI brilha. Em vez de inputs secos para Juros e Inflação, usam sliders com trilhas coloridas (gradiente do vermelho pro verde).
   - Extremidades rotuladas ("Pessimista 6%" vs "Otimista 15%"), e marcadores nominais abaixo do slider ("Conservador", "Moderado", "Arrojado").
3. **Resumo Numérico:**
   - Lista do tipo *Chave-Valor* no final da coluna exibindo o resumo frio da simulação. 
   - Valores positivos ou que bateram a meta são renderizados em **Verde Teal**. (Ex: "Anos para atingir a meta: 32 anos").

### Coluna da Direita (Resultados Emocionais):
1. **Caixa de Alerta Motivacional:**
   - Baseado no cálculo, exibe uma mensagem em um container verde: "Aposentadoria com Herança!". O texto humaniza a equação ("Você atingiu a meta...").
2. **Gráfico Master de Projeção (Composed Chart):**
   - Combina múltiplos eixos Y (Patrimônio na esquerda em azul, Renda na Direita em verde).
   - Combina múltiplos tipos de renderização:
     - **Barras Azuis** subindo e descendo mostrando acúmulo e consumo do patrimônio.
     - **Linha Verde Rígida** (Renda Passiva).
     - **Linha Amarela Pontilhada** (Meta de Renda) que serve como linha de chegada.
     - Um **Ponto/Marker Vermelho** indicando o ano da aposentadoria.
3. **Evolução Detalhada (Tabela Virtualizada):**
   - Uma tabela com barra de rolagem customizada detalhando todos os anos até depois da morte.
   - Boa prática: Células vazias mostram um hífen vermelho `-`.
   - Coluna de "Status" exibe ícone de gráfico crescente e o texto "Acumulando" (ou "Consumindo" ao se aposentar).

### Padrão de UX:
Ferramentas assim ativam o gatilho da Dopamina no usuário e aumentam a retenção. Exibir gráficos compostos que reagem instântaneamente ao se puxar o slider de "Juros" de Moderado para Arrojado é o "Wow Factor" definitivo.
