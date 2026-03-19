import { createContext, useContext, useState, ReactNode } from 'react';

export type Lang = 'pt' | 'es';

const translations = {
  // ─── AppSidebar ─────────────────────────────────────────────────────
  'Dashboard': { pt: 'Dashboard', es: 'Panel' },
  'Leads': { pt: 'Leads', es: 'Leads' },
  'Rotina': { pt: 'Rotina', es: 'Rutina' },
  'Funil Webinário': { pt: 'Funil Webinário', es: 'Embudo Webinar' },
  'Meta de Vendas': { pt: 'Meta de Vendas', es: 'Meta de Ventas' },
  'Comissões': { pt: 'Comissões', es: 'Comisiones' },
  'Menu': { pt: 'Menu', es: 'Menú' },

  // ─── AppLayout ──────────────────────────────────────────────────────
  'Sair da conta': { pt: 'Sair da conta', es: 'Cerrar sesión' },
  'Modo escuro': { pt: 'Modo escuro', es: 'Modo oscuro' },
  'Modo claro': { pt: 'Modo claro', es: 'Modo claro' },

  // ─── Status Labels (STATUS_CONFIG) ─────────────────────────────────
  'Novo': { pt: 'Novo', es: 'Nuevo' },
  'Contato 1 Feito': { pt: 'Contato 1 Feito', es: 'Contacto 1 Hecho' },
  'Não Respondeu D0': { pt: 'Não Respondeu D0', es: 'No Respondió D0' },
  'Não Respondeu D1': { pt: 'Não Respondeu D1', es: 'No Respondió D1' },
  'Reunião Realizada': { pt: 'Reunião Realizada', es: 'Reunión Realizada' },
  'Proposta Enviada': { pt: 'Proposta Enviada', es: 'Propuesta Enviada' },
  'Aguardando Decisão': { pt: 'Aguardando Decisão', es: 'Esperando Decisión' },
  'Fechado (Call)': { pt: 'Fechado (Call)', es: 'Cerrado (Call)' },
  'Fechado (Follow-up)': { pt: 'Fechado (Follow-up)', es: 'Cerrado (Follow-up)' },
  'Perdido': { pt: 'Perdido', es: 'Perdido' },

  // ─── Dashboard ──────────────────────────────────────────────────────
  'Visão geral do time': { pt: 'Visão geral do time', es: 'Visión general del equipo' },
  'Leads Hoje': { pt: 'Leads Hoje', es: 'Leads Hoy' },
  'Agendamentos': { pt: 'Agendamentos', es: 'Agendamientos' },
  'Reuniões': { pt: 'Reuniões', es: 'Reuniones' },
  'Vendas': { pt: 'Vendas', es: 'Ventas' },
  'Follow-up Pendente': { pt: 'Follow-up Pendente', es: 'Follow-up Pendiente' },
  'Total Leads': { pt: 'Total Leads', es: 'Total Leads' },
  'Todos os leads': { pt: 'Todos os leads', es: 'Todos los leads' },
  'Todos os Webinários': { pt: 'Todos os Webinários', es: 'Todos los Webinarios' },
  'Leads Manuais': { pt: 'Leads Manuais', es: 'Leads Manuales' },
  'Exportar CSV': { pt: 'Exportar CSV', es: 'Exportar CSV' },
  'follow-ups atrasados': { pt: 'follow-ups atrasados', es: 'follow-ups atrasados' },
  'leads sem responsável': { pt: 'leads sem responsável', es: 'leads sin responsable' },
  'Follow-ups Atrasados': { pt: 'Follow-ups Atrasados', es: 'Follow-ups Atrasados' },
  'Leads sem Responsável': { pt: 'Leads sem Responsável', es: 'Leads sin Responsable' },
  'Vendas por Vendedora': { pt: 'Vendas por Vendedora', es: 'Ventas por Vendedora' },
  'Equipe': { pt: 'Equipe', es: 'Equipo' },
  'Visão Geral': { pt: 'Visão Geral', es: 'Visión General' },
  'leads atribuídos': { pt: 'leads atribuídos', es: 'leads asignados' },
  'ações hoje': { pt: 'ações hoje', es: 'acciones hoy' },
  'vendas': { pt: 'vendas', es: 'ventas' },
  'Bruto:': { pt: 'Bruto:', es: 'Bruto:' },
  'Cash-in:': { pt: 'Cash-in:', es: 'Cash-in:' },
  'Vendas:': { pt: 'Vendas:', es: 'Ventas:' },
  'Carregando rotinas...': { pt: 'Carregando rotinas...', es: 'Cargando rutinas...' },
  'Agendados': { pt: 'Agendados', es: 'Agendados' },
  'Ações Hoje': { pt: 'Ações Hoje', es: 'Acciones Hoy' },

  // ─── SalesGoalChart ─────────────────────────────────────────────────
  'Todo o período': { pt: 'Todo o período', es: 'Todo el período' },
  'Hoje': { pt: 'Hoje', es: 'Hoy' },
  'Este mês': { pt: 'Este mês', es: 'Este mes' },
  'Mês passado': { pt: 'Mês passado', es: 'Mes pasado' },
  'Período': { pt: 'Período', es: 'Período' },
  'Todas as vendedoras': { pt: 'Todas as vendedoras', es: 'Todas las vendedoras' },
  'Filtrar vendedora': { pt: 'Filtrar vendedora', es: 'Filtrar vendedora' },
  'da meta': { pt: 'da meta', es: 'de la meta' },
  'Venda Bruta': { pt: 'Venda Bruta', es: 'Venta Bruta' },
  'Cash-in (Líquido)': { pt: 'Cash-in (Líquido)', es: 'Cash-in (Neto)' },
  'Por Vendedora': { pt: 'Por Vendedora', es: 'Por Vendedora' },

  // ─── SalesAndLossesTable ────────────────────────────────────────────
  'Registro de Vendas e Perdidos': { pt: 'Registro de Vendas e Perdidos', es: 'Registro de Ventas y Perdidos' },
  'Todas vendedoras': { pt: 'Todas vendedoras', es: 'Todas vendedoras' },
  'Vendedora': { pt: 'Vendedora', es: 'Vendedora' },
  'Pagamento': { pt: 'Pagamento', es: 'Pago' },
  'Todos': { pt: 'Todos', es: 'Todos' },
  'Boleto': { pt: 'Boleto', es: 'Boleto' },
  'Limpar': { pt: 'Limpar', es: 'Limpiar' },
  'Perdidos': { pt: 'Perdidos', es: 'Perdidos' },
  'Lead': { pt: 'Lead', es: 'Lead' },
  'Tipo': { pt: 'Tipo', es: 'Tipo' },
  'Bruto': { pt: 'Bruto', es: 'Bruto' },
  'Comprovante': { pt: 'Comprovante', es: 'Comprobante' },
  'Data': { pt: 'Data', es: 'Fecha' },
  'Nenhuma venda encontrada': { pt: 'Nenhuma venda encontrada', es: 'Ninguna venta encontrada' },
  'Call': { pt: 'Call', es: 'Call' },
  'Follow-up': { pt: 'Follow-up', es: 'Follow-up' },
  'Ver': { pt: 'Ver', es: 'Ver' },
  'Faturamento': { pt: 'Faturamento', es: 'Facturación' },
  'Motivo': { pt: 'Motivo', es: 'Motivo' },
  'Nenhum lead perdido encontrado': { pt: 'Nenhum lead perdido encontrado', es: 'Ningún lead perdido encontrado' },
  'Comissão por Vendedora': { pt: 'Comissão por Vendedora', es: 'Comisión por Vendedora' },
  'Total Cash-in': { pt: 'Total Cash-in', es: 'Total Cash-in' },
  'Comissão (7,5%)': { pt: 'Comissão (7,5%)', es: 'Comisión (7,5%)' },
  'Total': { pt: 'Total', es: 'Total' },

  // ─── Leads page ─────────────────────────────────────────────────────
  'Gerenciar Leads': { pt: 'Gerenciar Leads', es: 'Gestionar Leads' },
  'Total:': { pt: 'Total:', es: 'Total:' },
  'Coletados:': { pt: 'Coletados:', es: 'Recolectados:' },
  'Pendentes:': { pt: 'Pendentes:', es: 'Pendientes:' },
  'Exportar': { pt: 'Exportar', es: 'Exportar' },
  'Novo Lead': { pt: 'Novo Lead', es: 'Nuevo Lead' },
  'Leads Coletados': { pt: 'Leads Coletados', es: 'Leads Recolectados' },
  'Meus Leads': { pt: 'Meus Leads', es: 'Mis Leads' },
  'Leads Disponíveis': { pt: 'Leads Disponíveis', es: 'Leads Disponibles' },

  // ─── Routine page ──────────────────────────────────────────────────
  'Rotina Diária — Visão Geral': { pt: 'Rotina Diária — Visão Geral', es: 'Rutina Diaria — Visión General' },
  'Rotina Diária': { pt: 'Rotina Diária', es: 'Rutina Diaria' },
  'tarefas concluídas': { pt: 'tarefas concluídas', es: 'tareas completadas' },
  'Carregando rotina...': { pt: 'Carregando rotina...', es: 'Cargando rutina...' },

  // ─── SalesGoal page ────────────────────────────────────────────────
  'Meta de vendas': { pt: 'Meta de vendas', es: 'Meta de ventas' },

  // ─── SalesFunnel ────────────────────────────────────────────────────
  'Funil de Conversão': { pt: 'Funil de Conversão', es: 'Embudo de Conversión' },
  'Leads Coletados (com responsável)': { pt: 'Leads Coletados (com responsável)', es: 'Leads Recolectados (con responsable)' },
  'WhatsApp Enviado': { pt: 'WhatsApp Enviado', es: 'WhatsApp Enviado' },
  'Reuniões Realizadas': { pt: 'Reuniões Realizadas', es: 'Reuniones Realizadas' },
  'No-show': { pt: 'No-show', es: 'No-show' },
  'Propostas Enviadas': { pt: 'Propostas Enviadas', es: 'Propuestas Enviadas' },
  'Vendas na Call': { pt: 'Vendas na Call', es: 'Ventas en Call' },
  'Vendas no Follow-up': { pt: 'Vendas no Follow-up', es: 'Ventas en Follow-up' },
  'Taxas de Conversão': { pt: 'Taxas de Conversão', es: 'Tasas de Conversión' },
  'Total de Vendas': { pt: 'Total de Vendas', es: 'Total de Ventas' },

  // ─── Commissions page ──────────────────────────────────────────────
  'Identifique automaticamente quem pagou e qual vendedora vendeu': {
    pt: 'Identifique automaticamente quem pagou e qual vendedora vendeu',
    es: 'Identifique automáticamente quién pagó y cuál vendedora vendió',
  },
  'Pedidos da TMB': { pt: 'Pedidos da TMB', es: 'Pedidos de TMB' },
  'Clientes Mapeados': { pt: 'Clientes Mapeados', es: 'Clientes Mapeados' },
  'Vendedoras com Comissão': { pt: 'Vendedoras com Comissão', es: 'Vendedoras con Comisión' },
  'Total Identificado': { pt: 'Total Identificado', es: 'Total Identificado' },
  'Buscar Contratos Ativos da TMB': { pt: 'Buscar Contratos Ativos da TMB', es: 'Buscar Contratos Activos de TMB' },
  'Buscando na TMB...': { pt: 'Buscando na TMB...', es: 'Buscando en TMB...' },
  'pedidos efetivados encontrados': { pt: 'pedidos efetivados encontrados', es: 'pedidos efectuados encontrados' },
  'Cliente': { pt: 'Cliente', es: 'Cliente' },
  'Email': { pt: 'Email', es: 'Email' },
  'Parcela': { pt: 'Parcela', es: 'Cuota' },
  'Alternativa: Upload Manual de Pagamentos (CSV)': {
    pt: 'Alternativa: Upload Manual de Pagamentos (CSV)',
    es: 'Alternativa: Carga Manual de Pagos (CSV)',
  },
  'Planilha: Clientes × Vendedoras': { pt: 'Planilha: Clientes × Vendedoras', es: 'Planilla: Clientes × Vendedoras' },
  'Calcular Comissões': { pt: 'Calcular Comissões', es: 'Calcular Comisiones' },
  'Calculando...': { pt: 'Calculando...', es: 'Calculando...' },
  'Resultado': { pt: 'Resultado', es: 'Resultado' },
  'Detalhes': { pt: 'Detalhes', es: 'Detalles' },
  'Parcelas': { pt: 'Parcelas', es: 'Cuotas' },
  'Dia Pag.': { pt: 'Dia Pag.', es: 'Día Pago' },
  'Contrato desde': { pt: 'Contrato desde', es: 'Contrato desde' },
  'Parcela/mês': { pt: 'Parcela/mês', es: 'Cuota/mes' },
  'V. Total Contrato': { pt: 'V. Total Contrato', es: 'V. Total Contrato' },
  'sem correspondência': { pt: 'sem correspondência', es: 'sin correspondencia' },
  'Produto': { pt: 'Produto', es: 'Producto' },
  'Nome': { pt: 'Nome', es: 'Nombre' },
  'Confirmar e Salvar': { pt: 'Confirmar e Salvar', es: 'Confirmar y Guardar' },
  'Salvando...': { pt: 'Salvando...', es: 'Guardando...' },
  'Cancelar': { pt: 'Cancelar', es: 'Cancelar' },
  'Trocar': { pt: 'Trocar', es: 'Cambiar' },
  'Usar estes dados': { pt: 'Usar estes dados', es: 'Usar estos datos' },

  // ─── WebinarLeadsTab ────────────────────────────────────────────────
  'Buscar nome...': { pt: 'Buscar nome...', es: 'Buscar nombre...' },
  '@usuario': { pt: '@usuario', es: '@usuario' },
  'Webinário': { pt: 'Webinário', es: 'Webinario' },
  'Somente MQL': { pt: 'Somente MQL', es: 'Solo MQL' },
  'Limpar filtros': { pt: 'Limpar filtros', es: 'Limpiar filtros' },
  'leads novos aguardando coleta': { pt: 'leads novos aguardando coleta', es: 'leads nuevos esperando recolección' },
  'Insta': { pt: 'Insta', es: 'Insta' },
  'Status': { pt: 'Status', es: 'Estado' },
  'Ações': { pt: 'Ações', es: 'Acciones' },
  'Carregando...': { pt: 'Carregando...', es: 'Cargando...' },
  'Nenhum lead disponível': { pt: 'Nenhum lead disponível', es: 'Ningún lead disponible' },
  'Profissão': { pt: 'Profissão', es: 'Profesión' },
  'Maior Dificuldade': { pt: 'Maior Dificuldade', es: 'Mayor Dificultad' },
  'Renda Familiar': { pt: 'Renda Familiar', es: 'Ingreso Familiar' },
  'Quem Investe': { pt: 'Quem Investe', es: 'Quién Invierte' },
  'Coletando...': { pt: 'Coletando...', es: 'Recolectando...' },
  'Coletar': { pt: 'Coletar', es: 'Recolectar' },
  'Mais informações': { pt: 'Mais informações', es: 'Más información' },
  'Enviar WhatsApp': { pt: 'Enviar WhatsApp', es: 'Enviar WhatsApp' },

  // ─── MyLeadsTab ────────────────────────────────────────────────────
  'Buscar nome, WhatsApp...': { pt: 'Buscar nome, WhatsApp...', es: 'Buscar nombre, WhatsApp...' },
  'Etapa': { pt: 'Etapa', es: 'Etapa' },
  'Todas as etapas': { pt: 'Todas as etapas', es: 'Todas las etapas' },
  'WhatsApp enviado': { pt: 'WhatsApp enviado', es: 'WhatsApp enviado' },
  'Não respondeu': { pt: 'Não respondeu', es: 'No respondió' },
  'Agendado': { pt: 'Agendado', es: 'Agendado' },
  'Reunião realizada': { pt: 'Reunião realizada', es: 'Reunión realizada' },
  'Follow-up feito': { pt: 'Follow-up feito', es: 'Follow-up hecho' },
  'Venda na Call': { pt: 'Venda na Call', es: 'Venta en Call' },
  'Venda no Follow-up': { pt: 'Venda no Follow-up', es: 'Venta en Follow-up' },
  'Webinários': { pt: 'Webinários', es: 'Webinarios' },
  'Todos os webinários': { pt: 'Todos os webinários', es: 'Todos los webinarios' },
  'Etapas': { pt: 'Etapas', es: 'Etapas' },
  'Responsável': { pt: 'Responsável', es: 'Responsable' },
  'Nenhum lead encontrado': { pt: 'Nenhum lead encontrado', es: 'Ningún lead encontrado' },
  'leads URGENTES': { pt: 'leads URGENTES', es: 'leads URGENTES' },
  'Marcar 1º Contato Feito': { pt: 'Marcar 1º Contato Feito', es: 'Marcar 1er Contacto Hecho' },
  'Não Respondeu': { pt: 'Não Respondeu', es: 'No Respondió' },
  'Agendar Reunião': { pt: 'Agendar Reunião', es: 'Agendar Reunión' },
  'Marcar No-show': { pt: 'Marcar No-show', es: 'Marcar No-show' },
  'Follow-up Feito': { pt: 'Follow-up Feito', es: 'Follow-up Hecho' },
  'Lead Perdido': { pt: 'Lead Perdido', es: 'Lead Perdido' },
  'Descoletar Lead': { pt: 'Descoletar Lead', es: 'Devolver Lead' },
  'Trocar Responsável': { pt: 'Trocar Responsável', es: 'Cambiar Responsable' },
  'Selecionar nova responsável': { pt: 'Selecionar nova responsável', es: 'Seleccionar nueva responsable' },
  'Confirmar Troca': { pt: 'Confirmar Troca', es: 'Confirmar Cambio' },

  // ─── NewLeadDialog ─────────────────────────────────────────────────
  'Nome *': { pt: 'Nome *', es: 'Nombre *' },
  'Nome completo': { pt: 'Nome completo', es: 'Nombre completo' },
  'WhatsApp *': { pt: 'WhatsApp *', es: 'WhatsApp *' },
  'Origem': { pt: 'Origem', es: 'Origen' },
  'Data do Webinário': { pt: 'Data do Webinário', es: 'Fecha del Webinario' },
  '(opcional)': { pt: '(opcional)', es: '(opcional)' },
  'Informe a data do webinário para filtrar leads por evento': {
    pt: 'Informe a data do webinário para filtrar leads por evento',
    es: 'Informe la fecha del webinario para filtrar leads por evento',
  },
  'Atribuir a vendedora (opcional)': { pt: 'Atribuir a vendedora (opcional)', es: 'Asignar a vendedora (opcional)' },
  'Sem responsável': { pt: 'Sem responsável', es: 'Sin responsable' },
  'Sem responsável (pool)': { pt: 'Sem responsável (pool)', es: 'Sin responsable (pool)' },
  'Ocultar campos opcionais': { pt: 'Ocultar campos opcionais', es: 'Ocultar campos opcionales' },
  'Mostrar campos opcionais (email, profissão, etc.)': {
    pt: 'Mostrar campos opcionais (email, profissão, etc.)',
    es: 'Mostrar campos opcionales (email, profesión, etc.)',
  },
  'Quem Investe na Sua Carreira?': { pt: 'Quem Investe na Sua Carreira?', es: '¿Quién Invierte en Su Carrera?' },
  'Adicionar Lead': { pt: 'Adicionar Lead', es: 'Agregar Lead' },

  // ─── SaleDialog ────────────────────────────────────────────────────
  'Registrar Venda 🎉': { pt: 'Registrar Venda 🎉', es: 'Registrar Venta 🎉' },
  'Valor da Venda (Bruto)': { pt: 'Valor da Venda (Bruto)', es: 'Valor de la Venta (Bruto)' },
  'Valor em Cash-in (Líquido recebido)': { pt: 'Valor em Cash-in (Líquido recebido)', es: 'Valor Cash-in (Neto recibido)' },
  'Método de Pagamento': { pt: 'Método de Pagamento', es: 'Método de Pago' },
  'Detalhes HUBLA + Boleto': { pt: 'Detalhes HUBLA + Boleto', es: 'Detalles HUBLA + Boleto' },
  'Valor da entrada (HUBLA à vista)': { pt: 'Valor da entrada (HUBLA à vista)', es: 'Valor de entrada (HUBLA al contado)' },
  'Valor parcelado no Boleto': { pt: 'Valor parcelado no Boleto', es: 'Valor en cuotas del Boleto' },
  'Comprovante de Pagamento': { pt: 'Comprovante de Pagamento', es: 'Comprobante de Pago' },
  'Clique ou arraste o arquivo aqui': { pt: 'Clique ou arraste o arquivo aqui', es: 'Haga clic o arrastre el archivo aquí' },
  'Remover arquivo': { pt: 'Remover arquivo', es: 'Eliminar archivo' },
  'Confirmar Venda': { pt: 'Confirmar Venda', es: 'Confirmar Venta' },

  // ─── LostReasonDialog ──────────────────────────────────────────────
  'Sem orçamento': { pt: 'Sem orçamento', es: 'Sin presupuesto' },
  'Escolheu concorrente': { pt: 'Escolheu concorrente', es: 'Eligió competidor' },
  'Não tem interesse': { pt: 'Não tem interesse', es: 'No tiene interés' },
  'Timing ruim': { pt: 'Timing ruim', es: 'Mal momento' },
  'Por que': { pt: 'Por que', es: 'Por qué' },
  'foi perdido?': { pt: 'foi perdido?', es: 'fue perdido?' },
  'Descreva o motivo da perda...': { pt: 'Descreva o motivo da perda...', es: 'Describa el motivo de la pérdida...' },
  'Confirmar Lead Perdido': { pt: 'Confirmar Lead Perdido', es: 'Confirmar Lead Perdido' },

  // ─── NeonLeadComponents ────────────────────────────────────────────
  'Mostrando': { pt: 'Mostrando', es: 'Mostrando' },
  'de': { pt: 'de', es: 'de' },
  'Anterior': { pt: 'Anterior', es: 'Anterior' },
  'Próximo': { pt: 'Próximo', es: 'Siguiente' },

  // ─── Misc / common ────────────────────────────────────────────────
  'venda': { pt: 'venda', es: 'venta' },
  'registrada': { pt: 'registrada', es: 'registrada' },
  'registradas': { pt: 'registradas', es: 'registradas' },
  'Meta:': { pt: 'Meta:', es: 'Meta:' },
  'Abrir': { pt: 'Abrir', es: 'Abrir' },
  'pagamento': { pt: 'pagamento', es: 'pago' },
  'pagamentos': { pt: 'pagamentos', es: 'pagos' },
} as const;

type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('dashLang') as Lang) || 'pt';
  });

  const handleSetLang = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('dashLang', newLang);
  };

  const t = (key: string): string => {
    const entry = translations[key as TranslationKey];
    if (!entry) return key;
    return entry[lang] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
