import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SalesGoalChart } from '@/components/dashboard/SalesGoalChart';
import { SalesAndLossesTable } from '@/components/dashboard/SalesAndLossesTable';

export default function SalesGoal() {
  const { selectedProfile, isAdmin } = useProfileSelector();
  const { t } = useLanguage();
  const [goalSeller, setGoalSeller] = useState('all');

  const { data: leads = [] } = useQuery({
    queryKey: ['sales-goal-leads'],
    queryFn: async () => {
      const { data } = await supabase.from('leads').select('*');
      return data || [];
    },
  });

  const visibleLeads = isAdmin ? leads : leads.filter(l => l.assigned_to === selectedProfile.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('Meta de Vendas')}</h1>
        <p className="text-muted-foreground">
          {isAdmin ? t('Visão geral do time') : `Meta de ${selectedProfile.full_name}`}
        </p>
      </div>
      <SalesGoalChart
        leads={isAdmin ? leads : visibleLeads}
        isAdmin={isAdmin}
        selectedSellerId={isAdmin ? goalSeller : selectedProfile.id}
        onSellerChange={isAdmin ? setGoalSeller : undefined}
      />
      <SalesAndLossesTable
        leads={isAdmin ? leads : visibleLeads}
        isAdmin={isAdmin}
        selectedSellerId={isAdmin ? goalSeller : selectedProfile.id}
        currentUserId={isAdmin ? undefined : selectedProfile.id}
      />
    </div>
  );
}
