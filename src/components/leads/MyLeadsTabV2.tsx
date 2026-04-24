import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UrgentLeadsDialog } from '@/components/leads/UrgentLeadsDialog';
import { LostReasonDialog } from '@/components/leads/LostReasonDialog';
import { EditLeadDialog } from '@/components/leads/EditLeadDialog';
import { supabase } from '@/integrations/supabase/client';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LeadPipelineStages } from '@/components/leads/LeadPipelineStages';
import { SaleDialog } from '@/components/leads/SaleDialog';
import { NeonInput, NeonStatusBadge, LeadAvatar, NeonTableWrapper, NeonSelectWrapper } from './NeonLeadComponents';
import { MessageCircle, Calendar, Phone, XCircle, CheckCircle, TrendingUp, AlertTriangle, Search, Tag, Instagram, MoreHorizontal, DollarSign, ChevronDown, ChevronUp, Undo2, UserCheck, Edit2, Trash2 } from 'lucide-react';
import { STATUS_CONFIG, WHATSAPP_TEMPLATE_THAYLOR } from '@/lib/constants';
import { toast } from 'sonner';
import { isToday, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface MyLeadsTabV2Props {
  leads: any[];
  isLoading: boolean;
  actionsByLead: Record<string, string[]>;
  allLeads?: any[];
  profileMap?: Record<string, string>;
  collectedAtMap?: Record<string, string>;
}

export function MyLeadsTabV2({ leads, isLoading, actionsByLead, allLeads = [], profileMap: externalProfileMap, collectedAtMap = {} }: MyLeadsTabV2Props) {
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
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [mqlOnly, setMqlOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [reassignLead, setReassignLead] = useState<any>(null);
  const [reassignTo, setReassignTo] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);
  const [showUrgentDialog, setShowUrgentDialog] = useState(false);
  const [showOverdueDialog, setShowOverdueDialog] = useState(false);

  const profileMap = externalProfileMap || Object.fromEntries(teamMembers.map(p => [p.id, p.full_name]));
  const sellers = Object.entries(profileMap)
    .filter(([id]) => leads.some(l => l.assigned_to === id) || allLeads.some(l => l.assigned_to === id))
    .map(([id, name]) => ({ id, full_name: name }));
  const uniqueTags = Array.from(new Set(
    (allLeads.length ? allLeads : leads).map(l => l.tag_manual || l.webinar_date_tag).filter(Boolean)
  )).sort().reverse();

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['profiles_dash'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles_dash').select('id, full_name, role');
      return data || [];
    },
    enabled: isAdmin,
  });
  const vendedoras = allProfiles.filter((p: any) =>
    p.role !== 'ADMIN' && p.full_name && !p.id.startsWith('00000000') && !p.full_name.toLowerCase().includes('test')
  );

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

  const logAction = async (leadId: string, actionType: string) => {
    await supabase.from('lead_actions').insert([{ lead_id: leadId, action_type: actionType, user_id: selectedProfile.id, action_metadata: {} as any }]);
  };

  const updateLead = async (leadId: string, updates: Record<string, unknown>) => {
    await supabase.from('leads').update({ ...updates, last_action_at: new Date().toISOString() } as any).eq('id', leadId);
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['lead_actions'] });
  };

  const handleWhatsApp = async (lead: any) => {
    const msg = WHATSAPP_TEMPLATE_THAYLOR.replace('{NOME_DA_VENDEDORA}', selectedProfile.full_name);
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
        .from('comprovantes').upload(filename, comprovanteFile, { upsert: true });
      if (uploadError) {
        toast.error('Erro ao enviar comprovante. Venda salva sem ele.');
      } else {
        const { data: urlData } = supabase.storage.from('comprovantes').getPublicUrl(uploadData.path);
        comprovanteUrl = urlData.publicUrl;
      }
    }
    await updateLead(saleDialogLead.id, {
      sale_status: saleType, status,
      sale_value: saleValue, cash_value: cashValue,
      ...(comprovanteUrl ? { comprovante_url: comprovanteUrl } : {}),
      ...(paymentMethod ? { payment_method: paymentMethod } : {}),
    });
    await logAction(saleDialogLead.id, saleType === 'won_call' ? 'sale_won_call' : 'sale_won_followup');
    toast.success(comprovanteUrl ? 'Venda registrada com comprovante! 🎉' : 'Venda registrada! 🎉');
    setSaleDialogOpen(false); setSaleDialogLead(null);
  };

  const handleDelete = async (lead: any) => {
    if (!window.confirm(`Tem certeza que deseja apagar o lead "${lead.nome}" permanentemente? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id);

      if (error) throw error;

      toast.success('Lead apagado permanentemente.');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (error) {
      console.error('Erro ao apagar lead:', error);
      toast.error('Erro ao apagar lead. Tente novamente.');
    }
  };

  const getDerivedActions = (lead: any, originalActions: string[]) => {
    const s = new Set(originalActions);
    if (lead.status === 'contato_1_feito') s.add('whatsapp_sent');
    if (lead.status === 'nao_respondeu_d0' || lead.status === 'nao_respondeu_d1') { s.add('whatsapp_sent'); s.add('no_response'); }
    if (lead.status === 'agendado') { s.add('whatsapp_sent'); s.add('scheduled_meeting'); }
    if (lead.status === 'no_show') { s.add('whatsapp_sent'); s.add('scheduled_meeting'); s.add('no_show_marked'); }
    if (lead.status === 'reuniao_realizada') { s.add('whatsapp_sent'); s.add('scheduled_meeting'); s.add('meeting_done'); }
    if (['proposta_enviada', 'aguardando_decisao', 'follow_up'].includes(lead.status)) {
      s.add('whatsapp_sent'); s.add('scheduled_meeting'); s.add('meeting_done'); s.add('followup_done');
    }
    if (lead.sale_status === 'won_call') { s.add('whatsapp_sent'); s.add('scheduled_meeting'); s.add('meeting_done'); s.add('sale_won_call'); }
    if (lead.sale_status === 'won_followup') { s.add('whatsapp_sent'); s.add('scheduled_meeting'); s.add('meeting_done'); s.add('followup_done'); s.add('sale_won_followup'); }
    return Array.from(s);
  };

  const filtered = leads.filter(lead => {
    if (search && !lead.nome?.toLowerCase().includes(search.toLowerCase()) && !lead.whatsapp?.includes(search)) return false;
    if (stageFilter === 'perdido') {
      if (lead.status !== 'perdido') return false;
    } else if (stageFilter !== 'all' && !(actionsByLead[lead.id] || []).includes(stageFilter)) return false;
    if (isAdmin && sellerFilter !== 'all' && lead.assigned_to !== sellerFilter) return false;
    const leadTag = lead.tag_manual || lead.webinar_date_tag;
    if (tagFilter !== 'all' && leadTag !== tagFilter) return false;
    if (mqlOnly && !isMql(lead.faturamento)) return false;
    if (revenueFilter !== 'all' && parseFaturamento(lead.faturamento) !== revenueFilter) return false;
    if (dateFilter) {
      const dateToUse = collectedAtMap[lead.id] || lead.created_at;
      if (dateToUse) {
        const leadDate = parseISO(dateToUse).toDateString();
        if (leadDate !== dateFilter.toDateString()) return false;
      } else {
        return false;
      }
    }
    return true;
  });

  const urgentLeads = filtered.filter(l => l.status === 'novo' && l.created_at && isToday(parseISO(l.created_at)));
  const overdueFollowups = filtered.filter(l => l.next_followup_date && new Date(l.next_followup_date) < new Date());

  const urgentDialogLeads = useMemo(() => urgentLeads.map(l => ({
    id: l.id, nome: l.nome, whatsapp: l.whatsapp, assigned_to: l.assigned_to,
    status: l.status, created_at: l.created_at, faturamento: l.faturamento,
    reason: 'Lead novo criado hoje — precisa de contato imediato',
  })), [urgentLeads]);

  const overdueDialogLeads = useMemo(() => overdueFollowups.map(l => ({
    id: l.id, nome: l.nome, whatsapp: l.whatsapp, assigned_to: l.assigned_to,
    status: l.status, next_followup_date: l.next_followup_date, created_at: l.created_at,
    faturamento: l.faturamento, reason: 'Follow-up agendado já passou da data',
  })), [overdueFollowups]);

  const ActionDropdown = ({ lead, align = 'end' }: { lead: any; align?: 'end' | 'start' }) => (
    <DropdownMenuContent align={align}>
      <DropdownMenuItem onClick={() => { setEditLead(lead); setEditDialogOpen(true); }}>
        <Edit2 className="w-4 h-4 mr-2" /> {t('Editar Lead')}
      </DropdownMenuItem>
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
        <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => openSaleDialog(lead, 'won_call')}><TrendingUp className="w-4 h-4 mr-2" /> {t('Venda na Call')}</DropdownMenuItem></>
      )}
      {lead.status === 'follow_up' && (
        <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => openSaleDialog(lead, 'won_followup')}><TrendingUp className="w-4 h-4 mr-2" /> {t('Venda no Follow-up')}</DropdownMenuItem></>
      )}
      {!['fechado_call', 'fechado_followup', 'perdido'].includes(lead.status) && (
        <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => { setLostDialogLead(lead); setLostDialogOpen(true); }} className="text-destructive"><XCircle className="w-4 h-4 mr-2" /> {t('Lead Perdido')}</DropdownMenuItem></>
      )}
      {lead.status === 'perdido' && (
        <><DropdownMenuSeparator /><DropdownMenuItem onClick={async () => { await updateLead(lead.id, { status: 'follow_up', sale_status: 'none' }); await logAction(lead.id, 'lead_recovered'); toast.success(t('Lead recuperado — voltou para Follow-up')); }} className="text-emerald-500"><Undo2 className="w-4 h-4 mr-2" /> {t('Recuperar Lead')}</DropdownMenuItem></>
      )}
      {lead.assigned_to && (
        <><DropdownMenuSeparator /><DropdownMenuItem onClick={async () => { await updateLead(lead.id, { assigned_to: null, status: 'novo' }); await logAction(lead.id, 'uncollected'); toast.success('Lead descoletado — voltou para Leads Disponíveis'); }} className="text-warning"><Undo2 className="w-4 h-4 mr-2" /> {t('Descoletar Lead')}</DropdownMenuItem></>
      )}
      {isAdmin && lead.assigned_to && (
        <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => { setReassignLead(lead); setReassignTo(lead.assigned_to || ''); setReassignDialogOpen(true); }}><UserCheck className="w-4 h-4 mr-2" /> {t('Trocar Responsável')}</DropdownMenuItem></>
      )}
      {isAdmin && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleDelete(lead)} className="text-destructive font-bold">
            <Trash2 className="w-4 h-4 mr-2" /> {t('Apagar Lead permanentemente')}
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );

  return (
    <div>
      <div className="px-4 md:px-6 py-4 md:py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 mb-3">
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
            <Select value={revenueFilter} onValueChange={setRevenueFilter}>
              <SelectTrigger className="h-10">
                <DollarSign size={14} className="mr-2 text-muted-foreground" />
                <SelectValue placeholder={t('Faturamento')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Todos')}</SelectItem>
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
                <SelectValue placeholder={t('Webinários')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Todos os webinários')}</SelectItem>
                {uniqueTags.map(tag => {
                  const isIso = /^\d{4}-\d{2}-\d{2}$/.test(tag);
                  const label = isIso ? `Webinar · ${tag.slice(8, 10)}/${tag.slice(5, 7)}` : tag;
                  return <SelectItem key={tag} value={tag}>{label}</SelectItem>;
                })}
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
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMqlOnly(!mqlOnly)}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${mqlOnly ? 'bg-primary border-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]' : 'border-muted-foreground/30 bg-muted/50'}`}>
              {mqlOnly && <CheckCircle size={10} className="text-primary-foreground" />}
            </div>
            {t('Somente MQL')}
          </label>
          {(search || stageFilter !== 'all' || sellerFilter !== 'all' || tagFilter !== 'all' || revenueFilter !== 'all' || mqlOnly || dateFilter) && (
            <button onClick={() => { setSearch(''); setStageFilter('all'); setSellerFilter('all'); setTagFilter('all'); setRevenueFilter('all'); setMqlOnly(false); setDateFilter(undefined); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <XCircle size={12} /> Limpar
            </button>
          )}
        </div>
      </div>

      {(urgentLeads.length > 0 || overdueFollowups.length > 0) && (
        <div className="flex gap-3 flex-wrap px-6 pt-4">
          {urgentLeads.length > 0 && (
            <button onClick={() => setShowUrgentDialog(true)} className="flex items-center gap-2 px-4 py-2.5 bg-destructive/10 text-destructive rounded-xl text-sm font-medium hover:bg-destructive/20 transition-colors">
              <AlertTriangle className="w-4 h-4" /> {urgentLeads.length} {t('leads URGENTES')}
            </button>
          )}
          {overdueFollowups.length > 0 && (
            <button onClick={() => setShowOverdueDialog(true)} className="flex items-center gap-2 px-4 py-2.5 bg-warning/10 text-warning rounded-xl text-sm font-medium hover:bg-warning/20 transition-colors">
              <AlertTriangle className="w-4 h-4" /> {overdueFollowups.length} {t('follow-ups atrasados')}
            </button>
          )}
        </div>
      )}

      <UrgentLeadsDialog leads={urgentDialogLeads} profileMap={profileMap} open={showUrgentDialog} onOpenChange={setShowUrgentDialog} />
      <UrgentLeadsDialog leads={overdueDialogLeads} profileMap={profileMap} open={showOverdueDialog} onOpenChange={setShowOverdueDialog} title="Follow-ups Atrasados" dateLabel="Follow-up" getDate={(l) => l.next_followup_date} />

      {/* Mobile Card View */}
      <div className="md:hidden px-4 pt-3 pb-6 space-y-3">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">{t('Carregando...')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{t('Nenhum lead encontrado')}</div>
        ) : filtered.map(lead => (
          <div key={lead.id} className="bg-secondary/50 rounded-2xl overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <LeadAvatar name={lead.nome} />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{lead.nome}</p>
                  {lead.instagram && (
                    <a href={`https://instagram.com/${lead.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors block truncate max-w-[120px]">
                      @{lead.instagram.replace(/^@/, '')}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {lead.whatsapp && (
                  <button onClick={() => handleWhatsApp(lead)} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
                    <MessageCircle size={18} className="text-green-500" />
                  </button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
                      <MoreHorizontal size={18} className="text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <ActionDropdown lead={lead} />
                </DropdownMenu>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
              <NeonStatusBadge status={lead.status} />
              {lead.faturamento && (
                <span className="text-xs font-medium text-foreground bg-muted/60 px-2.5 py-1 rounded-full">
                  {isNaN(Number(lead.faturamento)) ? lead.faturamento : `R$ ${Number(lead.faturamento).toLocaleString('pt-BR')}`}
                </span>
              )}
              {(lead.tag_manual || lead.webinar_date_tag) && (
                <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
                  {lead.tag_manual || (
                    /^\d{4}-\d{2}-\d{2}$/.test(lead.webinar_date_tag)
                      ? `${lead.webinar_date_tag.slice(8, 10)}/${lead.webinar_date_tag.slice(5, 7)}`
                      : lead.webinar_date_tag
                  )}
                </span>
              )}
            </div>

            {/* Pipeline */}
            <div className="px-4 pb-3">
              <LeadPipelineStages completedActions={getDerivedActions(lead, actionsByLead[lead.id] || [])} />
            </div>

            {/* Footer: responsável + expand */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20">
              {isAdmin && lead.assigned_to
                ? <span className="text-xs text-muted-foreground">{profileMap[lead.assigned_to] || '—'}</span>
                : <span />
              }
              <button
                onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {expandedId === lead.id ? <>{t('Menos')}<ChevronUp size={14} /></> : <>{t('Mais info')}<ChevronDown size={14} /></>}
              </button>
            </div>

            {/* Expanded Details */}
            {expandedId === lead.id && (
              <div className="px-4 py-3 border-t border-border/30 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">{t('Profissão')}</span>
                  <span className="text-xs text-foreground">{lead.profissao || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">{t('Renda Familiar')}</span>
                  <span className="text-xs text-foreground">{lead.renda_familiar || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">{t('Quem Investe')}</span>
                  <span className="text-xs text-foreground">{lead.quem_investe || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">{t('Maior Dificuldade')}</span>
                  <span className="text-xs text-foreground">{lead.maior_dificuldade || '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-primary uppercase tracking-wider font-bold block mb-0.5">Momento Atual</span>
                  <span className="text-xs text-foreground">{lead.momento_atual || '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-primary uppercase tracking-wider font-bold block mb-0.5">Disposta a Investir</span>
                  <span className="text-xs text-foreground">{lead.valor_investimento || '—'}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        
      </div>

      {/* Desktop Table View */}
      <NeonTableWrapper>
        <table className="w-full hidden md:table">
          <thead>
            <tr className="border-b border-transparent">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">{t('Nome')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Insta')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Faturamento')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Tag</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Momento</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Investimento</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Status')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Etapas')}</th>
              {isAdmin && <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Responsável')}</th>}
              <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">{t('Ações')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={isAdmin ? 10 : 9} className="text-center py-16 text-muted-foreground">{t('Carregando...')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={isAdmin ? 10 : 9} className="text-center py-16 text-muted-foreground">{t('Nenhum lead encontrado')}</td></tr>
            ) : filtered.map(lead => (
              <React.Fragment key={lead.id}>
                <tr className={`hover:bg-muted/30 transition-colors group ${lead.status === 'novo' && lead.created_at && isToday(parseISO(lead.created_at)) ? 'bg-destructive/[0.03]' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <LeadAvatar name={lead.nome} />
                      <span className="font-medium text-foreground text-sm">{lead.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {lead.instagram && (
                      <a href={`https://instagram.com/${lead.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                        <div className="p-2 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#833AB4] hover:opacity-80 transition-opacity cursor-pointer w-fit">
                          <Instagram size={14} className="text-white" />
                        </div>
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground font-medium">
                    {lead.faturamento ? (isNaN(Number(lead.faturamento)) ? lead.faturamento : `R$ ${Number(lead.faturamento).toLocaleString('pt-BR')}`) : '—'}
                    {lead.faturamento && !isNaN(Number(lead.faturamento)) && Number(lead.faturamento) >= 12000 && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold">HIGH</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                      {lead.tag_manual
                        ? lead.tag_manual
                        : lead.webinar_date_tag
                          ? /^\d{4}-\d{2}-\d{2}$/.test(lead.webinar_date_tag)
                            ? `${lead.origem || 'webinar'} · ${lead.webinar_date_tag.slice(8, 10)}/${lead.webinar_date_tag.slice(5, 7)}`
                            : lead.webinar_date_tag
                          : lead.origem || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground max-w-[150px] truncate">{lead.momento_atual || '—'}</td>
                  <td className="px-4 py-4 text-xs text-muted-foreground max-w-[150px] truncate">{lead.valor_investimento || '—'}</td>
                  <td className="px-4 py-4"><NeonStatusBadge status={lead.status} /></td>
                  <td className="px-4 py-4"><LeadPipelineStages completedActions={getDerivedActions(lead, actionsByLead[lead.id] || [])} /></td>
                  {isAdmin && (
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {lead.assigned_to ? profileMap[lead.assigned_to] || '—' : '—'}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)} className="p-2 rounded-lg hover:bg-muted/50 transition-colors" title="Mais informações">
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
                        <ActionDropdown lead={lead} />
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
                {expandedId === lead.id && (
                  <tr className="bg-muted/20">
                    <td colSpan={isAdmin ? 10 : 9} className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">{t('Profissão')}</span>
                          <span className="text-foreground">{lead.profissao || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">{t('Maior Dificuldade')}</span>
                          <span className="text-foreground">{lead.maior_dificuldade || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">{t('Renda Familiar')}</span>
                          <span className="text-foreground">{lead.renda_familiar || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">{t('Quem Investe')}</span>
                          <span className="text-foreground">{lead.quem_investe || '—'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground text-xs block mb-1 font-bold text-primary">Momento Atual</span>
                          <span className="text-foreground">{lead.momento_atual || '—'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground text-xs block mb-1 font-bold text-primary">Disposta a Investir</span>
                          <span className="text-foreground">{lead.valor_investimento || '—'}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

      </NeonTableWrapper>

      <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('Trocar Responsável')}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">Lead: <span className="font-semibold text-foreground">{reassignLead?.nome}</span></p>
            <Select value={reassignTo} onValueChange={setReassignTo}>
              <SelectTrigger><SelectValue placeholder={t('Selecionar nova responsável')} /></SelectTrigger>
              <SelectContent>
                {vendedoras.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}{p.id === reassignLead?.assigned_to ? ' (atual)' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <button onClick={() => { setReassignDialogOpen(false); setReassignLead(null); setReassignTo(''); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">{t('Cancelar')}</button>
            <button onClick={handleReassign} disabled={!reassignTo || reassignTo === reassignLead?.assigned_to} className="px-4 py-2 bg-foreground text-background text-sm font-bold rounded-lg hover:bg-foreground/90 transition-all disabled:opacity-40">{t('Confirmar Troca')}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaleDialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen} onConfirm={handleSaleConfirm} leadName={saleDialogLead?.nome || ''} />

      <LostReasonDialog
        open={lostDialogOpen}
        onOpenChange={setLostDialogOpen}
        leadName={lostDialogLead?.nome || ''}
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

      <EditLeadDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} lead={editLead} />
    </div>
  );
}
