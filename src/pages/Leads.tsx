import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import { Users, UserCheck, Download, Plus } from 'lucide-react';
import { WebinarLeadsTab } from '@/components/leads/WebinarLeadsTab';
import { MyLeadsTab } from '@/components/leads/MyLeadsTab';
import { NewLeadDialog } from '@/components/leads/NewLeadDialog';
import { SalesGoalChart } from '@/components/dashboard/SalesGoalChart';

export default function Leads() {
  const { selectedProfile, isAdmin } = useProfileSelector();
  const [activeTab, setActiveTab] = useState('meus');
  const [newLeadOpen, setNewLeadOpen] = useState(false);

  const { data: allLeads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: allActions = [] } = useQuery({
    queryKey: ['lead_actions'],
    queryFn: async () => {
      const { data } = await supabase.from('lead_actions').select('lead_id, action_type');
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, role');
      return data || [];
    },
  });

  const profileMap = useMemo(() =>
    Object.fromEntries(profiles.map(p => [p.id, p.full_name || 'Sem nome'])),
    [profiles]
  );

  const actionsByLead: Record<string, string[]> = {};
  allActions.forEach((a) => {
    if (a.lead_id) {
      if (!actionsByLead[a.lead_id]) actionsByLead[a.lead_id] = [];
      if (!actionsByLead[a.lead_id].includes(a.action_type || '')) {
        actionsByLead[a.lead_id].push(a.action_type || '');
      }
    }
  });

  const webinarLeads = allLeads.filter(l => !l.assigned_to);
  const collectedLeads = allLeads.filter(l => !!l.assigned_to);
  const myLeads = isAdmin
    ? collectedLeads
    : allLeads.filter(l => l.assigned_to === selectedProfile.id);

  const totalLeads = isAdmin ? allLeads.length : myLeads.length;
  const coletados = collectedLeads.length;
  const pendentes = webinarLeads.length;

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Meta de Vendas</h2>
          <SalesGoalChart leads={allLeads} isAdmin={false} selectedSellerId={selectedProfile.id} />
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Gerenciar Leads</h1>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></span>
              {isAdmin ? 'Total' : 'Meus Leads'}: <span className="font-bold text-foreground">{totalLeads}</span>
            </span>
            {isAdmin && (
              <>
                <span className="flex items-center gap-1.5 text-xs text-green-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"></span>
                  Coletados: <span className="font-bold text-green-500">{coletados}</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs text-amber-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]"></span>
                  Pendentes: <span className="font-bold text-amber-500">{pendentes}</span>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => {
                const headers = ['Nome', 'WhatsApp', 'Email', 'Instagram', 'Faturamento', 'Origem', 'Status', 'Responsável', 'Venda', 'Valor Venda', 'Valor Cash', 'Webinar Tag', 'Criado em'];
                const rows = allLeads.map(l => [
                  l.nome,
                  l.whatsapp || '',
                  l.email || '',
                  l.instagram || '',
                  l.faturamento ?? '',
                  l.origem || '',
                  l.status || '',
                  l.assigned_to || '',
                  l.sale_status || '',
                  l.sale_value ?? '',
                  l.cash_value ?? '',
                  l.webinar_date_tag || '',
                  l.created_at || '',
                ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
                const csv = [headers.join(','), ...rows].join('\n');
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg transition-all text-sm font-medium"
            >
              <Download size={14} />
              Exportar
            </button>
          )}
          <button
            onClick={() => setNewLeadOpen(true)}
            className="flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-4 py-2 rounded-lg transition-all text-sm font-bold"
          >
            <Plus size={14} />
            Novo Lead
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab('meus')}
            className={`px-6 py-4 text-sm font-semibold transition-all relative ${activeTab === 'meus'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground/70'
              }`}
          >
            {isAdmin ? 'Leads Coletados' : 'Meus Leads'}
            {activeTab === 'meus' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('webinar')}
            className={`px-6 py-4 text-sm font-semibold transition-all relative ${activeTab === 'webinar'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground/70'
              }`}
          >
            Leads Webinar
            {activeTab === 'webinar' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]"></div>
            )}
          </button>
        </div>

        <div>
          {activeTab === 'meus' && (
            <MyLeadsTab leads={myLeads} isLoading={isLoading} actionsByLead={actionsByLead} allLeads={allLeads} profileMap={profileMap} />
          )}
          {activeTab === 'webinar' && (
            <WebinarLeadsTab leads={webinarLeads} isLoading={isLoading} allLeads={allLeads} profileMap={profileMap} />
          )}
        </div>
      </div>

      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
    </div>
  );
}
