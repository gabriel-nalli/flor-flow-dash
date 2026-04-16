import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, UserCheck, Download, Plus } from 'lucide-react';
import { WebinarLeadsTab } from '@/components/leads/WebinarLeadsTab';
import { AliciaLeadsTab } from '@/components/leads/AliciaLeadsTab';
import { MyLeadsTab } from '@/components/leads/MyLeadsTab';
import { NewLeadDialog } from '@/components/leads/NewLeadDialog';
import { SalesGoalChart } from '@/components/dashboard/SalesGoalChart';

export default function Leads() {
  const { selectedProfile, isAdmin } = useProfileSelector();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('meus');
  const [newLeadOpen, setNewLeadOpen] = useState(false);

  // Query Thaylor leads
  const { data: allLeads = [], isLoading: thaylorLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Query Alicia leads
  const { data: aliciaLeads = [], isLoading: aliciaLoading } = useQuery({
    queryKey: ['leads_alicia'],
    queryFn: async () => {
      const { data } = await supabase.from('leads_alicia').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Query Lead Actions (Histórico) - IMPORTANTE PARA EVITAR TELA PRETA
  const { data: leadActions = [] } = useQuery({
    queryKey: ['lead_actions'],
    queryFn: async () => {
      const { data } = await supabase.from('lead_actions').select('*');
      return data || [];
    },
  });

  const actionsByLead = useMemo(() => {
    const map: Record<string, string[]> = {};
    leadActions.forEach(action => {
      if (!map[action.lead_id]) map[action.lead_id] = [];
      map[action.lead_id].push(action.action_type);
    });
    return map;
  }, [leadActions]);

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles_dash'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles_dash').select('id, full_name, role');
      return data || [];
    },
  });

  const profileMap = useMemo(() =>
    Object.fromEntries(profiles.map(p => [p.id, p.full_name || 'Sem nome'])),
    [profiles]
  );

  const isGlobalAdminView = isAdmin && selectedProfile.role === 'ADMIN';

  const myThaylorLeads = isGlobalAdminView
    ? allLeads.filter(l => !!l.assigned_to)
    : allLeads.filter(l => l.assigned_to === selectedProfile.id);

  const availableThaylorLeads = allLeads.filter(l => !l.assigned_to);

  const aliciaLeadsTabContent = isGlobalAdminView
    ? aliciaLeads
    : aliciaLeads.filter(l => !l.assigned_to || l.assigned_to === selectedProfile.id);

  const totalLeadsCount = allLeads.length + aliciaLeads.length;
  const coletadosCount = allLeads.filter(l => !!l.assigned_to).length + aliciaLeads.filter(l => !!l.assigned_to).length;
  const pendentesCount = availableThaylorLeads.length + aliciaLeads.filter(l => !l.assigned_to).length;

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">{t('Meta de Vendas')}</h2>
          <SalesGoalChart leads={allLeads} isAdmin={false} selectedSellerId={selectedProfile.id} />
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">{t('Gerenciar Leads')}</h1>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></span>
              {t('Total:')} <span className="font-bold text-foreground">{totalLeadsCount}</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs text-green-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"></span>
              {t('Coletados:')} <span className="font-bold text-green-500">{coletadosCount}</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs text-amber-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]"></span>
              {t('Pendentes:')} <span className="font-bold text-amber-500">{pendentesCount}</span>
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setNewLeadOpen(true)}
            className="flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-4 py-2 rounded-lg transition-all text-sm font-bold"
          >
            <Plus size={14} />
            {t('Novo Lead')}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl overflow-hidden shadow-xl border border-white/5">
        <div className="flex bg-background/50 border-b border-white/5">
          <TabButton active={activeTab === 'meus'} onClick={() => setActiveTab('meus')}>
            {isGlobalAdminView ? 'Leads Coletados Thaylor' : 'Meus Leads Thaylor'}
          </TabButton>
          <TabButton active={activeTab === 'webinar'} onClick={() => setActiveTab('webinar')}>
            Leads Disponíveis
          </TabButton>
          <TabButton active={activeTab === 'alicia'} onClick={() => setActiveTab('alicia')}>
            Leads Alicia
          </TabButton>
        </div>

        <div className="p-0">
          {activeTab === 'meus' && (
            <MyLeadsTab
              leads={myThaylorLeads}
              isLoading={thaylorLoading}
              actionsByLead={actionsByLead}
              profileMap={profileMap}
              allLeads={allLeads}
            />
          )}

          {activeTab === 'webinar' && (
            <WebinarLeadsTab
              leads={availableThaylorLeads}
              isLoading={thaylorLoading}
            />
          )}

          {activeTab === 'alicia' && (
            <AliciaLeadsTab
              leads={aliciaLeadsTabContent}
              isLoading={aliciaLoading}
              profileMap={profileMap}
              vendedoras={profiles}
            />
          )}
        </div>
      </div>

      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
    </div>
  );
}

function TabButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-6 py-4 text-xs font-bold transition-all relative flex items-center ${active ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground/70'
        }`}
    >
      {children}
    </button>
  );
}
