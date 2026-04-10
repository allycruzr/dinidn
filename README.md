# Dindin — Controle Financeiro Pessoal

Dindin é um painel financeiro pessoal construído com React, Vite e Tailwind, projetado para centralizar contas bancárias, cartões de crédito e transações em um único local. O projeto usa Bun para gerenciamento de dependências e execução local.

## Recursos

- Open Finance / conexão de contas bancárias e cartões
- Visão geral de transações, cartões e patrimônio
- Dashboard com status de contas e faturas
- Areas de Relatórios, Patrimônio, Metas e Categorias
- Arquitetura com `DataContext` para dados compartilhados

## Tecnologias

- React + TypeScript
- Vite
- Bun
- Tailwind CSS
- Recharts
- React Router
- Lucide Icons

## Instalação

```bash
cd c:/Users/AllyCVS/Projects/dindin
bun install
```

## Executar localmente

```bash
bun run dev -- --host
```

## Build de produção

```bash
bun run build
```

## Scripts

- `bun run dev -- --host` — inicia o servidor de desenvolvimento
- `bun run build` — build de produção
- `bun run preview` — pré-visualiza o build de produção
- `bun run test` — executa testes com Vitest

## Observações

O código atual já inclui uma camada de dados centralizada em `src/context/DataContext.tsx` e uma página de conexões para simular integração Open Finance. Para integração real, será necessário conectar a uma API de provedor Open Finance e implementar o fluxo de consentimento.

## Repositório

https://github.com/allycruzr/dinidn
