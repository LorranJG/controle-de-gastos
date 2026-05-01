# Controle de Gastos

Sistema financeiro simples para duas pessoas, preparado para rodar na Vercel com Supabase.

## Arquitetura

- Frontend estatico em `index.html`, `styles.css` e `app.js`.
- APIs serverless na pasta `api/`.
- Banco Supabase PostgreSQL.
- Login por senha unica via `APP_PASSWORD`.

## Configurar o Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute o conteudo de `supabase-schema.sql`.
4. Copie a Project URL e a `service_role` key.

## Configurar a Vercel

Adicione estas variaveis de ambiente:

```text
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
APP_PASSWORD=uma-senha-para-duas-pessoas
```

## Rodar localmente

```powershell
npm i -g vercel
vercel dev
```

Depois acesse `http://localhost:3000`.

## Funcionalidades

- SPA com paginas de Dashboard, Movimentacoes, Metas, Importar gastos e Configuracoes.
- Metas por categoria e metas nomeadas com progresso.
- Lancamentos manuais com tipo, forma de pagamento e pessoa responsavel.
- Importacao de extratos com previa antes de gravar.
- Filtros por periodo, categoria, pessoa, forma de pagamento e tipo.
- Preferencias padrao compartilhadas em Configuracoes.
- Exportacao dos dados em JSON.
