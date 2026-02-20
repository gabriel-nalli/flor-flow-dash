export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  novo: { label: 'Novo', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  contato_1_feito: { label: 'Contato 1 Feito', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  nao_respondeu_d0: { label: 'Não Respondeu D0', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  nao_respondeu_d1: { label: 'Não Respondeu D1', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  agendado: { label: 'Agendado', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  no_show: { label: 'No-show', className: 'bg-red-100 text-red-700 border-red-200' },
  reuniao_realizada: { label: 'Reunião Realizada', className: 'bg-violet-100 text-violet-700 border-violet-200' },
  proposta_enviada: { label: 'Proposta Enviada', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  aguardando_decisao: { label: 'Aguardando Decisão', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  follow_up: { label: 'Follow-up', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  fechado_call: { label: 'Fechado (Call)', className: 'bg-green-100 text-green-700 border-green-200' },
  fechado_followup: { label: 'Fechado (Follow-up)', className: 'bg-green-100 text-green-700 border-green-200' },
  perdido: { label: 'Perdido', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export const WHATSAPP_TEMPLATE = `Oi amiga! tudo bem? Aqui é a {NOME_DA_VENDEDORA} sou da equipe da Mariana Santiago e do Thaylor.

Estou te chamando aqui pq voce preencheu o formulario e ganhou uma consultoria individual! 

Vamos agendar sua reuniao online?`;

export const ROUTINES: Record<string, Array<{ block: string; name: string }>> = {
  VENDEDORA: [
    { block: '09:00–09:45 | Follow-up 1 obrigatório', name: 'Follow-up pós-reunião sem compra (D0/D1/D2)' },
    { block: '09:00–09:45 | Follow-up 1 obrigatório', name: 'Remarcar no-show de ontem (D0/D1)' },
    { block: '09:00–09:45 | Follow-up 1 obrigatório', name: '2ª tentativa leads que não responderam (ontem)' },
    { block: '09:45–11:50 | Reuniões', name: 'Reunião 1' },
    { block: '09:45–11:50 | Reuniões', name: 'Reunião 2' },
    { block: '09:45–11:50 | Reuniões', name: 'Confirmações e encaixes' },
    { block: '11:50–12:30 | Organização pré-almoço', name: 'Confirmar reuniões da tarde' },
    { block: '11:50–12:30 | Organização pré-almoço', name: 'Preparar fila do webinar (filtros, templates)' },
    { block: '13:30–14:00 | Preparação pós-almoço', name: 'Check da agenda' },
    { block: '13:30–14:00 | Preparação pós-almoço', name: 'Confirmar reuniões do dia' },
    { block: '13:30–14:00 | Preparação pós-almoço', name: 'Preparar fila do webinar (sem chamar)' },
    { block: '14:00–15:00 | Pós-webinar ⚡ (zerar fila em 1h)', name: 'Zerar fila do webinar — todos leads abordados' },
    { block: '15:00–17:10 | Reuniões 2', name: 'Reunião 3' },
    { block: '15:00–17:10 | Reuniões 2', name: 'Reunião 4' },
    { block: '15:00–17:10 | Reuniões 2', name: 'Reunião 5 (opcional)' },
    { block: '17:10–17:50 | Follow-up 2 obrigatório', name: 'Follow-up D0 — reunião sem compra hoje' },
    { block: '17:10–17:50 | Follow-up 2 obrigatório', name: 'Remarcar no-show de hoje' },
    { block: '17:10–17:50 | Follow-up 2 obrigatório', name: 'Follow-up quentes do webinar' },
    { block: '17:50–18:30 | Registro e preparação', name: 'Atualizar status de todos os leads trabalhados' },
    { block: '17:50–18:30 | Registro e preparação', name: 'Definir next_followup_date para pendências' },
    { block: '17:50–18:30 | Registro e preparação', name: 'Revisar atrasados e preparar dia seguinte' },
  ],
  SDR: [
    { block: 'Rondas (a cada 1h)', name: 'Chamar novos leads do formulário (bio)' },
    { block: 'Rondas (a cada 1h)', name: 'Convidar para consultoria/webinar com CEO' },
    { block: 'Rondas (a cada 1h)', name: 'Etiquetar confirmados: Consultoria_Thaylor' },
    { block: 'Pré-consultoria/webinar', name: 'Enviar link horas antes para confirmados' },
    { block: 'Pré-consultoria/webinar', name: 'Enviar reforço próximo do horário' },
    { block: '14:00+ | Pós-webinar', name: 'Triagem de aplicações do webinar' },
    { block: '14:00+ | Pós-webinar', name: 'Filtrar faturamento >= 12k (HIGH)' },
    { block: '14:00+ | Pós-webinar', name: 'Chamar HIGH e marcar reunião com CEOs' },
    { block: '14:00+ | Pós-webinar', name: 'Criar grupo do lead com expert/CEO' },
    { block: '14:00+ | Pós-webinar', name: 'Etiquetar LEAD_QUALIFICADO_WEBNAR_THAYLOR' },
    { block: 'Follow-up', name: 'Follow-up diário até fechar' },
    { block: 'Extra', name: 'Prospectar perfis qualificados no Instagram' },
  ],
  SOCIAL_SELLER: [
    { block: '09:00–10:30 | Prospecção IG + DM', name: 'Prospectar perfis qualificados no Instagram' },
    { block: '09:00–10:30 | Prospecção IG + DM', name: 'Enviar DMs de captação' },
    { block: '09:00–10:30 | Prospecção IG + DM', name: 'Registrar leads "social" no sistema' },
    { block: '10:30–11:30 | WhatsApp Qualificação', name: 'Qualificação por WhatsApp (perguntas padrão)' },
    { block: '10:30–11:30 | WhatsApp Qualificação', name: 'Marcar consultoria ou repassar lead' },
    { block: '11:30–12:00 | Agendamentos', name: 'Agendamentos e confirmações' },
    { block: '13:30–15:30 | Consultorias', name: 'Consultoria 1' },
    { block: '13:30–15:30 | Consultorias', name: 'Consultoria 2' },
    { block: '13:30–15:30 | Consultorias', name: 'Consultoria 3 (se houver)' },
    { block: '15:30–16:10 | Follow-up D0', name: 'Follow-up D0 das consultorias de hoje' },
    { block: '16:10–18:30 | Prospecção 2 + Registro', name: 'Prospecção 2 + WhatsApp + Registro final' },
  ],
};
