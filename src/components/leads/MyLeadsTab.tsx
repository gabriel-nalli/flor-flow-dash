import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UrgentLeadsDialog } from '@/components/leads/UrgentLeadsDialog';
import { LostReasonDialog } from '@/components/leads/LostReasonDialog';
import { supabase } from '@/integrations/supabase/client';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LeadPipelineStages } from '@/components/leads/LeadPipelineStages';
import { SaleDialog } from '@/components/leads/SaleDialog';

import { NeonInput, NeonStatusBadge, LeadAvatar, ChannelIcon, NeonTableWrapper, NeonPagination, NeonSelectWrapper } from './NeonLeadComponents';

import { MessageCircle, MoreVertical, Calendar, Phone, XCircle, CheckCircle, TrendingUp, AlertTriangle, Search, Tag, Instagram, MoreHorizontal, DollarSign, ChevronDown, ChevronUp, Undo2, UserCheck } from 'lucide-react';
import { STATUS_CONFIG, WHATSAPP_TEMPLATE } from '@/lib/constants';
import { toast } from 'sonner';
import { isToday, parseISO } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface MyLeadsTabProps {
  leads: any[];
  isLoading: boolean;
  actionsByLead: Record<string, string[]>;
  allLeads?: any[];
  profileMap?: Record<string, string>;
}

