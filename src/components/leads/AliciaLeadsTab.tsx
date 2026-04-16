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
  const { selectedProfile, isAdmin, teamMembers } = useProfileSelector();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [nameFilter, setNameFilter] = useState('');
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);

  const filtered = leads.filter(lead => {
    if (nameFilter && !lead.nombre?.toLowerCase().includes(nameFilter.toLowerCase())) return false;
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
        // Log action if needed (assuming lead_actions supports alicia leads too or just skip for now)
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

  const handleWhatsApp = (lead: any) => {
    const phone = lead.whatsapp?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  return (
    <div>
      <div className="px-4 md:px-6 py-4 md:py-5">
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-4">
          <div className="flex-1 max-w-sm">
            <NeonInput icon={Search} placeholder={t('Buscar nome...')} value={nameFilter} onChange={e => setNameFilter(e.target.value)} />
          </div>
          {nameFilter && (
            <button onClick={() => setNameFilter('')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X size={12} /> {t('Limpar')}
            </button>
          )}
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
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">NÚMERO</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">INSTAGRAM</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">ÁREA</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">FATURAMENTO</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">LINK</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">PAÍS</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">DATA</th>
              <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="text-center py-16 text-muted-foreground">{t('Carregando...')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-16 text-muted-foreground">{t('Nenhum lead disponível')}</td></tr>
            ) : filtered.map(lead => (
              <React.Fragment key={lead.id}>
                <tr className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <LeadAvatar name={lead.nombre} />
                      <span className="font-medium text-foreground text-sm">{lead.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground">{lead.whatsapp || '—'}</td>
                  <td className="px-4 py-4">
                    {lead.instagram && (
                      <a href={`https://instagram.com/${lead.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                        <Instagram size={14} /> @{lead.instagram.replace(/^@/, '')}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground max-w-[120px] truncate">{lead.area_de_atividade || lead.nombre_form || '—'}</td>
                  <td className="px-4 py-4 text-xs font-medium text-foreground">{lead.facturacion_mensual || '—'}</td>
                  <td className="px-4 py-4">
                    {lead.whatsapp && (
                      <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-[10px]">
                        <ExternalLink size={10} /> Link WA
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">{lead.pais || '—'}</td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    {lead.created_at ? format(parseISO(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
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
                          className="h-8 rounded-lg text-xs"
                        >
                          <CheckCircle size={14} className="mr-1" />
                          {collectingId === lead.id ? '...' : 'Coletar'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
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
