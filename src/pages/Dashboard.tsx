import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Calendar, TrendingUp, AlertTriangle, Phone, CheckCircle2, Download, Filter, LucideIcon, Clock } from 'lucide-react';
import { SalesFunnelChart } from '@/components/dashboard/SalesFunnelChart';
import { AlertLeadsDialog } from '@/components/dashboard/AlertLeadsDialog';
import { isToday, isYesterday, parseISO, format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isWithinInterval, subDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';

function NeonKPICard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: LucideIcon; color: string }) {
  return (
    <div className="group relative bg-card p-4 md:p-6 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1">
      <div
        className="absolute -top-10 -right-10 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500"
        style={{ backgroundColor: color }}
      />
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between mb-2 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-2.5 rounded-xl bg-muted/30 group-hover:bg-muted/50 transition-colors relative">
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity blur-md" style={{ backgroundColor: color }} />
              <Icon size={18} className="md:hidden" style={{ color, filter: `drop-shadow(0 0 8px ${color}66)` }} />
              <Icon size={20} className="hidden md:block" style={{ color, filter: `drop-shadow(0 0 8px ${color}66)` }} />
            </div>
            <span className="text-muted-foreground text-xs md:text-sm font-medium tracking-wide group-hover:text-foreground transition-colors">
              {title}
            </span>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl md:text-4xl font-black text-foreground tracking-tighter leading-none" style={{ textShadow: `0 0 20px ${color}33` }}>
            {value}
          </span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-muted/30">
        <div
          className="h-full opacity-50 group-hover:opacity-100 transition-all duration-1000 ease-out w-0 group-hover:w-full"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { selectedProfile, isAdmin, teamMembers } = useProfileSelector();
  const { t } = useLanguage();
  const [showFollowupDialog, setShowFollowupDialog] = useState(false);
  const [showSemResponsavelDialog, setShowSemResponsavelDialog] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('this_month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data } = await supabase.from('leads').select('*');
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles_dash'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles_dash').select('*');
      return data || [];
    },
  });

  const { data: allActions = [] } = useQuery({
    queryKey: ['lead_actions'],
    queryFn: async () => {
      const { data } = await supabase.from('lead_actions').select('*');
      return data || [];
    },
  });

  const { data: todayActions = [] } = useQuery({
    queryKey: ['today-actions'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase.from('lead_actions').select('*').gte('created_at', today);
      return data || [];
    },
  });

  // Helper: tag ISO = lead manual
  const isManualTag = (tag: string | null | undefined) =>
    !!tag && /^\d{4}-\d{2}-\d{2}$/.test(tag);

  // Tags reais (webinarios automaticos) para o dropdown
  const realWebinarTags = useMemo(() =>
    Array.from(new Set(
      leads
        .filter(l => l.webinar_date_tag && !isManualTag(l.webinar_date_tag))
        .map(l => l.webinar_date_tag as string)
    )).sort().reverse(),
    [leads]
  );

  const isGlobalAdminView = isAdmin && selectedProfile.role === 'ADMIN';

  // Filter leads based on selected profile
  const profileFilteredLeads = isGlobalAdminView ? leads : leads.filter(l => l.assigned_to === selectedProfile.id);

  // Segment filter (admin only)
  const segmentedLeads = useMemo(() => {
    if (!isGlobalAdminView || segmentFilter === 'all') return profileFilteredLeads;
    if (segmentFilter === 'webinars') return profileFilteredLeads.filter(l => l.origem === 'webinar' && !isManualTag(l.webinar_date_tag));
    if (segmentFilter === 'manual') return profileFilteredLeads.filter(l => l.origem !== 'webinar' || isManualTag(l.webinar_date_tag));
    // specific webinar tag
    return profileFilteredLeads.filter(l => l.webinar_date_tag === segmentFilter);
  }, [profileFilteredLeads, segmentFilter, isGlobalAdminView]);

  const visibleLeads = segmentedLeads;
  const visibleLeadIds = new Set(visibleLeads.map(l => l.id));

  // Date range for filter
  const dateRange = useMemo(() => {
    if (dateFilter === 'all') return null;
    const now = new Date();
    if (dateFilter === 'today') return { start: startOfDay(now), end: endOfDay(now) };
    if (dateFilter === 'yesterday') {
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    if (dateFilter === 'this_week') return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    if (dateFilter === 'this_month') return { start: startOfMonth(now), end: endOfMonth(now) };
    if (dateFilter === 'custom' && customRange?.from) {
      return { 
        start: startOfDay(customRange.from), 
        end: customRange.to ? endOfDay(customRange.to) : endOfDay(customRange.from) 
      };
    }
    return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
  }, [dateFilter, customRange]);

  const isInRange = (dateStr: string | null | undefined) => {
    if (!dateRange) return true;
    if (!dateStr) return false;
    try { return isWithinInterval(parseISO(dateStr), dateRange); }
    catch { return false; }
  };

  // Count from lead_actions history filtered by date period
  const visibleActions = allActions.filter(a => a.lead_id && visibleLeadIds.has(a.lead_id));
  const periodActions = visibleActions.filter(a => isInRange(a.created_at));
  const countAction = (actionType: string) => new Set(periodActions.filter(a => a.action_type === actionType).map(a => a.lead_id)).size;

  const leadsToday = visibleLeads.filter(l => l.created_at && isToday(parseISO(l.created_at))).length;
  const agendados = countAction('scheduled_meeting');
  const reunioes = countAction('meeting_done');
  const vendas = visibleLeads.filter(l => (l.sale_status === 'won_call' || l.sale_status === 'won_followup') && isInRange(l.last_action_at)).length;
  const followUpLeads = visibleLeads.filter(l => l.next_followup_date && new Date(l.next_followup_date) <= new Date());
  const followUpPendente = followUpLeads.length;
  const semResponsavelLeads = leads.filter(l => !l.assigned_to);
  const semResponsavel = semResponsavelLeads.length;

  const formatDuration = (ms: number) => {
    if (ms <= 0) return '—';
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const responseTimeMetric = useMemo(() => {
    const collectionActions = allActions.filter(a => 
      a.action_type === 'lead_collected' && 
      isInRange(a.created_at) &&
      leads.find(l => l.id === a.lead_id)?.origem === 'webinar' &&
      (isGlobalAdminView ? true : (a.user_id === selectedProfile.id))
    );

    const durations = collectionActions.map(action => {
      const lead = leads.find(l => l.id === action.lead_id);
      if (!lead?.created_at || !action.created_at) return null;
      
      // Data de corte: 16/04/2026 às 19:00 (UTC-3) correspondente a 2026-04-16T22:00:00Z
      const cutoff = new Date('2026-04-16T19:00:00-03:00');
      if (new Date(lead.created_at) < cutoff) return null;

      const diff = new Date(action.created_at).getTime() - new Date(lead.created_at).getTime();
      return diff > 0 ? diff : null;
    }).filter((d): d is number => d !== null);

    if (durations.length === 0) return { avg: '—', raw: 0 };
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    return { avg: formatDuration(avg), raw: avg };
  }, [allActions, leads, isInRange, isGlobalAdminView, selectedProfile.id]);

  const getSellerResponseTime = (sellerId: string) => {
    const pLeads = leads.filter(l => l.assigned_to === sellerId && l.origem === 'webinar');
    const pLeadIds = new Set(pLeads.map(l => l.id));
    const pCollectionActions = allActions.filter(a => 
      a.action_type === 'lead_collected' && 
      a.user_id === sellerId &&
      pLeadIds.has(a.lead_id!) &&
      isInRange(a.created_at)
    );

    const durations = pCollectionActions.map(action => {
      const lead = pLeads.find(l => l.id === action.lead_id);
      if (!lead?.created_at || !action.created_at) return null;
      const diff = new Date(action.created_at).getTime() - new Date(lead.created_at).getTime();
      return diff > 0 ? diff : null;
    }).filter((d): d is number => d !== null);

    if (durations.length === 0) return '—';
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    return formatDuration(avg);
  };

  const profileMap: Record<string, string> = {};
  profiles.forEach((p: any) => { if (p.id && p.full_name) profileMap[p.id] = p.full_name; });

  const metrics = [
    { label: t('Leads Hoje'), value: leadsToday, icon: Users, color: '#db2777' },
    { label: t('Agendamentos'), value: agendados, icon: Calendar, color: '#ef4444' },
    { label: t('Reuniões'), value: reunioes, icon: Phone, color: '#3b82f6' },
    { label: t('Vendas'), value: vendas, icon: TrendingUp, color: '#22c55e' },
    { label: t('Follow-up Pendente'), value: followUpPendente, icon: AlertTriangle, color: '#eab308' },
    { label: t('Tempo Médio Coleta'), value: responseTimeMetric.avg, icon: Clock, color: '#06b6d4', adminOnly: true },
    { label: t('Total Leads'), value: visibleLeads.length, icon: CheckCircle2, color: '#9ca3af' },
  ].filter(m => !m.adminOnly || isAdmin);

  // Usa os perfis REAIS do banco limpando testes e duplicados
  const realTeamMembers = useMemo(() => {
    const seen = new Set<string>();
    return profiles.filter((p: any) => {
      if (!p.full_name || p.role === 'ADMIN') return false;
      if (p.full_name.toLowerCase().includes('test')) return false;
      if (p.id.startsWith('0000')) return false;
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [profiles]);

  const sellers = realTeamMembers;

  const exportCSV = () => {
    const now = format(new Date(), 'yyyy-MM-dd HH:mm');
    const allLeadIds = new Set(leads.map(l => l.id));
    const relevantActions = allActions.filter(a => a.lead_id && allLeadIds.has(a.lead_id));
    const countUnique = (actionType: string) =>
      new Set(relevantActions.filter(a => a.action_type === actionType).map(a => a.lead_id)).size;

    const esc = (v: string | number | null | undefined) => {
      const s = String(v ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };

    const rows: string[] = [];
    const row = (...cols: (string | number | null | undefined)[]) => rows.push(cols.map(esc).join(','));

    row('METRICAS GERAIS');
    row('Metrica', 'Valor', 'Data Referencia');
    row('Total de Leads', leads.length, now);
    row('Leads Hoje', leadsToday, format(new Date(), 'dd/MM/yyyy'));
    row('Leads sem Responsavel', semResponsavel, now);
    row('Follow-ups Pendentes', followUpPendente, now);
    rows.push('');

    const coletados = leads.filter(l => !!l.assigned_to).length;
    const whatsapp = countUnique('whatsapp_sent');
    const agend = countUnique('scheduled_meeting');
    const reun = countUnique('meeting_done');
    const noShow = countUnique('no_show_marked');
    const followUp = countUnique('followup_done');
    const vCall = countUnique('sale_won_call');
    const vFollowup = countUnique('sale_won_followup');
    const pct = (n: number, d: number) => d > 0 ? ((n / d) * 100).toFixed(1) : '0';

    row('FUNIL COMERCIAL');
    row('Etapa', 'Quantidade', 'Conversao %', 'Base');
    row('Leads Coletados', coletados, '', '');
    row('WhatsApp Enviado', whatsapp, pct(whatsapp, coletados), 'Coletados');
    row('Agendamentos', agend, pct(agend, coletados), 'Coletados');
    row('Reunioes Realizadas', reun, pct(reun, agend), 'Agendamentos');
    row('No-show', noShow, pct(noShow, agend), 'Agendamentos');
    row('Follow-up', followUp, pct(followUp, reun), 'Reunioes');
    row('Vendas na Call', vCall, pct(vCall, reun), 'Reunioes');
    row('Vendas no Follow-up', vFollowup, pct(vFollowup, followUp), 'Follow-ups');
    rows.push('');

    row('POR VENDEDORA');
    row('Vendedora', 'Cargo', 'Leads Atribuidos', 'Vendas', 'Venda Bruta', 'Cash-in', 'Acoes Hoje');
    sellers.forEach(p => {
      const pLeads = leads.filter(l => l.assigned_to === p.id);
      const pWon = pLeads.filter(l => l.sale_status === 'won_call' || l.sale_status === 'won_followup');
      const bruto = pWon.reduce((s, l) => s + (Number(l.sale_value) || 0), 0);
      const cash = pWon.reduce((s, l) => s + (Number(l.cash_value) || 0), 0);
      const pTodayActions = todayActions.filter(a => a.user_id === p.id);
      row(p.full_name, p.role, pLeads.length, pWon.length, bruto.toFixed(2), cash.toFixed(2), pTodayActions.length);
    });
    rows.push('');

    row('DETALHAMENTO DE LEADS');
    row('Nome', 'WhatsApp', 'Email', 'Instagram', 'Origem', 'Status', 'Status Venda', 'Responsavel', 'Data Criacao', 'Valor Venda', 'Cash-in', 'Faturamento');
    leads.forEach(l => {
      const seller = teamMembers.find(m => m.id === l.assigned_to);
      row(
        l.nome, l.whatsapp, l.email, l.instagram, l.origem, l.status, l.sale_status,
        seller?.full_name || 'Sem responsavel',
        l.created_at ? format(parseISO(l.created_at), 'dd/MM/yyyy HH:mm') : '',
        l.sale_value || 0, l.cash_value || 0, l.faturamento || 0,
      );
    });

    const csvContent = rows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Neon Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-1">{t('Dashboard')}</h1>
          <p className="text-muted-foreground text-xs md:text-sm font-medium">
            {isGlobalAdminView ? t('Visão geral do time') : `Visão de ${selectedProfile.full_name}`}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap w-full md:w-auto">
          {/* Filtro por período — visível para todos */}
          <div className="flex items-center gap-2 flex-1 md:flex-none">
            <Calendar size={14} className="text-muted-foreground hidden md:block" />
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[180px] bg-card">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t('Hoje')}</SelectItem>
                <SelectItem value="yesterday">{t('Ontem')}</SelectItem>
                <SelectItem value="this_week">{t('Esta Semana')}</SelectItem>
                <SelectItem value="this_month">{t('Este Mês')}</SelectItem>
                <SelectItem value="last_month">{t('Mês Passado')}</SelectItem>
                <SelectItem value="custom">{t('Personalizado')}</SelectItem>
                <SelectItem value="all">{t('Todos os Tempos')}</SelectItem>
              </SelectContent>
            </Select>

            {dateFilter === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 bg-card border border-input px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
                    <Calendar size={14} className="text-primary" />
                    {customRange?.from ? (
                      customRange.to ? (
                        <>
                          {format(customRange.from, "dd/MM")} - {format(customRange.to, "dd/MM")}
                        </>
                      ) : (
                        format(customRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      "Selecionar data"
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarPicker
                    initialFocus
                    mode="range"
                    defaultMonth={customRange?.from}
                    selected={customRange}
                    onSelect={setCustomRange}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 flex-1 md:flex-none">
              <Filter size={14} className="text-muted-foreground hidden md:block" />
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="w-full md:w-[220px] bg-card">
                  <SelectValue placeholder="Segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('Todos os leads')}</SelectItem>
                  <SelectItem value="webinars">{t('Todos os Webinários')}</SelectItem>
                  {realWebinarTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                  <SelectItem value="manual">{t('Leads Manuais')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {isAdmin && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-card hover:bg-muted text-muted-foreground hover:text-foreground px-5 py-2.5 rounded-lg transition-all text-sm font-semibold group"
            >
              <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" />
              {t('Exportar CSV')}
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {isAdmin && (followUpPendente > 0 || semResponsavel > 0) && (
        <div className="flex gap-3 flex-wrap">
          {followUpPendente > 0 && (
            <button
              onClick={() => setShowFollowupDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-lg text-sm font-medium hover:bg-warning/20 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" /> {followUpPendente} {t('follow-ups atrasados')}
            </button>
          )}
          {semResponsavel > 0 && (
            <button
              onClick={() => setShowSemResponsavelDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" /> {semResponsavel} {t('leads sem responsável')}
            </button>
          )}
        </div>
      )}

      <AlertLeadsDialog
        title={t('Follow-ups Atrasados')}
        leads={followUpLeads}
        profileMap={profileMap}
        open={showFollowupDialog}
        onOpenChange={setShowFollowupDialog}
        dateLabel="Follow-up"
        getDate={(l) => l.next_followup_date}
      />
      <AlertLeadsDialog
        title={t('Leads sem Responsável')}
        leads={semResponsavelLeads}
        profileMap={profileMap}
        open={showSemResponsavelDialog}
        onOpenChange={setShowSemResponsavelDialog}
        dateLabel="Criação"
      />

      {/* Neon KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {metrics.map(m => (
          <NeonKPICard key={m.label} title={m.label} value={m.value} icon={m.icon} color={m.color} />
        ))}
      </div>

      <SalesFunnelChart leads={isGlobalAdminView ? segmentedLeads : visibleLeads} actions={allActions.filter(a => isInRange(a.created_at))} isAdmin={isGlobalAdminView} />

      {isGlobalAdminView && (
        <Card>
          <CardHeader><CardTitle>{t('Vendas por Vendedora')}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {realTeamMembers.map((p: any) => {
                const pWon = leads.filter(l => l.assigned_to === p.id && (l.sale_status === 'won_call' || l.sale_status === 'won_followup') && isInRange(l.last_action_at));
                const bruto = pWon.reduce((s, l) => s + (Number(l.sale_value) || 0), 0);
                const cash = pWon.reduce((s, l) => s + (Number(l.cash_value) || 0), 0);
                return (
                  <Card key={p.id} className="border">
                    <CardContent className="p-4">
                      <p className="font-semibold mb-1">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground mb-3">{pWon.length} {t('vendas')}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('Bruto:')}</span>
                          <span className="font-bold tabular-nums">R$ {bruto.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('Cash-in:')}</span>
                          <span className="font-bold tabular-nums" style={{ color: 'hsl(160, 80%, 45%)' }}>R$ {cash.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('Vendas:')}</span>
                          <span className="font-bold tabular-nums">{pWon.length}</span>
                        </div>
                        <div className="flex justify-between border-t border-muted/30 pt-1 mt-1">
                          <span className="text-muted-foreground">{t('T. Coleta:')}</span>
                          <span className="font-bold tabular-nums">{getSellerResponseTime(p.id)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isGlobalAdminView && realTeamMembers.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t('Equipe')}</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="overview">{t('Visão Geral')}</TabsTrigger>
                {realTeamMembers.map((p: any) => (
                  <TabsTrigger key={p.id} value={p.id}>{p.full_name}</TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {realTeamMembers.map((p: any) => {
                    const pLeads = leads.filter(l => l.assigned_to === p.id);
                    const pActions = todayActions.filter(a => a.user_id === p.id);
                    return (
                      <Card key={p.id} className="border">
                        <CardContent className="p-4">
                          <p className="font-semibold mb-1">{p.full_name}</p>
                          <p className="text-xs text-muted-foreground mb-3">{p.role}</p>
                          <div className="space-y-1 text-sm">
                            <p>{pLeads.length} {t('leads atribuídos')}</p>
                            <p>{pActions.length} {t('ações hoje')}</p>
                            <p>{pLeads.filter(l => (l.sale_status === 'won_call' || l.sale_status === 'won_followup') && isInRange(l.last_action_at)).length} {t('vendas')}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
              {realTeamMembers.map((p: any) => {
                const pLeads = leads.filter(l => l.assigned_to === p.id);
                const pLeadIds = new Set(pLeads.map(l => l.id));
                const pAllActions = allActions.filter(a => a.lead_id && pLeadIds.has(a.lead_id));
                const pPeriodActions = pAllActions.filter(a => isInRange(a.created_at));
                const pCountAction = (at: string) => new Set(pPeriodActions.filter(a => a.action_type === at).map(a => a.lead_id)).size;
                const pActions = todayActions.filter(a => a.user_id === p.id);
                const pWonInPeriod = pLeads.filter(l => (l.sale_status === 'won_call' || l.sale_status === 'won_followup') && isInRange(l.last_action_at));
                return (
                  <TabsContent key={p.id} value={p.id} className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{pLeads.length}</p><p className="text-xs text-muted-foreground">{t('Leads')}</p></CardContent></Card>
                      <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{pCountAction('scheduled_meeting')}</p><p className="text-xs text-muted-foreground">{t('Agendados')}</p></CardContent></Card>
                      <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{pCountAction('meeting_done')}</p><p className="text-xs text-muted-foreground">{t('Reuniões')}</p></CardContent></Card>
                      <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{pActions.length}</p><p className="text-xs text-muted-foreground">{t('Ações Hoje')}</p></CardContent></Card>
                      <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{pWonInPeriod.length}</p><p className="text-xs text-muted-foreground">{t('Vendas')}</p></CardContent></Card>
                      <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{getSellerResponseTime(p.id)}</p><p className="text-xs text-muted-foreground">{t('T. Coleta')}</p></CardContent></Card>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
