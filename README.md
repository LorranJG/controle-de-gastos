# Controle de Gastos

Sistema simples para controlar gastos mensais a partir de extratos bancários, preparado para rodar grátis na Vercel com banco Supabase.

## Arquitetura

- Frontend estático: `index.html`, `styles.css`, `app.js`.
- APIs serverless da Vercel: pasta `api/`.
- Banco gratuito: Supabase PostgreSQL.
- Tela de login com proteção simples pela variável `APP_PASSWORD`, usada por apenas duas pessoas.

## Configurar o Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute o conteúdo de `supabase-schema.sql`.
4. Copie a Project URL e a `service_role` key.

## Configurar a Vercel

No projeto da Vercel, adicione estas variáveis de ambiente:

```text
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
APP_PASSWORD=uma-senha-para-duas-pessoas
```

Nunca coloque a `service_role` key no frontend. Ela deve ficar apenas nas variáveis da Vercel.

## Rodar localmente

Instale a Vercel CLI se quiser testar localmente:

```powershell
npm i -g vercel
```

Crie um arquivo `.env` com base em `.env.example` e rode:

```powershell
vercel dev
```

Depois acesse:

```text
http://localhost:3000
```

## Funcionalidades

- Importação de extratos `.csv`, `.ofx` ou `.txt`.
- Validação do extrato antes de gravar no banco.
- Classificação automática por palavras-chave nas APIs.
- Edição manual de categoria por lançamento.
- Cadastro de metas mensais por categoria.
- Filtro por período, tipo de movimentação e busca por descrição, categoria ou valor.
- Lançamentos manuais.
- Exclusão de lançamentos apenas por itens marcados na coluna `Flag`.
- Dados salvos no Supabase.
- Exportação dos dados em JSON.

## Formato CSV aceito

O sistema tenta identificar automaticamente colunas com nomes como:

- `data`, `date`, `lançamento`
- `descrição`, `descricao`, `histórico`, `historico`, `description`
- `valor`, `amount`, `value`

Também funciona melhor com arquivos separados por `;`, comuns em bancos brasileiros.
