import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import { Button } from '@/components/ui/button';
import { Search, Instagram, MessageCircle, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Edit2, ExternalLink, User } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EditLeadDialog } from '@/components/leads/EditLeadDialog';
import { NeonInput, NeonStatusBadge, LeadAvatar, NeonTableWrapper, NeonPagination } from './NeonLeadComponents';
import { useLanguage } from '@/contexts/LanguageContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AliciaLeadsTabProps {
  leads: any[];
  isLoading: boolean;
  profileMap?: Record<string, string>;
  vendedoras?: any[];
}

export function AliciaLeadsTab({ leads, isLoading, profileMap, vendedoras = [] }: AliciaLeadsTabProps) {
  const { selectedProfile, isAdmin } = useProfileSelector();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [nameFilter, setNameFilter] = useState('');
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);

  const filtered = leads.filter(lead => {
    const nome = lead.nombre || lead.nome || '';
    if (nameFilter && !nome.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    return true;
  });

  const handleCollect = async (lead: any) => {
    setCollectingId(lead.id);
    try {
      const { data, error } = await supabase
        .from('leads_alicia')
        .update({ assigned_to: selectedProfile.id, last_action_at: new Date().toISOString() } as any)
        .eq('id', lead.id)
        .is('assigned_to', null)
        .select();
      if (error) throw error;
      if (data && data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['leads_alicia'] });
        toast.success('Lead Alicia coletado com sucesso! ✅');
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

  const handleStatusChange = async (lead: any, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads_alicia')
        .update({ status: newStatus, last_action_at: new Date().toISOString() } as any)
        .eq('id', lead.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['leads_alicia'] });
      toast.success(`Status atualizado para ${newStatus}`);
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const formatWhatsAppLink = (phone: string) => {
    if (!phone) return '—';
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  return (
    <div>
      <div className="px-4 md:px-6 py-4 md:py-5">
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-4">
          <div className="flex-1 max-w-sm">
            <NeonInput icon={Search} placeholder={t('Buscar na central da Alicia...')} value={nameFilter} onChange={e => setNameFilter(e.target.value)} />
          </div>
        </div>
      </div>

      <NeonTableWrapper>
        <div className="overflow-x-auto">
          <table className="w-full hidden md:table min-w-[1200px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">NOME</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-4">NUMERO</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-4">ÁREA</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-4">FATURAMENTO</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-4">LINK WA</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-4">PAÍS</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-4">STATUS / RESPONSÁVEL</th>
                <th className="text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-4">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-16 text-muted-foreground">{t('Carregando...')}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-muted-foreground">Nenhum lead Alicia por aqui</td></tr>
              ) : filtered.map(lead => {
                const waLink = formatWhatsAppLink(lead.whatsapp);
                return (
                  <React.Fragment key={lead.id}>
                    <tr className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <LeadAvatar name={lead.nombre} />
                          <div className="flex flex-col">
                             <span className="font-medium text-foreground text-sm whitespace-nowrap">{lead.nombre}</span>
                             {lead.instagram && <span className="text-[10px] text-muted-foreground">@{lead.instagram.replace(/^@/, '')}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-foreground whitespace-nowrap">{lead.whatsapp || '—'}</td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-foreground truncate max-w-[150px] inline-block" title={lead.area_de_atividade}>
                          {lead.area_de_atividade || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-semibold text-foreground bg-muted/50 px-2 py-1 rounded">
                          {lead.facturacion_mensual || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {lead.whatsapp ? (
                          <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1 max-w-[150px] truncate">
                            <ExternalLink size={10} /> {waLink}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-muted-foreground">{lead.pais || '—'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <NeonStatusBadge status={lead.status} />
                          {lead.assigned_to && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <User size={10} /> {profileMap?.[lead.assigned_to] || 'Vendedora'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
                          >
                            {expandedId === lead.id ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} />}
                          </button>
                          
                          {lead.assigned_to === selectedProfile.id || isGlobalAdminView ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
                                  <Edit2 size={16} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => { setEditLead(lead); setEditDialogOpen(true); }}>
                                  {t('Editar Lead')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleStatusChange(lead, 'contato_1_feito')}>Marcar 1º Contato</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(lead, 'agendado')}>Agendar Reunião</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(lead, 'perdido')} className="text-destructive">Lead Perdido</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : !lead.assigned_to && (
                            <Button
                              size="sm"
                              onClick={() => handleCollect(lead)}
                              disabled={collectingId === lead.id}
                              className="h-8 px-3 rounded-xl text-xs font-bold"
                            >
                              Coletar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expandedId === lead.id && (
                      <tr className="bg-muted/10">
                        <td colSpan={8} className="px-10 py-8 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Tiempo de experiencia</p>
                              <p className="text-sm font-medium text-foreground">{lead.tiempo_experiencia || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Cantidad de empleados</p>
                              <p className="text-sm font-medium text-foreground">{lead.cantidad_empleados || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Plan concreto</p>
                              <p className="text-sm font-medium text-foreground">{lead.plan_concreto || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">PAÍS</p>
                              <p className="text-sm font-bold text-primary">{lead.pais || '—'}</p>
                            </div>
                            <div className="lg:col-span-2 bg-background/50 p-4 rounded-xl border border-white/5">
                              <p className="text-[10px] uppercase font-bold text-primary mb-2">Mayor obstáculo</p>
                              <p className="text-sm font-medium text-foreground leading-relaxed">{lead.mayor_obstaculo || '—'}</p>
                            </div>
                            <div className="lg:col-span-2">
                               <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Área de Atuación</p>
                               <p className="text-sm font-bold text-primary">{lead.area_de_atividade || '—'}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <NeonPagination showing={filtered.length} total={leads.length} />
      </NeonTableWrapper>

      <EditLeadDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        lead={editLead}
        tableName="leads_alicia"
      />
    </div>
  );
}
