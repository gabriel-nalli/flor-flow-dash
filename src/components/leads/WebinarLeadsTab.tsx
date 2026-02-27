import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileSelector, TEAM_MEMBERS } from '@/contexts/ProfileSelectorContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Instagram, DollarSign, Tag, Calendar as CalendarIcon2, MessageCircle, CheckCircle, AlertTriangle, MoreHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { WHATSAPP_TEMPLATE } from '@/lib/constants';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NeonInput, NeonStatusBadge, LeadAvatar, ChannelIcon, NeonTableWrapper, NeonPagination, NeonSelectWrapper } from './NeonLeadComponents';

interface WebinarLeadsTabProps {
  leads: any[];
  isLoading: boolean;
  allLeads?: any[];
  profileMap?: Record<string, string>;
}

export function WebinarLeadsTab({ leads, isLoading, allLeads = [], profileMap }: WebinarLeadsTabProps) {
  const { selectedProfile, isAdmin } = useProfileSelector();
  const queryClient = useQueryClient();

  const [nameFilter, setNameFilter] = useState('');
  const [instaFilter, setInstaFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [tagFilter, setTagFilter] = useState('all');
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [mqlOnly, setMqlOnly] = useState(false);
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const resolvedProfileMap = profileMap || Object.fromEntries(TEAM_MEMBERS.map(p => [p.id, p.full_name]));
  const uniqueTags = Array.from(new Set(allLeads.map(l => l.webinar_date_tag).filter(Boolean))).sort().reverse();

  const parseFaturamento = (fat: string | null | undefined): string => {
    if (!fat) return '';
    const lower = fat.toLowerCase();
    if (lower.includes('1.000') && lower.includes('2.000')) return '1k-2k';
    if (lower.includes('3.000') && lower.includes('6.000')) return '3k-6k';
    if (lower.includes('6.000') && lower.includes('10.000')) return '6k-10k';
    if (lower.includes('12.000') || lower.includes('acima')) return '12k+';
    // fallback: try numeric
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

  const filtered = leads.filter(lead => {
    if (nameFilter && !lead.nome?.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (instaFilter && !lead.instagram?.toLowerCase().includes(instaFilter.toLowerCase())) return false;
    if (tagFilter !== 'all' && lead.webinar_date_tag !== tagFilter) return false;
    if (mqlOnly && !isMql(lead.faturamento)) return false;
    if (revenueFilter !== 'all' && parseFaturamento(lead.faturamento) !== revenueFilter) return false;
    if (dateFilter && lead.created_at) {
      const leadDate = parseISO(lead.created_at).toDateString();
      if (leadDate !== dateFilter.toDateString()) return false;
    }
    return true;
  });

  const handleCollect = async (lead: any) => {
    setCollectingId(lead.id);
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ assigned_to: selectedProfile.id, last_action_at: new Date().toISOString() } as any)
        .eq('id', lead.id)
        .is('assigned_to', null)
        .select();
      if (error) throw error;
      if (data && data.length > 0) {
        await supabase.from('lead_actions').insert([{ lead_id: lead.id, action_type: 'lead_collected', action_metadata: {} as any }]);
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        toast.success('Lead coletado com sucesso! ✅');
      } else {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        toast.error('Lead já foi coletado por outra vendedora!');
      }
    } catch {
      toast.error('Erro ao coletar lead. Tente novamente.');
    } finally {
      setCollectingId(null);
    }
  };

  const handleWhatsApp = async (lead: any) => {
    const msg = WHATSAPP_TEMPLATE.replace('{NOME_DA_VENDEDORA}', selectedProfile.full_name);
    const phone = lead.whatsapp?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const clearFilters = () => {
    setNameFilter(''); setInstaFilter('');
    setDateFilter(undefined); setTagFilter('all'); setMqlOnly(false); setRevenueFilter('all');
  };

  const hasFilters = nameFilter || instaFilter || dateFilter || tagFilter !== 'all' || mqlOnly || revenueFilter !== 'all';

  return (
    <div>
      <div className="px-6 py-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <NeonInput icon={Search} placeholder="Buscar nome..." value={nameFilter} onChange={e => setNameFilter(e.target.value)} />
          <NeonInput icon={Instagram} placeholder="@usuario" value={instaFilter} onChange={e => setInstaFilter(e.target.value)} />
          <NeonSelectWrapper>
            <Select value={revenueFilter} onValueChange={setRevenueFilter}>
              <SelectTrigger className="h-10">
                <DollarSign size={14} className="mr-2 text-muted-foreground" />
                <SelectValue placeholder="Faturamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="1k-2k">R$ 1k — 2k</SelectItem>
                <SelectItem value="3k-6k">R$ 3k — 6k</SelectItem>
                <SelectItem value="6k-10k">R$ 6k — 10k</SelectItem>
                <SelectItem value="12k+">R$ 12k+ (HIGH)</SelectItem>
              </SelectContent>
            </Select>
          </NeonSelectWrapper>
          <NeonSelectWrapper>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="h-10">
                <Tag size={14} className="mr-2 text-muted-foreground" />
                <SelectValue placeholder="Webinário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueTags.map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
              </SelectContent>
            </Select>
          </NeonSelectWrapper>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 bg-secondary rounded-xl px-3 h-10 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <CalendarIcon2 size={14} />
                {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Data"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMqlOnly(!mqlOnly)}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${mqlOnly ? 'bg-primary border-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]' : 'border-muted-foreground/30 bg-muted/50'}`}>
              {mqlOnly && <CheckCircle size={10} className="text-primary-foreground" />}
            </div>
            Somente MQL
          </label>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X size={12} /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {filtered.some(l => l.status === 'novo') && (
        <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          {filtered.filter(l => l.status === 'novo').length} leads novos aguardando coleta
        </div>
      )}

      <NeonTableWrapper>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Nome</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Insta</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Faturamento</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Tag</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Data</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Status</th>
              <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-16 text-muted-foreground">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16 text-muted-foreground">Nenhum lead disponível</td></tr>
            ) : filtered.map(lead => (
              <React.Fragment key={lead.id}>
                <tr className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <LeadAvatar name={lead.nome} />
                      <span className="font-medium text-foreground text-sm">{lead.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      {lead.instagram && (
                        <a
                          href={`https://instagram.com/${lead.instagram.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="p-2 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#833AB4] hover:opacity-80 transition-opacity cursor-pointer">
                            <Instagram size={14} className="text-white" />
                          </div>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground font-medium">
                    {lead.faturamento ? (isNaN(Number(lead.faturamento)) ? lead.faturamento : `R$ ${Number(lead.faturamento).toLocaleString('pt-BR')}`) : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                      {lead.webinar_date_tag
                        ? /^\d{4}-\d{2}-\d{2}$/.test(lead.webinar_date_tag)
                          ? <><span className="capitalize">{lead.origem || 'webinar'}</span><span className="opacity-40">·</span><span>{format(parseISO(lead.webinar_date_tag), 'dd/MM')}</span></>
                          : <span>{lead.webinar_date_tag}</span>
                        : <span className="capitalize">{lead.origem || 'webinar'}</span>
                      }
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {lead.created_at ? format(parseISO(lead.created_at), "dd MMM", { locale: ptBR }) : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <NeonStatusBadge status={lead.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                        className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        title="Mais informações"
                      >
                        {expandedId === lead.id ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                      </button>
                      {lead.whatsapp && (
                        <button onClick={() => handleWhatsApp(lead)} className="p-2 rounded-lg hover:bg-muted/50 transition-colors" title="Enviar WhatsApp">
                          <MessageCircle size={16} className="text-muted-foreground hover:text-green-500" />
                        </button>
                      )}
                      {!lead.assigned_to && (
                        <Button
                          size="sm"
                          onClick={() => handleCollect(lead)}
                          disabled={collectingId === lead.id}
                          className="gap-1 rounded-lg text-xs"
                        >
                          <CheckCircle size={14} />
                          {collectingId === lead.id ? 'Coletando...' : 'Coletar'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === lead.id && (
                  <tr className="bg-muted/20">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">Profissão</span>
                          <span className="text-foreground">{lead.profissao || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">Maior Dificuldade</span>
                          <span className="text-foreground">{lead.maior_dificuldade || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">Renda Familiar</span>
                          <span className="text-foreground">{lead.renda_familiar || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">Quem Investe</span>
                          <span className="text-foreground">{lead.quem_investe || '—'}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <NeonPagination showing={filtered.length} total={leads.length} />
      </NeonTableWrapper>
    </div>
  );
}
