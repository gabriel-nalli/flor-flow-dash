import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Projeção explícita: buscamos só as colunas que a UI / CSV / diálogos realmente
// usam (26 das 28 — fora `meeting_datetime` e `meeting_owner`, que ninguém lê).
// Mais importante que cortar bytes: garante UMA forma de objeto no cache para
// TODAS as páginas, então navegar entre Dashboard/Leads/Meta/Funil reaproveita
// o mesmo ['leads'] em vez de rebaixar tudo de novo a cada troca de aba.
//
// `as any` no from(): o types.ts gerado está desatualizado (faltam tag_manual,
// momento_atual, valor_investimento, comprovante_url, payment_method), mas essas
// colunas EXISTEM no banco. Sem o cast, listá-las quebraria a tipagem do select.
const LEADS_COLUMNS =
  'id,created_at,nome,whatsapp,email,instagram,faturamento,origem,webinar_date_tag,assigned_to,status,last_action_at,next_followup_date,sale_status,sale_value,cash_value,notes,profissao,maior_dificuldade,renda_familiar,quem_investe,comprovante_url,payment_method,tag_manual,momento_atual,valor_investimento';

// lead_actions tem ~4.4k linhas; pegamos só as 4 colunas que a UI realmente usa.
const LEAD_ACTIONS_COLUMNS = 'lead_id,action_type,user_id,created_at';

/**
 * Fonte única dos leads. Todas as páginas usam a MESMA queryKey ['leads'],
 * então navegar entre elas reaproveita o cache em vez de rebaixar tudo de novo.
 */
export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data } = await (supabase.from('leads') as any)
        .select(LEADS_COLUMNS)
        .order('created_at', { ascending: false });
      return (data as any[]) || [];
    },
  });
}

/** Fonte única das ações de lead, sob a queryKey ['lead_actions']. */
export function useLeadActions() {
  return useQuery({
    queryKey: ['lead_actions'],
    queryFn: async () => {
      const { data } = await supabase.from('lead_actions').select(LEAD_ACTIONS_COLUMNS);
      return data || [];
    },
  });
}
