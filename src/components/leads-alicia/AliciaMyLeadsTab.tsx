import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LostReasonDialog } from '@/components/leads/LostReasonDialog';
import { supabase } from '@/integrations/supabase/client';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LeadPipelineStages } from '@/components/leads/LeadPipelineStages';
import { SaleDialog } from '@/components/leads/SaleDialog';
import { NeonInput, NeonStatusBadge, LeadAvatar, NeonTableWrapper, NeonPagination, NeonSelectWrapper } from '../leads/NeonLeadComponents';
import { MessageCircle, Calendar, Phone, XCircle, CheckCircle, TrendingUp, AlertTriangle, Search, Tag, Instagram, MoreHorizontal, ChevronDown, ChevronUp, Undo2, UserCheck, ExternalLink } from 'lucide-react';
import { STATUS_CONFIG, WHATSAPP_TEMPLATE_ALICIA } from '@/lib/constants';
import { toast } from 'sonner';
import { isToday, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface AliciaMyLeadsTabProps {
  leads: any[];
  isLoading: boolean;
  actionsByLead: Record<string, string[]>;
  allLeads?: any[];
  profileMap?: Record<string, string>;
}

export function AliciaMyLeadsTab({ leads, isLoading, actionsByLead, allLeads = [], profileMap: externalProfileMap }: AliciaMyLeadsTabProps) {
  const { selectedProfile, isAdmin, teamMembers } = useProfileSelector();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [saleDialogLead, setSaleDialogLead] = useState<any>(null);
  const [saleType, setSaleType] = useState<'won_call' | 'won_followup'>('won_call');
  const [sellerFilter, setSellerFilter] = useState('all');
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [lostDialogLead, setLostDialogLead] = useState<any>(null);
  const [tagFilter, setTagFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [reassignLead, setReassignLead] = useState<any>(null);
  const [reassignTo, setReassignTo] = useState('');

  const profileMap = externalProfileMap || Object.fromEntries(teamMembers.map(p => [p.id, p.full_name]));
  const sellers = Object.entries(profileMap)
    .filter(([id]) => leads.some(l => l.assigned_to === id) || allLeads.some(l => l.assigned_to === id))
    .map(([id, name]) => ({ id, full_name: name }));
  const uniqueTags = Array.from(new Set(allLeads.map(l => l.source_tag).filter(Boolean))).sort().reverse();

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['profiles_dash'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles_dash').select('id, full_name, role');
      return data || [];
    },
    enabled: isAdmin,
  });
  const vendedoras = allProfiles.filter((p: any) =>
    p.role !== 'ADMIN' &&
    p.full_name &&
    !p.id.startsWith('00000000') &&
    !p.full_name.toLowerCase().includes('test')
  );

  const logAction = async (leadId: string, actionType: string) => {
    await supabase.from('lead_actions').insert([{ lead_id: leadId, action_type: actionType, action_metadata: {} as any }]);
  };

  const updateLead = async (leadId: string, updates: Record<string, unknown>) => {
    await supabase.from('leads_alicia' as any).update({ ...updates, last_action_at: new Date().toISOString() } as any).eq('id', leadId);
    queryClient.invalidateQueries({ queryKey: ['leads_alicia'] });
    queryClient.invalidateQueries({ queryKey: ['lead_actions'] });
  };

  const handleWhatsApp = async (lead: any) => {
    const msg = WHATSAPP_TEMPLATE_ALICIA.replace('{NOME_DA_VENDEDORA}', selectedProfile.full_name);
    const phone = lead.whatsapp?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    await logAction(lead.id, 'whatsapp_sent');
    if (lead.status === 'novo') {
      await updateLead(lead.id, { status: 'contato_1_feito' });
    } else {
      await updateLead(lead.id, {});
    }
    toast.success('WhatsApp enviado!');
  };

  const handleReassign = async () => {
    if (!reassignLead || !reassignTo) return;
    await updateLead(reassignLead.id, { assigned_to: reassignTo });
    await logAction(reassignLead.id, 'reassigned');
    toast.success('Responsável atualizado com sucesso!');
    setReassignDialogOpen(false);
    setReassignLead(null);
    setReassignTo('');
  };

  const handleStatusChange = async (lead: any, newStatus: string, actionType: string) => {
    await logAction(lead.id, actionType);
    await updateLead(lead.id, { status: newStatus });
    toast.success(`Status → ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
  };

  const openSaleDialog = (lead: any, type: 'won_call' | 'won_followup') => {
    setSaleDialogLead(lead); setSaleType(type); setSaleDialogOpen(true);
  };

  const handleSaleConfirm = async (saleValue: number, cashValue: number, comprovanteFile: File | null, paymentMethod: string | null) => {
    if (!saleDialogLead) return;
    const status = saleType === 'won_call' ? 'fechado_call' : 'fechado_followup';

    let comprovanteUrl: string | null = null;
    if (comprovanteFile) {
      const ext = comprovanteFile.name.split('.').pop();
      const filename = `${saleDialogLead.id}_${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(filename, comprovanteFile, { upsert: true });
      if (uploadError) {
        toast.error('Erro ao enviar comprovante. Venda salva sem ele.');
      } else {
        const { data: urlData } = supabase.storage.from('comprovantes').getPublicUrl(uploadData.path);
        comprovanteUrl = urlData.publicUrl;
      }
    }

    await updateLead(saleDialogLead.id, {
      sale_status: saleType,
      status,
      sale_value: saleValue,
      cash_value: cashValue,
      ...(comprovanteUrl ? { comprovante_url: comprovanteUrl } : {}),
      ...(paymentMethod ? { payment_method: paymentMethod } : {}),
    });
    await logAction(saleDialogLead.id, saleType === 'won_call' ? 'sale_won_call' : 'sale_won_followup');
    toast.success(comprovanteUrl ? 'Venda registrada com comprovante! 🎉' : 'Venda registrada! 🎉');
    setSaleDialogOpen(false); setSaleDialogLead(null);
  };

  const filtered = leads.filter(lead => {
    if (search && !lead.nombre?.toLowerCase().includes(search.toLowerCase()) && !lead.whatsapp?.includes(search)) return false;
    if (stageFilter === 'perdido') {
      if (lead.status !== 'perdido') return false;
    } else if (stageFilter !== 'all' && !(actionsByLead[lead.id] || []).includes(stageFilter)) return false;
    if (isAdmin && sellerFilter !== 'all' && lead.assigned_to !== sellerFilter) return false;
    if (tagFilter !== 'all' && lead.source_tag !== tagFilter) return false;
    if (dateFilter && lead.created_at) {
      const leadDate = parseISO(lead.created_at).toDateString();
      if (leadDate !== dateFilter.toDateString()) return false;
    }
    return true;
  });

  const urgentLeads = filtered.filter(l => l.status === 'novo' && l.created_at && isToday(parseISO(l.created_at)));
  const overdueFollowups = filtered.filter(l => l.next_followup_date && new Date(l.next_followup_date) < new Date());

  return (
    <div>
      <div className="px-4 md:px-6 py-4 md:py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 mb-4">
          <NeonInput icon={Search} placeholder={t('Buscar nome, WhatsApp...')} value={search} onChange={e => setSearch(e.target.value)} />
          <NeonSelectWrapper>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="h-10"><SelectValue placeholder={t('Etapa')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Todas as etapas')}</SelectItem>
                <SelectItem value="whatsapp_sent">{t('WhatsApp enviado')}</SelectItem>
                <SelectItem value="no_response">{t('Não respondeu')}</SelectItem>
                <SelectItem value="scheduled_meeting">{t('Agendado')}</SelectItem>
                <SelectItem value="no_show_marked">No-show</SelectItem>
                <SelectItem value="meeting_done">{t('Reunião realizada')}</SelectItem>
                <SelectItem value="followup_done">{t('Follow-up feito')}</SelectItem>
                <SelectItem value="sale_won_call">{t('Venda na Call')}</SelectItem>
                <SelectItem value="sale_won_followup">{t('Venda no Follow-up')}</SelectItem>
                <SelectItem value="perdido">{t('Perdido')}</SelectItem>
              </SelectContent>
            </Select>
          </NeonSelectWrapper>
          {isAdmin && (
            <NeonSelectWrapper>
              <Select value={sellerFilter} onValueChange={setSellerFilter}>
                <SelectTrigger className="h-10"><SelectValue placeholder={t('Vendedora')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('Todas as vendedoras')}</SelectItem>
                  {sellers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </NeonSelectWrapper>
          )}
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
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 bg-secondary rounded-xl px-3 h-10 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Calendar size={14} />
                {dateFilter ? format(dateFilter, "dd/MM/yyyy") : t('Data')}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
            </PopoverContent>
          </Popover>
          {(search || stageFilter !== 'all' || sellerFilter !== 'all' || tagFilter !== 'all' || dateFilter) && (
            <button onClick={() => { setSearch(''); setStageFilter('all'); setSellerFilter('all'); setTagFilter('all'); setDateFilter(undefined); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 h-10">
              <XCircle size={12} /> Limpar
            </button>
          )}
        </div>
      </div>

      {(urgentLeads.length > 0 || overdueFollowups.length > 0) && (
        <div className="flex gap-3 flex-wrap px-6 pt-4">
          {urgentLeads.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">
              <AlertTriangle className="w-4 h-4" /> {urgentLeads.length} {t('leads URGENTES')}
            </div>
          )}
          {overdueFollowups.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-warning/10 text-warning rounded-xl text-sm font-medium">
              <AlertTriangle className="w-4 h-4" /> {overdueFollowups.length} {t('follow-ups atrasados')}
            </div>
          )}
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden px-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">{t('Carregando...')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{t('Nenhum lead encontrado')}</div>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-lg hover:bg-muted/50">
                      <MoreHorizontal size={18} className="text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {lead.status === 'novo' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(lead, 'contato_1_feito', 'whatsapp_sent')}>
                        <MessageCircle className="w-4 h-4 mr-2" /> {t('Marcar 1º Contato Feito')}
                      </DropdownMenuItem>
                    )}
                    {['novo', 'contato_1_feito', 'nao_respondeu_d0'].includes(lead.status) && (
                      <DropdownMenuItem onClick={() => handleStatusChange(lead, lead.status === 'nao_respondeu_d0' ? 'nao_respondeu_d1' : 'nao_respondeu_d0', 'no_response')}>
                        <XCircle className="w-4 h-4 mr-2" /> {t('Não Respondeu')}
                      </DropdownMenuItem>
                    )}
                    {['novo', 'contato_1_feito', 'nao_respondeu_d0', 'nao_respondeu_d1', 'no_show'].includes(lead.status) && (
                      <DropdownMenuItem onClick={() => handleStatusChange(lead, 'agendado', 'scheduled_meeting')}>
                        <Calendar className="w-4 h-4 mr-2" /> {t('Agendar Reunião')}
                      </DropdownMenuItem>
                    )}
                    {lead.status === 'agendado' && (
                      <>
                        <DropdownMenuItem onClick={() => handleStatusChange(lead, 'no_show', 'no_show_marked')}>
                          <XCircle className="w-4 h-4 mr-2" /> {t('Marcar No-show')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(lead, 'reuniao_realizada', 'meeting_done')}>
                          <Phone className="w-4 h-4 mr-2" /> {t('Reunião realizada')}
                        </DropdownMenuItem>
                      </>
                    )}
                    {['reuniao_realizada', 'proposta_enviada', 'aguardando_decisao'].includes(lead.status) && (
                      <DropdownMenuItem onClick={() => handleStatusChange(lead, 'follow_up', 'followup_done')}>
                        <CheckCircle className="w-4 h-4 mr-2" /> {t('Follow-up Feito')}
                      </DropdownMenuItem>
                    )}
                    {lead.status === 'reuniao_realizada' && (
                      <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => openSaleDialog(lead, 'won_call')}><TrendingUp className="w-4 h-4 mr-2" /> {t('Venda na Call')}</DropdownMenuItem></>
                    )}
                    {lead.status === 'follow_up' && (
                      <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => openSaleDialog(lead, 'won_followup')}><TrendingUp className="w-4 h-4 mr-2" /> {t('Venda no Follow-up')}</DropdownMenuItem></>
                    )}
                    {!['fechado_call', 'fechado_followup', 'perdido'].includes(lead.status) && (
                      <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => { setLostDialogLead(lead); setLostDialogOpen(true); }} className="text-destructive"><XCircle className="w-4 h-4 mr-2" /> {t('Lead Perdido')}</DropdownMenuItem></>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
            </div>
            <LeadPipelineStages completedActions={actionsByLead[lead.id] || []} />
          </div>
        ))}
        <NeonPagination showing={filtered.length} total={leads.length} />
      </div>

      {/* Desktop Table View */}
      <NeonTableWrapper>
        <table className="w-full hidden md:table">
          <thead>
            <tr className="border-b border-transparent">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">{t('Nome')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Insta')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Faturamento')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Origem')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Status')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Etapas')}</th>
              {isAdmin && <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Responsável')}</th>}
              <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">{t('Ações')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-16 text-muted-foreground">{t('Carregando...')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16 text-muted-foreground">{t('Nenhum lead encontrado')}</td></tr>
            ) : filtered.map(lead => (
              <React.Fragment key={lead.id}>
                <tr className={`hover:bg-muted/30 transition-colors group ${lead.status === 'novo' && lead.created_at && isToday(parseISO(lead.created_at)) ? 'bg-destructive/[0.03]' : ''}`}>
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
                  <td className="px-4 py-4"><NeonStatusBadge status={lead.status} /></td>
                  <td className="px-4 py-4"><LeadPipelineStages completedActions={actionsByLead[lead.id] || []} /></td>
                  {isAdmin && (
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {lead.assigned_to ? profileMap[lead.assigned_to] || '—' : '—'}
                    </td>
                  )}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <MoreHorizontal size={16} className="text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {lead.status === 'novo' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(lead, 'contato_1_feito', 'whatsapp_sent')}>
                              <MessageCircle className="w-4 h-4 mr-2" /> {t('Marcar 1º Contato Feito')}
                            </DropdownMenuItem>
                          )}
                          {['novo', 'contato_1_feito', 'nao_respondeu_d0'].includes(lead.status) && (
                            <DropdownMenuItem onClick={() => handleStatusChange(lead, lead.status === 'nao_respondeu_d0' ? 'nao_respondeu_d1' : 'nao_respondeu_d0', 'no_response')}>
                              <XCircle className="w-4 h-4 mr-2" /> {t('Não Respondeu')}
                            </DropdownMenuItem>
                          )}
                          {['novo', 'contato_1_feito', 'nao_respondeu_d0', 'nao_respondeu_d1', 'no_show'].includes(lead.status) && (
                            <DropdownMenuItem onClick={() => handleStatusChange(lead, 'agendado', 'scheduled_meeting')}>
                              <Calendar className="w-4 h-4 mr-2" /> {t('Agendar Reunião')}
                            </DropdownMenuItem>
                          )}
                          {lead.status === 'agendado' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(lead, 'no_show', 'no_show_marked')}>
                              <XCircle className="w-4 h-4 mr-2" /> {t('Marcar No-show')}
                            </DropdownMenuItem>
                          )}
                          {lead.status === 'agendado' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(lead, 'reuniao_realizada', 'meeting_done')}>
                              <Phone className="w-4 h-4 mr-2" /> {t('Reunião realizada')}
                            </DropdownMenuItem>
                          )}
                          {['reuniao_realizada', 'proposta_enviada', 'aguardando_decisao'].includes(lead.status) && (
                            <DropdownMenuItem onClick={() => handleStatusChange(lead, 'follow_up', 'followup_done')}>
                              <CheckCircle className="w-4 h-4 mr-2" /> {t('Follow-up Feito')}
                            </DropdownMenuItem>
                          )}
                          {lead.status === 'reuniao_realizada' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openSaleDialog(lead, 'won_call')}>
                                <TrendingUp className="w-4 h-4 mr-2" /> {t('Venda na Call')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {lead.status === 'follow_up' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openSaleDialog(lead, 'won_followup')}>
                                <TrendingUp className="w-4 h-4 mr-2" /> {t('Venda no Follow-up')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {!['fechado_call', 'fechado_followup', 'perdido'].includes(lead.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setLostDialogLead(lead); setLostDialogOpen(true); }} className="text-destructive">
                                <XCircle className="w-4 h-4 mr-2" /> {t('Lead Perdido')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {lead.status === 'perdido' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={async () => {
                                await updateLead(lead.id, { status: 'follow_up', sale_status: 'none' });
                                await logAction(lead.id, 'lead_recovered');
                                toast.success(t('Lead recuperado — voltou para Follow-up'));
                              }} className="text-emerald-500">
                                <Undo2 className="w-4 h-4 mr-2" /> {t('Recuperar Lead')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {lead.assigned_to && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={async () => {
                                await updateLead(lead.id, { assigned_to: null, status: 'novo' });
                                await logAction(lead.id, 'uncollected');
                                toast.success('Lead descoletado');
                              }} className="text-warning">
                                <Undo2 className="w-4 h-4 mr-2" /> {t('Descoletar Lead')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {isAdmin && lead.assigned_to && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setReassignLead(lead);
                                setReassignTo(lead.assigned_to || '');
                                setReassignDialogOpen(true);
                              }}>
                                <UserCheck className="w-4 h-4 mr-2" /> {t('Trocar Responsável')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
                {expandedId === lead.id && (
                  <tr className="bg-muted/20">
                    <td colSpan={isAdmin ? 8 : 7} className="px-6 py-4">
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

      <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Trocar Responsável')}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Lead: <span className="font-semibold text-foreground">{reassignLead?.nombre}</span>
            </p>
            <Select value={reassignTo} onValueChange={setReassignTo}>
              <SelectTrigger>
                <SelectValue placeholder={t('Selecionar nova responsável')} />
              </SelectTrigger>
              <SelectContent>
                {vendedoras.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                    {p.id === reassignLead?.assigned_to ? ' (atual)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <button onClick={() => { setReassignDialogOpen(false); setReassignLead(null); setReassignTo(''); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('Cancelar')}
            </button>
            <button onClick={handleReassign} disabled={!reassignTo || reassignTo === reassignLead?.assigned_to} className="px-4 py-2 bg-foreground text-background text-sm font-bold rounded-lg hover:bg-foreground/90 transition-all disabled:opacity-40">
              {t('Confirmar Troca')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaleDialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen} onConfirm={handleSaleConfirm} leadName={saleDialogLead?.nombre || ''} />

      <LostReasonDialog
        open={lostDialogOpen}
        onOpenChange={setLostDialogOpen}
        leadName={lostDialogLead?.nombre || ''}
        onConfirm={async (reason) => {
          if (!lostDialogLead) return;
          const existingNotes = lostDialogLead.notes ? lostDialogLead.notes + '\n' : '';
          await updateLead(lostDialogLead.id, { status: 'perdido', notes: existingNotes + `[PERDIDO] ${reason}` });
          await logAction(lostDialogLead.id, 'lead_lost');
          toast.success('Lead marcado como perdido');
          setLostDialogOpen(false);
          setLostDialogLead(null);
        }}
      />
    </div>
  );
}
