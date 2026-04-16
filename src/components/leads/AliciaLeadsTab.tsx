import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import { Button } from '@/components/ui/button';
import { Search, Instagram, MessageCircle, CheckCircle, AlertTriangle, X, ChevronDown, ChevronUp, Edit2, Globe, Briefcase, ExternalLink, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EditLeadDialog } from '@/components/leads/EditLeadDialog';
import { NeonInput, NeonStatusBadge, LeadAvatar, NeonTableWrapper, NeonPagination } from './NeonLeadComponents';
import { useLanguage } from '@/contexts/LanguageContext';

interface AliciaLeadsTabProps {
  leads: any[];
  isLoading: boolean;
  profileMap?: Record<string, string>;
}

export function AliciaLeadsTab({ leads, isLoading, profileMap }: AliciaLeadsTabProps) {
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
        queryClient.invalidateQueries({ queryKey: ['leads'] });
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

  return (
    <div>
      <div className="px-4 md:px-6 py-4 md:py-5">
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-4">
          <div className="flex-1 max-w-sm">
            <NeonInput icon={Search} placeholder={t('Buscar nome...')} value={nameFilter} onChange={e => setNameFilter(e.target.value)} />
          </div>
        </div>
      </div>

      {filtered.some(l => l.status === 'novo') && (
        <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          {filtered.filter(l => l.status === 'novo').length} leads Alicia novos aguardando coleta
        </div>
      )}

      {/* Desktop Table View */}
      <NeonTableWrapper>
        <table className="w-full hidden md:table">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">NOME</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">INSTA</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">FATURAMENTO</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">ORIGEM</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">DATA</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">STATUS</th>
              <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">AÇÕES</th>
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
                    <div className="flex items-center gap-2">
                       {lead.instagram && (
                        <a href={`https://instagram.com/${lead.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#833AB4] hover:opacity-80 transition-opacity">
                          <Instagram size={14} className="text-white" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-foreground">{lead.facturacion_mensual || '—'}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                      {lead.source_tag || 'FORMS ALICIA'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    {lead.created_at ? format(parseISO(lead.created_at), "dd MMM", { locale: ptBR }) : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <NeonStatusBadge status={lead.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                        className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
                      >
                        {expandedId === lead.id ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} />}
                      </button>
                      <button
                        onClick={() => { setEditLead(lead); setEditDialogOpen(true); }}
                        className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 size={16} />
                      </button>
                      {!lead.assigned_to && (
                        <Button
                          size="sm"
                          onClick={() => handleCollect(lead)}
                          disabled={collectingId === lead.id}
                          className="h-9 px-4 rounded-xl text-xs font-bold"
                        >
                          <CheckCircle size={14} className="mr-2" />
                          {collectingId === lead.id ? '...' : 'Coletar'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>

                {expandedId === lead.id && (
                  <tr className="bg-muted/10">
                    <td colSpan={7} className="px-6 py-6 animate-in fade-in slide-in-from-top-2 duration-200">
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
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Tiempo para resultados</p>
                          <p className="text-sm font-medium text-foreground">{lead.tiempo_resultados || '—'}</p>
                        </div>
                        <div className="lg:col-span-2">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 text-primary font-bold">Mayor obstáculo</p>
                          <p className="text-sm font-medium text-foreground leading-relaxed">{lead.mayor_obstaculo || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">País</p>
                          <p className="text-sm font-medium text-foreground">{lead.pais || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Área de Atividade</p>
                          <p className="text-sm font-medium text-foreground">{lead.area_de_atividade || '—'}</p>
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

      <EditLeadDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        lead={editLead}
        tableName="leads_alicia"
      />
    </div>
  );
}
