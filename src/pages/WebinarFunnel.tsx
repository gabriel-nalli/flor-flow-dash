import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Save, Users, Target, TrendingUp, CheckCircle, Percent, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function WebinarFunnel() {
  const queryClient = useQueryClient();
  const [selectedTag, setSelectedTag] = useState('all');
  const [attendeesInput, setAttendeesInput] = useState('');
  const [pitchInput, setPitchInput] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: allLeads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['webinar_metrics'],
    queryFn: async () => {
      const { data } = await supabase.from('webinar_metrics').select('*');
      return data || [];
    },
  });

  // Tags ISO (YYYY-MM-DD) = leads adicionados manualmente — não entram no funil
  const isManualTag = (tag: string | null | undefined) =>
    !!tag && /^\d{4}-\d{2}-\d{2}$/.test(tag);

  const uniqueTags = useMemo(() =>
    Array.from(new Set(
      allLeads
        .filter(l => l.webinar_date_tag && !isManualTag(l.webinar_date_tag))
        .map(l => l.webinar_date_tag)
        .filter(Boolean)
    )).sort().reverse(),
    [allLeads]
  );

  const webinarLeads = useMemo(() =>
    allLeads.filter(l =>
      l.origem === 'webinar' &&
      !isManualTag(l.webinar_date_tag) &&
      (selectedTag === 'all' || l.webinar_date_tag === selectedTag)
    ),
    [allLeads, selectedTag]
  );

  const currentMetrics = useMemo(() => {
    if (selectedTag === 'all') {
      const totals = { attendees: 0, stayed_until_pitch: 0 };
      metrics.forEach(m => {
        totals.attendees += m.attendees || 0;
        totals.stayed_until_pitch += m.stayed_until_pitch || 0;
      });
      return totals;
    }
    return metrics.find(m => m.webinar_tag === selectedTag) || { attendees: 0, stayed_until_pitch: 0 };
  }, [metrics, selectedTag]);

  const parseFaturamento = (fat: string | null | undefined): string => {
    if (!fat) return '';
    const lower = fat.toLowerCase();
    if (lower.includes('1.000') && lower.includes('2.000')) return '1k-2k';
    if (lower.includes('3.000') && lower.includes('6.000')) return '3k-6k';
    if (lower.includes('6.000') && lower.includes('10.000')) return '6k-10k';
    if (lower.includes('12.000') || lower.includes('acima')) return '12k+';
    const num = Number(fat.replace(/[^\d]/g, ''));
    if (!isNaN(num) && num > 0) {
      if (num >= 12000) return '12k+';
      if (num >= 6000) return '6k-10k';
      if (num >= 3000) return '3k-6k';
      if (num >= 1000) return '1k-2k';
    }
    return '';
  };

  const isMql = (fat: string | null | undefined): boolean => {
    const bucket = parseFaturamento(fat);
    return bucket === '3k-6k' || bucket === '6k-10k' || bucket === '12k+';
  };

  // MQL = faturamento >= 3000
  const mqlLeads = webinarLeads.filter(l => isMql(l.faturamento));
  const nonMqlLeads = webinarLeads.filter(l => !isMql(l.faturamento));
  const totalFormularios = webinarLeads.length;
  const mqlCount = mqlLeads.length;
  const mqlPercent = totalFormularios > 0 ? ((mqlCount / totalFormularios) * 100).toFixed(1) : '0';
  const attendees = currentMetrics?.attendees || 0;
  const stayedPitch = currentMetrics?.stayed_until_pitch || 0;
  const pitchRetention = attendees > 0 ? ((stayedPitch / attendees) * 100).toFixed(1) : '0';
  const formConversion = attendees > 0 ? ((totalFormularios / attendees) * 100).toFixed(1) : '0';

  // Leads by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    webinarLeads.forEach(l => {
      const s = l.status || 'novo';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [webinarLeads]);

  const funnelData = [
    { name: 'Entraram', value: attendees, fill: 'hsl(200, 80%, 55%)' },
    { name: 'Até o Pitch', value: stayedPitch, fill: 'hsl(280, 70%, 60%)' },
    { name: 'Formulários', value: totalFormularios, fill: 'hsl(345, 65%, 47%)' },
    { name: 'MQL (≥3k)', value: mqlCount, fill: 'hsl(142, 60%, 45%)' },
  ];

  const mqlPieData = [
    { name: 'MQL (≥3k)', value: mqlCount },
    { name: 'Não MQL (<3k)', value: nonMqlLeads.length },
  ];

  const NEON_RED = 'hsl(345, 100%, 55%)';
  const NEON_GRAY = 'hsl(220, 10%, 55%)';
  const NEON_PINK = 'hsl(345, 80%, 55%)';
  const PIE_COLORS = [NEON_RED, NEON_GRAY];

  const handleSaveMetrics = async () => {
    if (selectedTag === 'all') {
      toast.error('Selecione um webinário específico');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        webinar_tag: selectedTag,
        attendees: Number(attendeesInput) || 0,
        stayed_until_pitch: Number(pitchInput) || 0,
      };
      const { error } = await supabase
        .from('webinar_metrics')
        .upsert(payload, { onConflict: 'webinar_tag' });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['webinar_metrics'] });
      toast.success('Métricas salvas! ✅');
    } catch {
      toast.error('Erro ao salvar métricas');
    } finally {
      setSaving(false);
    }
  };

  // When tag changes, load existing metrics into inputs
  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    const m = metrics.find(x => x.webinar_tag === tag);
    setAttendeesInput(m?.attendees?.toString() || '');
    setPitchInput(m?.stayed_until_pitch?.toString() || '');
  };

  const escapeCsv = (val: string | number | null | undefined) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const buildCsvRows = (leads: typeof allLeads, tag: string, met: typeof currentMetrics) => {
    const mql = leads.filter(l => isMql(l.faturamento));
    const total = leads.length;
    const mqlC = mql.length;
    const att = met?.attendees || 0;
    const pitch = met?.stayed_until_pitch || 0;
    const rows: string[] = [];
    rows.push(`Webinário: ${tag}`);
    rows.push(`Entraram,${att}`);
    rows.push(`Até o Pitch,${pitch}`);
    rows.push(`Retenção Pitch,${att > 0 ? ((pitch / att) * 100).toFixed(1) + '%' : '0%'}`);
    rows.push(`Formulários,${total}`);
    rows.push(`Conv. Formulário,${att > 0 ? ((total / att) * 100).toFixed(1) + '%' : '0%'}`);
    rows.push(`MQL (≥3k),${mqlC} (${total > 0 ? ((mqlC / total) * 100).toFixed(1) : '0'}%)`);
    rows.push('');
    rows.push('Nome,WhatsApp,Instagram,Email,Faturamento,Status,Tag,Responsável');
    leads.forEach(l => {
      rows.push([
        escapeCsv(l.nome), escapeCsv(l.whatsapp), escapeCsv(l.instagram), escapeCsv(l.email),
        l.faturamento ?? 0, l.status || 'novo', escapeCsv(l.webinar_date_tag),
        l.assigned_to ? 'Coletado' : 'Pendente',
      ].join(','));
    });
    return rows;
  };

  const downloadCsv = (content: string, filename: string) => {
    const bom = '\uFEFF';
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCurrent = () => {
    const label = selectedTag === 'all' ? 'Todos' : selectedTag;
    const rows = buildCsvRows(webinarLeads, label, currentMetrics);
    downloadCsv(rows.join('\n'), `funil-webinar-${label}.csv`);
    toast.success('CSV exportado! 📥');
  };

  const handleExportByDate = () => {
    const allRows: string[] = [];
    // Total first
    const allWebinar = allLeads.filter(l => l.origem === 'webinar');
    const totalMet = { attendees: 0, stayed_until_pitch: 0 };
    metrics.forEach(m => { totalMet.attendees += m.attendees || 0; totalMet.stayed_until_pitch += m.stayed_until_pitch || 0; });
    allRows.push(...buildCsvRows(allWebinar, 'TOTAL', totalMet));
    allRows.push('', '---', '');
    // Each tag
    uniqueTags.forEach(tag => {
      const tagLeads = allLeads.filter(l => l.origem === 'webinar' && l.webinar_date_tag === tag);
      const tagMet = metrics.find(m => m.webinar_tag === tag) || { attendees: 0, stayed_until_pitch: 0 };
      allRows.push(...buildCsvRows(tagLeads, tag!, tagMet));
      allRows.push('', '---', '');
    });
    downloadCsv(allRows.join('\n'), 'funil-webinar-completo.csv');
    toast.success('CSV completo exportado! 📥');
  };

  const neonShadow = `0 0 10px ${NEON_RED}, 0 0 20px ${NEON_RED}4d`;
  const neonPinkShadow = '0 0 10px hsl(345, 80%, 55%), 0 0 20px hsl(345, 80%, 55% / 0.3)';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Funil Webinário</h1>
        <div className="flex items-center gap-2">
          <Select value={selectedTag} onValueChange={handleTagChange}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Selecione o webinário" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os webinários</SelectItem>
              {uniqueTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCurrent}>
                📄 {selectedTag === 'all' ? 'Todos (visão atual)' : `Apenas ${selectedTag}`}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportByDate}>
                📊 Completo (separado por data)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Manual metrics input */}
      {selectedTag !== 'all' && (
        <Card className="border-none" style={{ boxShadow: neonPinkShadow }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Save className="w-5 h-5 text-primary" />
              Preencher Métricas — {selectedTag}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Entraram na Reunião</label>
                <Input
                  type="number"
                  placeholder="Ex: 150"
                  value={attendeesInput}
                  onChange={e => setAttendeesInput(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Ficaram até o Pitch</label>
                <Input
                  type="number"
                  placeholder="Ex: 80"
                  value={pitchInput}
                  onChange={e => setPitchInput(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Formulários (auto)</label>
                <div className="h-9 px-3 flex items-center rounded-md bg-muted/30 text-sm font-medium" style={{ color: NEON_RED, textShadow: neonShadow }}>
                  {totalFormularios}
                </div>
              </div>
              <Button onClick={handleSaveMetrics} disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Entraram', value: attendees, icon: Users, color: 'hsl(200, 80%, 55%)' },
          { label: 'Até Pitch', value: stayedPitch, icon: Target, color: 'hsl(280, 70%, 60%)' },
          { label: 'Retenção Pitch', value: `${pitchRetention}%`, icon: Percent, color: 'hsl(38, 92%, 50%)' },
          { label: 'Formulários', value: totalFormularios, icon: CheckCircle, color: NEON_PINK },
          { label: 'Conv. Form', value: `${formConversion}%`, icon: TrendingUp, color: 'hsl(200, 80%, 55%)' },
          { label: 'MQL (≥3k)', value: `${mqlCount} (${mqlPercent}%)`, icon: TrendingUp, color: NEON_RED },
        ].map((kpi, i) => (
          <Card key={i} className="relative overflow-hidden border-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color, filter: `drop-shadow(0 0 4px ${kpi.color})` }} />
                <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: kpi.color, textShadow: `0 0 8px ${kpi.color}40` }}>
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel bar chart - Neon style */}
        <Card className="border-none">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Funil de Conversão</CardTitle>
              <div className="flex gap-2 items-center">
                <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></div>
                <span className="text-xs text-cyan-500 font-mono uppercase">Live Data</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5 relative">
              {[
                { label: 'Entraram', value: attendees, color: 'from-cyan-400 to-blue-600', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]', text: 'text-cyan-300' },
                { label: 'Até o Pitch', value: stayedPitch, color: 'from-purple-400 to-fuchsia-600', glow: 'shadow-[0_0_20px_rgba(232,121,249,0.4)]', text: 'text-fuchsia-300' },
                { label: 'Formulários', value: totalFormularios, color: 'from-rose-400 to-red-600', glow: 'shadow-[0_0_20px_rgba(251,113,133,0.4)]', text: 'text-rose-300' },
                { label: 'MQL (≥3k)', value: mqlCount, color: 'from-amber-300 to-orange-500', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.4)]', text: 'text-amber-300' },
              ].map((item, index) => {
                const maxVal = Math.max(attendees, 1);
                return (
                  <div key={index} className="relative group">
                    <div className="flex items-center gap-4">
                      <div className="w-28 text-right">
                        <span className="text-muted-foreground text-sm font-medium group-hover:text-foreground transition-colors">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex-1 h-10 bg-muted/30 rounded-lg overflow-visible relative flex items-center px-1">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${item.color} ${item.glow} transition-all duration-1000 ease-out group-hover:h-4`}
                          style={{ width: `${Math.max((item.value / maxVal) * 100, 2)}%` }}
                        />
                      </div>
                      <div className="w-14 text-right font-mono">
                        <span className={`text-xl font-bold ${item.text} drop-shadow-md`}>
                          {item.value}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* MQL Neon Donut */}
        <Card className="border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/10 blur-[80px] pointer-events-none"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">MQL vs Não-MQL</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const mqlPct = totalFormularios > 0 ? Math.round((mqlCount / totalFormularios) * 100) : 0;
              const nonMqlPct = 100 - mqlPct;
              const radius = 80;
              const stroke = 20;
              const normalizedRadius = radius - stroke / 2;
              const circumference = normalizedRadius * 2 * Math.PI;
              const strokeDashoffset = circumference - (mqlPct / 100) * circumference;

              return (
                <div className="flex items-center justify-center gap-8 md:gap-16 relative z-10 py-4">
                  <div className="text-right hidden md:block">
                    <span className="text-muted-foreground font-medium text-sm block">Não MQL</span>
                    <span className="text-2xl font-bold text-muted-foreground">{nonMqlPct}%</span>
                  </div>

                  <div className="relative">
                    <svg height={radius * 2} width={radius * 2} className="transform -rotate-90 overflow-visible">
                      <defs>
                        <filter id="red-glow-donut" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <circle stroke="hsl(240, 4%, 16%)" strokeWidth={stroke} fill="transparent" r={normalizedRadius} cx={radius} cy={radius} />
                      <circle
                        stroke="hsl(0, 72%, 51%)"
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{
                          strokeDashoffset,
                          transition: 'stroke-dashoffset 1s ease-out',
                          strokeLinecap: 'butt',
                          filter: 'url(#red-glow-donut)',
                        }}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                      />
                    </svg>
                  </div>

                  <div className="text-left hidden md:block">
                    <span className="text-red-500 font-bold text-sm block" style={{ textShadow: '0 0 10px rgba(220, 38, 38, 0.4)' }}>MQL</span>
                    <span className="text-2xl font-bold text-foreground drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]">{mqlPct}%</span>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-center gap-8 mt-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
                <span className="text-red-400 text-sm font-medium">MQL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted"></div>
                <span className="text-muted-foreground text-sm font-medium">Não MQL</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MQL Table */}
      <Card className="border-none" style={{ boxShadow: `0 0 15px ${NEON_RED}1a` }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: NEON_RED, filter: `drop-shadow(0 0 4px ${NEON_RED})` }} />
            Leads MQL (Faturamento ≥ R$ 3.000)
            <Badge className="ml-2" style={{ background: NEON_RED, color: '#ffffff', borderColor: `${NEON_RED}` }}>
              {mqlCount} leads
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>Faturamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mqlLeads.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum lead MQL encontrado</TableCell></TableRow>
              ) : mqlLeads.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.nome}</TableCell>
                  <TableCell className="text-sm">{lead.whatsapp || '—'}</TableCell>
                  <TableCell className="text-sm">{lead.instagram || '—'}</TableCell>
                  <TableCell className="text-sm font-medium" style={{ color: NEON_RED, textShadow: `0 0 4px ${NEON_RED}40` }}>
                    {lead.faturamento || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline">{lead.webinar_date_tag || '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{lead.assigned_to ? '✅ Coletado' : '⏳ Pendente'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Status distribution */}
      <Card className="border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="rounded-lg p-3 text-center bg-muted/20">
                <p className="text-xl font-bold" style={{ color: NEON_RED, textShadow: `0 0 6px ${NEON_RED}40` }}>{count}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{status.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
