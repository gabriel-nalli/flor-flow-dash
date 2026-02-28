import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileSelector, TEAM_MEMBERS } from '@/contexts/ProfileSelectorContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Calendar, TrendingUp, AlertTriangle, Phone, CheckCircle2, Download, Filter, LucideIcon } from 'lucide-react';
import { SalesFunnelChart } from '@/components/dashboard/SalesFunnelChart';
import { AlertLeadsDialog } from '@/components/dashboard/AlertLeadsDialog';
import { isToday, parseISO, format } from 'date-fns';

function NeonKPICard({ title, value, icon: Icon, color }: { title: string; value: number; icon: LucideIcon; color: string }) {
  return (
    <div className="group relative bg-card p-6 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1">
      <div
        className="absolute -top-10 -right-10 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500"
        style={{ backgroundColor: color }}
      />
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-muted/30 group-hover:bg-muted/50 transition-colors relative">
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity blur-md" style={{ backgroundColor: color }} />
              <Icon size={20} style={{ color, filter: `drop-shadow(0 0 8px ${color}66)` }} />
            </div>
            <span className="text-muted-foreground text-sm font-medium tracking-wide group-hover:text-foreground transition-colors">
              {title}
            </span>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-black text-foreground tracking-tighter leading-none" style={{ textShadow: `0 0 20px ${color}33` }}>
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
  const { selectedProfile, isAdmin } = useProfileSelector();
  const [showFollowupDialog, setShowFollowupDialog] = useState(false);
  const [showSemResponsavelDialog, setShowSemResponsavelDialog] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState('all');
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data } = await supabase.from('leads').select('*');
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*');
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

  // Filter leads based on selected profile
  const profileFilteredLeads = isAdmin ? leads : leads.filter(l => l.assigned_to === selectedProfile.id);

  // Segment filter (admin only)
  const segmentedLeads = useMemo(() => {
    if (!isAdmin || segmentFilter === 'all') return profileFilteredLeads;
    if (segmentFilter === 'webinars') return profileFilteredLeads.filter(l => l.origem === 'webinar' && !isManualTag(l.webinar_date_tag));
    if (segmentFilter === 'manual') return profileFilteredLeads.filter(l => l.origem !== 'webinar' || isManualTag(l.webinar_date_tag));
    // specific webinar tag
    return profileFilteredLeads.filter(l => l.webinar_date_tag === segmentFilter);
  }, [profileFilteredLeads, segmentFilter, isAdmin]);

  const visibleLeads = segmentedLeads;
  const visibleLeadIds = new Set(visibleLeads.map(l => l.id));

  // Count from lead_actions history (acumulativo)
  const visibleActions = allActions.filter(a => a.lead_id && visibleLeadIds.has(a.lead_id));
  const countAction = (actionType: string) => new Set(visibleActions.filter(a => a.action_type === actionType).map(a => a.lead_id)).size;

  const leadsToday = visibleLeads.filter(l => l.created_at && isToday(parseISO(l.created_at))).length;
  const agendados = countAction('scheduled_meeting');
  const reunioes = countAction('meeting_done');
  const vendas = visibleLeads.filter(l => l.sale_status === 'won_call' || l.sale_status === 'won_followup').length;
  const followUpLeads = visibleLeads.filter(l => l.next_followup_date && new Date(l.next_followup_date) <= new Date());
  const followUpPendente = followUpLeads.length;
  const semResponsavelLeads = leads.filter(l => !l.assigned_to);
  const semResponsavel = semResponsavelLeads.length;

  const profileMap: Record<string, string> = {};
  profiles.forEach((p: any) => { if (p.id && p.full_name) profileMap[p.id] = p.full_name; });

  const metrics = [
    { label: 'Leads Hoje', value: leadsToday, icon: Users, color: '#db2777' },
    { label: 'Agendamentos', value: agendados, icon: Calendar, color: '#ef4444' },
    { label: 'Reuniões', value: reunioes, icon: Phone, color: '#3b82f6' },
    { label: 'Vendas', value: vendas, icon: TrendingUp, color: '#22c55e' },
    { label: 'Follow-up Pendente', value: followUpPendente, icon: AlertTriangle, color: '#eab308' },
    { label: 'Total Leads', value: visibleLeads.length, icon: CheckCircle2, color: '#9ca3af' },
  ];

  const teamMembers = TEAM_MEMBERS.filter(p => p.role !== 'ADMIN');

  // Usa os perfis REAIS do banco (IDs corretos) para exibir dados por vendedora
  const realTeamMembers = profiles.filter((p: any) => p.role !== 'ADMIN' && p.full_name);

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
    teamMembers.forEach(p => {
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
      const seller = TEAM_MEMBERS.find(m => m.id === l.assigned_to);
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
    <div className="space-y-8">
      {/* Neon Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm font-medium">
            {isAdmin ? 'Visão geral do time' : `Visão de ${selectedProfile.full_name}`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-muted-foreground" />
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="w-[220px] bg-card">
                  <SelectValue placeholder="Segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os leads</SelectItem>
                  <SelectItem value="webinars">Todos os Webinários</SelectItem>
                  {realWebinarTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                  <SelectItem value="manual">Leads Manuais</SelectItem>
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
              Exportar CSV
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
              <AlertTriangle className="w-4 h-4" /> {followUpPendente} follow-ups atrasados
            </button>
          )}
          {semResponsavel > 0 && (
            <button
              onClick={() => setShowSemResponsavelDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" /> {semResponsavel} leads sem responsável
            </button>
          )}
        </div>
      )}

      <AlertLeadsDialog
        title="Follow-ups Atrasados"
        leads={followUpLeads}
        profileMap={profileMap}
        open={showFollowupDialog}
        onOpenChange={setShowFollowupDialog}
        dateLabel="Follow-up"
        getDate={(l) => l.next_followup_date}
      />
      <AlertLeadsDialog
        title="Leads sem Responsável"
        leads={semResponsavelLeads}
        profileMap={profileMap}
        open={showSemResponsavelDialog}
        onOpenChange={setShowSemResponsavelDialog}
        dateLabel="Criação"
      />

      {/* Neon KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map(m => (
          <NeonKPICard key={m.label} title={m.label} value={m.value} icon={m.icon} color={m.color} />
        ))}
      </div>

      <SalesFunnelChart leads={isAdmin ? segmentedLeads : visibleLeads} actions={allActions} isAdmin={isAdmin} />

      {isAdmin && (
        <Card>
          <CardHeader><CardTitle>Vendas por Vendedora</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {realTeamMembers.map((p: any) => {
                const pWon = leads.filter(l => l.assigned_to === p.id && (l.sale_status === 'won_call' || l.sale_status === 'won_followup'));
                const bruto = pWon.reduce((s, l) => s + (Number(l.sale_value) || 0), 0);
                const cash = pWon.reduce((s, l) => s + (Number(l.cash_value) || 0), 0);
                return (
                  <Card key={p.id} className="border">
                    <CardContent className="p-4">
                      <p className="font-semibold mb-1">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground mb-3">{pWon.length} venda{pWon.length !== 1 ? 's' : ''}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bruto:</span>
                          <span className="font-bold tabular-nums">R$ {bruto.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cash-in:</span>
                          <span className="font-bold tabular-nums" style={{ color: 'hsl(160, 80%, 45%)' }}>R$ {cash.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vendas:</span>
                          <span className="font-bold tabular-nums">{pWon.length}</span>
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

      {isAdmin && realTeamMembers.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Equipe</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
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
                            <p>{pLeads.length} leads atribuídos</p>
                            <p>{pActions.length} ações hoje</p>
                            <p>{pLeads.filter(l => l.sale_status === 'won_call' || l.sale_status === 'won_followup').length} vendas</p>
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
                const pCountAction = (at: string) => new Set(pAllActions.filter(a => a.action_type === at).map(a => a.lead_id)).size;
                const pActions = todayActions.filter(a => a.user_id === p.id);
                return (
                  <TabsContent key={p.id} value={p.id} className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{pLeads.length}</p><p className="text-xs text-muted-foreground">Leads</p></CardContent></Card>
                      <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{pCountAction('scheduled_meeting')}</p><p className="text-xs text-muted-foreground">Agendados</p></CardContent></Card>
                      <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{pCountAction('meeting_done')}</p><p className="text-xs text-muted-foreground">Reuniões</p></CardContent></Card>
                      <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{pActions.length}</p><p className="text-xs text-muted-foreground">Ações Hoje</p></CardContent></Card>
                      <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{pLeads.filter(l => l.sale_status !== 'none' && l.sale_status !== null).length}</p><p className="text-xs text-muted-foreground">Vendas</p></CardContent></Card>
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
