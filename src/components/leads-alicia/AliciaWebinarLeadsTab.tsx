import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Phone, Search, X, Instagram, ExternalLink, Calendar as CalendarIcon2, DollarSign, Tag, MessageCircle, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NeonInput, NeonStatusBadge, LeadAvatar, NeonTableWrapper, NeonPagination, NeonSelectWrapper } from '../leads/NeonLeadComponents';
import { useLanguage } from '@/contexts/LanguageContext';
import { WHATSAPP_TEMPLATE_ALICIA } from '@/lib/constants';

interface AliciaWebinarLeadsTabProps {
  leads: any[];
  isLoading: boolean;
  allLeads?: any[];
  profileMap?: Record<string, string>;
}

export function AliciaWebinarLeadsTab({ leads, isLoading, allLeads = [], profileMap }: AliciaWebinarLeadsTabProps) {
  const { selectedProfile, isAdmin, teamMembers } = useProfileSelector();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [nameFilter, setNameFilter] = useState('');
  const [instaFilter, setInstaFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [tagFilter, setTagFilter] = useState('all');
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [eventFilter, setEventFilter] = useState('all');
  const resolvedProfileMap = profileMap || Object.fromEntries(teamMembers.map(p => [p.id, p.full_name]));
  const uniqueTags = Array.from(new Set(allLeads.map(l => l.source_tag).filter(Boolean))).sort().reverse();
  const uniqueEvents = Array.from(new Set(allLeads.map(l => l.webinar_date_tag).filter(Boolean))).sort().reverse();

  const filtered = leads.filter(lead => {
    if (nameFilter && !lead.nombre?.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (instaFilter && !lead.instagram?.toLowerCase().includes(instaFilter.toLowerCase())) return false;
    if (tagFilter !== 'all' && lead.source_tag !== tagFilter) return false;
    if (eventFilter !== 'all' && lead.webinar_date_tag !== eventFilter) return false;
    if (dateFilter && lead.created_at) {
      const leadDate = parseISO(lead.created_at).toDateString();
      if (leadDate !== dateFilter.toDateString()) return false;
    }
    return true;
  });

  const handleDelete = async (lead: any) => {
    if (!window.confirm(`Tem certeza que deseja apagar o lead "${lead.nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('leads_alicia')
        .delete()
        .eq('id', lead.id);

      if (error) throw error;

      toast.success('Lead apagado com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['leads_alicia'] });
    } catch (error) {
      console.error('Erro ao apagar lead:', error);
      toast.error('Erro ao apagar lead. Tente novamente.');
    }
  };

  const handleCollect = async (lead: any) => {
    setCollectingId(lead.id);
    try {
      const { data, error } = await supabase
        .from('leads_alicia' as any)
        .update({ assigned_to: selectedProfile.id, last_action_at: new Date().toISOString() } as any)
        .eq('id', lead.id)
        .is('assigned_to', null)
        .select();
      if (error) throw error;
      if (data && data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['leads_alicia'] });
        toast.success('Lead coletado com sucesso! ✅');
      } else {
        queryClient.invalidateQueries({ queryKey: ['leads_alicia'] });
        toast.error('Lead já foi coletado por outra vendedora!');
      }
    } catch {
      toast.error('Erro ao coletar lead. Tente novamente.');
    } finally {
      setCollectingId(null);
    }
  };

  const handleWhatsApp = async (lead: any) => {
    const msg = WHATSAPP_TEMPLATE_ALICIA.replace('{NOME_DA_VENDEDORA}', selectedProfile.full_name);
    const phone = lead.whatsapp?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const clearFilters = () => {
    setNameFilter(''); setInstaFilter('');
    setDateFilter(undefined); setTagFilter('all'); setEventFilter('all');
  };

  const hasFilters = nameFilter || instaFilter || dateFilter || tagFilter !== 'all' || eventFilter !== 'all';

  return (
    <div>
      <div className="px-4 md:px-6 py-4 md:py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 mb-4">
          <NeonInput icon={Search} placeholder={t('Buscar nome...')} value={nameFilter} onChange={e => setNameFilter(e.target.value)} />
          <NeonInput icon={Instagram} placeholder={t('@usuario')} value={instaFilter} onChange={e => setInstaFilter(e.target.value)} />
          <NeonSelectWrapper>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="h-10">
                <Tag size={14} className="mr-2 text-muted-foreground" />
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                {uniqueTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </NeonSelectWrapper>
          <NeonSelectWrapper>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="h-10">
                <CalendarIcon2 size={14} className="mr-2 text-muted-foreground" />
                <SelectValue placeholder="Evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                {uniqueEvents.map(event => {
                  const isIso = /^\d{4}-\d{2}-\d{2}$/.test(event);
                  const label = isIso ? `${event.slice(8, 10)}/${event.slice(5, 7)}/${event.slice(0, 4)}` : event;
                  return <SelectItem key={event} value={event}>{label}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </NeonSelectWrapper>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 bg-secondary rounded-xl px-3 h-10 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <CalendarIcon2 size={14} />
                {dateFilter ? format(dateFilter, "dd/MM/yyyy") : t('Data')}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
            </PopoverContent>
          </Popover>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 h-10">
              <X size={12} /> {t('Limpar filtros')}
            </button>
          )}
        </div>
      </div>

      {filtered.some(l => l.status === 'novo') && (
        <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          {filtered.filter(l => l.status === 'novo').length} {t('leads novos aguardando coleta')}
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden px-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">{t('Carregando...')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{t('Nenhum lead disponível')}</div>
        ) : filtered.map(lead => (
          <div key={lead.id} className="bg-secondary/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <LeadAvatar name={lead.nombre} />
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{lead.nombre}</p>
                  {lead.instagram && (
                    <a href={`https://instagram.com/${lead.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground">
                      @{lead.instagram.replace(/^@/, '')}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {lead.whatsapp && (
                  <button onClick={() => handleWhatsApp(lead)} className="p-2 rounded-lg hover:bg-muted/50">
                    <MessageCircle size={18} className="text-green-500" />
                  </button>
                )}
                {!lead.assigned_to && (
                  <Button size="sm" onClick={() => handleCollect(lead)} disabled={collectingId === lead.id} className="gap-1 rounded-lg text-xs h-8">
                    <CheckCircle size={14} />
                    {collectingId === lead.id ? '...' : t('Coletar')}
                  </Button>
                )}
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(lead)} 
                    className="p-2 rounded-xl hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={18} className="text-destructive/70 hover:text-destructive" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NeonStatusBadge status={lead.status} />
              {lead.facturacion_mensual && (
                <span className="text-xs font-medium text-foreground bg-muted/50 px-2 py-0.5 rounded">{lead.facturacion_mensual}</span>
              )}
              {(lead.source_tag || lead.webinar_date_tag) && (
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{lead.source_tag || lead.webinar_date_tag}</span>
              )}
              {lead.created_at && (
                <span className="text-xs text-muted-foreground">{format(parseISO(lead.created_at), "dd MMM", { locale: ptBR })}</span>
              )}
            </div>
          </div>
        ))}
        <NeonPagination showing={filtered.length} total={leads.length} />
      </div>

      {/* Desktop Table View */}
      <NeonTableWrapper>
        <table className="w-full hidden md:table">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">{t('Nome')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Insta')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Faturamento')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Origem')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Data')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Status')}</th>
              <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">{t('Ações')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-16 text-muted-foreground">{t('Carregando...')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16 text-muted-foreground">{t('Nenhum lead disponível')}</td></tr>
            ) : filtered.map(lead => (
              <React.Fragment key={lead.id}>
                <tr className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <LeadAvatar name={lead.nombre} />
                      <span className="font-medium text-foreground text-sm">{lead.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      {lead.instagram && (
                        <a href={`https://instagram.com/${lead.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                          <div className="p-2 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#833AB4] hover:opacity-80 transition-opacity cursor-pointer">
                            <Instagram size={14} className="text-white" />
                          </div>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground font-medium">
                    {lead.facturacion_mensual || '—'}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                      {lead.source_tag || lead.webinar_date_tag || '—'}
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
                        title="Más información"
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
                          {collectingId === lead.id ? t('Coletando...') : t('Coletar')}
                        </Button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(lead)}
                          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                          title={t('Apagar Lead')}
                        >
                          <Trash2 size={16} className="text-destructive/70 hover:text-destructive" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === lead.id && (
                  <tr className="bg-muted/20">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">País</span>
                          <span className="text-foreground">{lead.pais || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">Área de Atividade</span>
                          <span className="text-foreground">{lead.area_de_atividade || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">Tiempo de experiencia</span>
                          <span className="text-foreground">{lead.tiempo_experiencia || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">Cantidad de empleados</span>
                          <span className="text-foreground">{lead.cantidad_empleados || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">Plan concreto</span>
                          <span className="text-foreground">{lead.plan_concreto || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">Mayor obstáculo</span>
                          <span className="text-foreground">{lead.mayor_obstaculo || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">Tiempo para resultados</span>
                          <span className="text-foreground">{lead.tiempo_resultados || '—'}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="hidden md:block">
          <NeonPagination showing={filtered.length} total={leads.length} />
        </div>
      </NeonTableWrapper>
    </div>
  );
}
