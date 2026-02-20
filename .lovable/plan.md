
# Tornar os alertas do Dashboard clicaveis

## O que muda

Os dois avisos no Dashboard ("X follow-ups atrasados" e "X leads sem responsavel") vao virar botoes clicaveis. Ao clicar, um dialog/modal abre mostrando a lista dos leads correspondentes, com nome, WhatsApp, responsavel e data.

## Detalhes tecnicos

### 1. Criar componente `AlertLeadsDialog`
- Novo arquivo `src/components/dashboard/AlertLeadsDialog.tsx`
- Recebe: `title`, `leads` (array filtrado), `profileMap`, `open`, `onOpenChange`
- Exibe uma tabela simples dentro de um Dialog com: Nome, WhatsApp, Responsavel, Status, Data de criacao (ou data do follow-up)

### 2. Alterar `src/pages/Dashboard.tsx`
- Buscar `profiles` do banco para montar um `profileMap` (nome por UUID)
- Adicionar dois estados: `showFollowupDialog` e `showSemResponsavelDialog`
- Calcular as listas filtradas:
  - **Follow-ups atrasados**: leads onde `next_followup_date <= hoje`
  - **Sem responsavel**: leads onde `assigned_to` e nulo
- Transformar os dois `<div>` de alerta em `<button>` que abrem o dialog correspondente, com cursor pointer e hover visual
- Renderizar dois `<AlertLeadsDialog>` com os dados filtrados

### 3. Informacoes exibidas no modal
- Nome do lead
- WhatsApp (com link clicavel)
- Responsavel (usando profileMap, ou "Sem responsavel")
- Status atual
- Data relevante (follow-up date ou data de criacao)