export function MyLeadsTab({ leads, isLoading, actionsByLead, allLeads = [], profileMap: externalProfileMap }: MyLeadsTabProps) {
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
  const [mqlOnly, setMqlOnly] = useState(false);
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [reassignLead, setReassignLead] = useState<any>(null);
  const [reassignTo, setReassignTo] = useState('');

  const profileMap = externalProfileMap || Object.fromEntries(teamMembers.map(p => [p.id, p.full_name]));
  // Build sellers list from profileMap (real DB profiles) excluding admins
  const sellers = Object.entries(profileMap)
    .filter(([id]) => {
      // Find unique assigned_to values in leads to only show relevant sellers
      return leads.some(l => l.assigned_to === id) || allLeads.some(l => l.assigned_to === id);
    })
    .map(([id, name]) => ({ id, full_name: name }));
  const uniqueTags = Array.from(new Set((allLeads.length ? allLeads : leads).map(l => l.webinar_date_tag).filter(Boolean))).sort().reverse();

  // Busca todos os perfis para o dialog de troca de responsável (apenas admin)
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
    await supabase.from('lead_actions').insert([{ lead_id: leadId, action_type: actionType, action_metadata: {} as any }]);
  };

  const updateLead = async (leadId: string, updates: Record<string, unknown>) => {
    await supabase.from('leads').update({ ...updates, last_action_at: new Date().toISOString() } as any).eq('id', leadId);
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['lead_actions'] });
  };

  const handleWhatsApp = async (lead: any) => {
    const msg = WHATSAPP_TEMPLATE.replace('{NOME_DA_VENDEDORA}', selectedProfile.full_name);
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

  const getDerivedActions = (lead: any, originalActions: string[]) => {
    const s = new Set(originalActions);
    if (lead.status === 'contato_1_feito') s.add('whatsapp_sent');
    if (lead.status === 'nao_respondeu_d0' || lead.status === 'nao_respondeu_d1') {
      s.add('whatsapp_sent');
      s.add('no_response');
    }
    if (lead.status === 'agendado') {
      s.add('whatsapp_sent');
      s.add('scheduled_meeting');
    }
    if (lead.status === 'no_show') {
      s.add('whatsapp_sent');
      s.add('scheduled_meeting');
      s.add('no_show_marked');
    }
    if (lead.status === 'reuniao_realizada') {
      s.add('whatsapp_sent');
      s.add('scheduled_meeting');
      s.add('meeting_done');
    }
    if (lead.status === 'proposta_enviada' || lead.status === 'aguardando_decisao' || lead.status === 'follow_up') {
      s.add('whatsapp_sent');
      s.add('scheduled_meeting');
      s.add('meeting_done');
      s.add('followup_done');
    }
    if (lead.sale_status === 'won_call') {
      s.add('whatsapp_sent');
      s.add('scheduled_meeting');
      s.add('meeting_done');
      s.add('sale_won_call');
    }
    if (lead.sale_status === 'won_followup') {
      s.add('whatsapp_sent');
      s.add('scheduled_meeting');
      s.add('meeting_done');
      s.add('followup_done');
      s.add('sale_won_followup');
    }
    return Array.from(s);
  };

  const filtered = leads.filter(lead => {
    if (search && !lead.nome?.toLowerCase().includes(search.toLowerCase()) && !lead.whatsapp?.includes(search)) return false;
    if (stageFilter === 'perdido') {
      if (lead.status !== 'perdido') return false;
    } else if (stageFilter !== 'all' && !(actionsByLead[lead.id] || []).includes(stageFilter)) return false;
    if (isAdmin && sellerFilter !== 'all' && lead.assigned_to !== sellerFilter) return false;
    if (tagFilter !== 'all' && lead.webinar_date_tag !== tagFilter) return false;
    if (mqlOnly && !isMql(lead.faturamento)) return false;
    if (revenueFilter !== 'all' && parseFaturamento(lead.faturamento) !== revenueFilter) return false;
    return true;
  });

  const urgentLeads = filtered.filter(l => l.status === 'novo' && l.created_at && isToday(parseISO(l.created_at)));
  const overdueFollowups = filtered.filter(l => l.next_followup_date && new Date(l.next_followup_date) < new Date());

  const [showUrgentDialog, setShowUrgentDialog] = useState(false);
  const [showOverdueDialog, setShowOverdueDialog] = useState(false);

  const urgentDialogLeads = useMemo(() => urgentLeads.map(l => ({
    id: l.id,
    nome: l.nome,
    whatsapp: l.whatsapp,
    assigned_to: l.assigned_to,
    status: l.status,
    created_at: l.created_at,
    faturamento: l.faturamento,
    reason: 'Lead novo criado hoje — precisa de contato imediato',
  })), [urgentLeads]);

  const overdueDialogLeads = useMemo(() => overdueFollowups.map(l => ({
    id: l.id,
    nome: l.nome,
    whatsapp: l.whatsapp,
    assigned_to: l.assigned_to,
    status: l.status,
    next_followup_date: l.next_followup_date,
    created_at: l.created_at,
    faturamento: l.faturamento,
    reason: 'Follow-up agendado já passou da data',
  })), [overdueFollowups]);

  return (
    <div>
      <div className="px-6 py-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
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
          <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors h-10" onClick={() => setMqlOnly(!mqlOnly)}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${mqlOnly ? 'bg-primary border-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]' : 'border-muted-foreground/30 bg-muted/50'}`}>
              {mqlOnly && <CheckCircle size={10} className="text-primary-foreground" />}
            </div>
            {t('Somente MQL')}
          </label>
        </div>
      </div>

      {(urgentLeads.length > 0 || overdueFollowups.length > 0) && (
        <div className="flex gap-3 flex-wrap px-6 pt-4">
          {urgentLeads.length > 0 && (
            <button
              onClick={() => setShowUrgentDialog(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-destructive/10 text-destructive rounded-xl text-sm font-medium hover:bg-destructive/20 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" /> {urgentLeads.length} {t('leads URGENTES')}
            </button>
          )}
          {overdueFollowups.length > 0 && (
            <button
              onClick={() => setShowOverdueDialog(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-warning/10 text-warning rounded-xl text-sm font-medium hover:bg-warning/20 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" /> {overdueFollowups.length} {t('follow-ups atrasados')}
            </button>
          )}
        </div>
      )}

      <UrgentLeadsDialog
        leads={urgentDialogLeads}
        profileMap={profileMap}
        open={showUrgentDialog}
        onOpenChange={setShowUrgentDialog}
      />
      <UrgentLeadsDialog
        leads={overdueDialogLeads}
        profileMap={profileMap}
        open={showOverdueDialog}
        onOpenChange={setShowOverdueDialog}
        title="Follow-ups Atrasados"
        dateLabel="Follow-up"
        getDate={(l) => l.next_followup_date}
      />

      <NeonTableWrapper>
        <table className="w-full">
          <thead>
            <tr className="border-b border-transparent">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">{t('Nome')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Insta')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">{t('Faturamento')}</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Tag</th>
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
                    {lead.faturamento && !isNaN(Number(lead.faturamento)) && Number(lead.faturamento) >= 12000 && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold">HIGH</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                      {lead.webinar_date_tag
                        ? /^\d{4}-\d{2}-\d{2}$/.test(lead.webinar_date_tag)
                          ? <><span className="capitalize">{lead.origem || 'webinar'}</span><span className="opacity-40">·</span><span>{lead.webinar_date_tag.slice(8, 10) + '/' + lead.webinar_date_tag.slice(5, 7)}</span></>
                          : <span>{lead.webinar_date_tag}</span>
                        : <span className="capitalize">{lead.origem || '—'}</span>
                      }
                    </span>
                  </td>
                  <td className="px-4 py-4"><NeonStatusBadge status={lead.status} /></td>
                  <td className="px-4 py-4"><LeadPipelineStages completedActions={getDerivedActions(lead, actionsByLead[lead.id] || [])} /></td>
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
                        title="Mais informações"
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
                                toast.success('Lead descoletado — voltou para Leads Webinar');
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


      <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Trocar Responsável')}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Lead: <span className="font-semibold text-foreground">{reassignLead?.nome}</span>
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
            <button
              onClick={() => { setReassignDialogOpen(false); setReassignLead(null); setReassignTo(''); }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('Cancelar')}
            </button>
            <button
              onClick={handleReassign}
              disabled={!reassignTo || reassignTo === reassignLead?.assigned_to}
              className="px-4 py-2 bg-foreground text-background text-sm font-bold rounded-lg hover:bg-foreground/90 transition-all disabled:opacity-40"
            >
              {t('Confirmar Troca')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaleDialog
        open={saleDialogOpen}
        onOpenChange={setSaleDialogOpen}
        onConfirm={handleSaleConfirm}
        leadName={saleDialogLead?.nome || ''}
      />

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
    </div>
  );
}
