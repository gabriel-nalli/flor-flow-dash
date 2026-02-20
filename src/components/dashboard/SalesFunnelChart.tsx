import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface FunnelChartProps {
  leads: any[];
  actions: any[];
  isAdmin: boolean;
}

function NeonFunnelBar({ label, subLabel, value, max, color }: { label: string; subLabel?: string; value: number; max: number; color: string }) {
  const percentage = Math.min(max > 0 ? (value / max) * 100 : 0, 100);

  return (
    <div className="group relative mb-6 last:mb-0">
      <div className="flex justify-between items-end mb-2">
        <span className="text-muted-foreground font-medium text-sm tracking-wide group-hover:text-foreground transition-colors">
          {label}
        </span>
        <div className="flex flex-col items-end">
          <span className="text-foreground font-bold text-lg leading-none" style={{ textShadow: `0 0 10px ${color}` }}>
            {value}
          </span>
          {subLabel && (
            <span className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-wider">
              {subLabel}
            </span>
          )}
        </div>
      </div>
      <div className="h-4 bg-muted/30 rounded-full overflow-visible relative flex items-center px-0.5 shadow-inner">
        <div
          className="h-2.5 rounded-full relative transition-all duration-1000 ease-out group-hover:h-3"
          style={{
            width: `${Math.max(percentage, 2)}%`,
            background: `linear-gradient(90deg, ${color}40 0%, ${color} 100%)`,
            boxShadow: `0 0 15px ${color}66, 0 0 5px ${color}`,
          }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-full bg-foreground/80 blur-[1px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

function NeonStatCard({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <div className="bg-card p-4 rounded-xl hover:bg-muted/50 transition-colors group">
      <p
        className="text-3xl font-black text-foreground mb-1 tracking-tighter transition-all group-hover:scale-105 origin-left"
        style={{ textShadow: '0 0 20px rgba(220, 38, 38, 0.4)' }}
      >
        {value}
      </p>
      <p className="text-destructive text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
      {subtext && <p className="text-muted-foreground/50 text-[10px]">{subtext}</p>}
    </div>
  );
}

export function SalesFunnelChart({ leads, actions, isAdmin }: FunnelChartProps) {
  const [selectedSeller, setSelectedSeller] = useState('all');

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, role');
      return data || [];
    },
    enabled: isAdmin,
  });

  const sellers = allProfiles.filter((p: any) =>
    p.role !== 'ADMIN' &&
    p.full_name &&
    !p.id.startsWith('00000000') &&
    !p.full_name.toLowerCase().includes('test')
  );

  const stats = useMemo(() => {
    const filteredLeads = selectedSeller === 'all'
      ? leads.filter(l => !!l.assigned_to)
      : leads.filter(l => l.assigned_to === selectedSeller);

    const leadIds = new Set(filteredLeads.map(l => l.id));
    const filteredActions = actions.filter(a => a.lead_id && leadIds.has(a.lead_id));

    const countUniqueLeads = (actionType: string) =>
      new Set(filteredActions.filter(a => a.action_type === actionType).map(a => a.lead_id)).size;

    const coletados = filteredLeads.length;
    const whatsappEnviado = countUniqueLeads('whatsapp_sent');
    const agendamentos = countUniqueLeads('scheduled_meeting');
    const noShows = countUniqueLeads('no_show_marked');
    const reunioes = countUniqueLeads('meeting_done');
    const followUps = countUniqueLeads('followup_done');
    const vendasCall = countUniqueLeads('sale_won_call');
    const vendasFollowup = countUniqueLeads('sale_won_followup');

    return { coletados, whatsappEnviado, agendamentos, noShows, reunioes, followUps, vendasCall, vendasFollowup };
  }, [leads, actions, selectedSeller]);

  const pct = (n: number, d: number) => d > 0 ? ((n / d) * 100).toFixed(1) : '0.0';
  const maxVal = Math.max(stats.coletados, 1);
  const totalVendas = stats.vendasCall + stats.vendasFollowup;

  const conversionCards = [
    { label: 'WhatsApp Enviado', value: `${pct(stats.whatsappEnviado, stats.coletados)}%` },
    { label: 'Agendamentos', value: `${pct(stats.agendamentos, stats.coletados)}%` },
    { label: 'Reuniões Realiz.', value: `${pct(stats.reunioes, stats.agendamentos)}%` },
    { label: 'No-show', value: `${pct(stats.noShows, stats.agendamentos)}%`, subtext: 'Negativo' },
    { label: 'Follow-up', value: `${pct(stats.followUps, stats.reunioes)}%` },
    { label: 'Vendas na Call', value: `${pct(stats.vendasCall, stats.reunioes)}%` },
    { label: 'Vendas no Follow-up', value: `${pct(stats.vendasFollowup, stats.followUps)}%` },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end pb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Funil Comercial</h2>
          <p className="text-muted-foreground text-xs uppercase tracking-widest">Visão Geral do Time</p>
        </div>
        {isAdmin && (
          <Select value={selectedSeller} onValueChange={setSelectedSeller}>
            <SelectTrigger className="w-[200px] bg-card">
              <SelectValue placeholder="Filtrar vendedora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as vendedoras</SelectItem>
              {sellers.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: Funnel Bars */}
        <div className="lg:col-span-2 bg-card p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-destructive/5 blur-[100px] pointer-events-none" />

          <div className="relative z-10 space-y-8">
            {/* Top of Funnel */}
            <div className="space-y-1">
              <NeonFunnelBar label="Leads Coletados" value={stats.coletados} max={maxVal} color="#ef4444" />
              <NeonFunnelBar label="WhatsApp Enviado" subLabel={`${pct(stats.whatsappEnviado, stats.coletados)}% de Coletados`} value={stats.whatsappEnviado} max={maxVal} color="#dc2626" />
              <NeonFunnelBar label="Agendamentos" subLabel={`${pct(stats.agendamentos, stats.coletados)}% de Coletados`} value={stats.agendamentos} max={maxVal} color="#b91c1c" />
            </div>

            <div className="h-px bg-border/30 mx-4" />

            {/* Middle of Funnel */}
            <div className="space-y-1">
              <NeonFunnelBar label="Reuniões Realizadas" subLabel={`${pct(stats.reunioes, stats.agendamentos)}% de Agendamentos`} value={stats.reunioes} max={maxVal} color="#ef4444" />
              <NeonFunnelBar label="No-show" subLabel={`${pct(stats.noShows, stats.agendamentos)}% de Agendamentos`} value={stats.noShows} max={maxVal} color="#7f1d1d" />
              <NeonFunnelBar label="Follow-up" subLabel={`${pct(stats.followUps, stats.reunioes)}% de Reuniões`} value={stats.followUps} max={maxVal} color="#991b1b" />
            </div>

            <div className="h-px bg-border/30 mx-4" />

            {/* Bottom of Funnel */}
            <div className="space-y-1">
              <NeonFunnelBar label="Vendas na Call" subLabel={`${pct(stats.vendasCall, stats.reunioes)}% de Reuniões`} value={stats.vendasCall} max={maxVal} color="#22c55e" />
              <NeonFunnelBar label="Vendas no Follow-up" subLabel={`${pct(stats.vendasFollowup, stats.followUps)}% de Follow-ups`} value={stats.vendasFollowup} max={maxVal} color="#22c55e" />
            </div>
          </div>
        </div>

        {/* Side Column: Conversion Rates */}
        <div className="space-y-6">
          <div>
            <h3 className="text-foreground font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-destructive rounded-full shadow-[0_0_10px_hsl(var(--destructive))]" />
              Taxas de Conversão
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {conversionCards.map(c => (
                <NeonStatCard key={c.label} label={c.label} value={c.value} subtext={c.subtext} />
              ))}
            </div>
          </div>

          {/* Total Sales Card */}
          <div className="bg-gradient-to-br from-destructive/20 to-background p-6 rounded-2xl relative overflow-hidden group">
            <p className="text-muted-foreground text-xs uppercase font-bold tracking-widest mb-2 relative z-10">Total de Vendas</p>
            <p className="text-5xl font-black text-foreground relative z-10 drop-shadow-xl group-hover:scale-105 transition-transform origin-left">
              {totalVendas}
            </p>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-destructive blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  );
}
