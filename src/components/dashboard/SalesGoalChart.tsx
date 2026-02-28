import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ADMIN_GOAL = 200000;
const SELLER_GOAL = 50000;

interface NeonGaugeProps {
  percentage: number;
  label: string;
  subLabel: string;
  color: 'green' | 'purple';
}

function NeonGauge({ percentage, label, subLabel, color }: NeonGaugeProps) {
  const radius = 120;
  const stroke = 15;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const theme = {
    green: { primary: '#00ff9d', secondary: '#00cc7a' },
    purple: { primary: '#d946ef', secondary: '#c026d3' },
  }[color];

  return (
    <div className="flex flex-col items-center group cursor-default">
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90 overflow-visible"
        >
          <defs>
            <filter id={`neon-glow-${color}`} x="-100%" y="-100%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={theme.primary}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 1.5s ease-out',
              strokeLinecap: 'round',
              filter: `url(#neon-glow-${color})`,
            }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center space-y-1">
          <span className="text-6xl font-black tracking-tighter text-foreground">
            {percentage}%
          </span>
          <span className="text-sm text-muted-foreground font-bold uppercase tracking-widest opacity-80">
            da meta
          </span>
        </div>
      </div>
      <div className="mt-8 text-center">
        <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-[0.2em] mb-2">
          {label}
        </h3>
        <p
          className="text-3xl font-bold tracking-tight"
          style={{
            color: theme.primary,
            textShadow: `0 0 20px ${theme.primary}66`,
          }}
        >
          {subLabel}
        </p>
      </div>
    </div>
  );
}

interface SalesGoalChartProps {
  leads: any[];
  isAdmin: boolean;
  selectedSellerId?: string;
  onSellerChange?: (id: string) => void;
}

export function SalesGoalChart({ leads, isAdmin, selectedSellerId = 'all', onSellerChange }: SalesGoalChartProps) {
  const GOAL = isAdmin ? ADMIN_GOAL : SELLER_GOAL;

  // Busca os perfis REAIS do banco (IDs corretos para cruzar com assigned_to dos leads)
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*');
      return data || [];
    },
  });

  const sellers = profiles.filter((p: any) => p.role !== 'ADMIN' && p.full_name);

  const wonLeads = useMemo(() =>
    leads.filter(l => l.sale_status === 'won_call' || l.sale_status === 'won_followup'),
    [leads]
  );

  const stats = useMemo(() => {
    const filtered = selectedSellerId === 'all'
      ? wonLeads.filter(l => !!l.assigned_to)
      : wonLeads.filter(l => l.assigned_to === selectedSellerId);

    const totalBruto = filtered.reduce((sum, l) => sum + (Number(l.sale_value) || 0), 0);
    const totalCash = filtered.reduce((sum, l) => sum + (Number(l.cash_value) || 0), 0);
    const count = filtered.length;

    return { totalBruto, totalCash, count };
  }, [wonLeads, selectedSellerId]);

  const pctBruto = Math.min(Math.round((stats.totalBruto / GOAL) * 100), 100);
  const pctCash = Math.min(Math.round((stats.totalCash / GOAL) * 100), 100);

  const sellerStats = useMemo(() => {
    if (!isAdmin) return [];
    return sellers.map(s => {
      const sLeads = wonLeads.filter(l => l.assigned_to === s.id);
      return {
        ...s,
        bruto: sLeads.reduce((sum, l) => sum + (Number(l.sale_value) || 0), 0),
        cash: sLeads.reduce((sum, l) => sum + (Number(l.cash_value) || 0), 0),
        count: sLeads.length,
      };
    });
  }, [wonLeads, isAdmin, sellers]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-end flex-wrap gap-3">
        {isAdmin && onSellerChange && (
          <Select value={selectedSellerId} onValueChange={onSellerChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar vendedora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {sellers.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-16 items-center justify-center py-8">
          <NeonGauge
            percentage={pctBruto}
            label="Venda Bruta"
            subLabel={`R$ ${stats.totalBruto.toLocaleString('pt-BR')}`}
            color="green"
          />
          <NeonGauge
            percentage={pctCash}
            label="Cash-in (Líquido)"
            subLabel={`R$ ${stats.totalCash.toLocaleString('pt-BR')}`}
            color="green"
          />
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          {stats.count} venda{stats.count !== 1 ? 's' : ''} registrada{stats.count !== 1 ? 's' : ''} — Meta: R$ {GOAL.toLocaleString('pt-BR')}
        </div>

        {isAdmin && selectedSellerId === 'all' && sellerStats.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Por Vendedora</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sellerStats.map(s => (
                <div key={s.id} className="p-3 rounded-lg bg-muted/20 space-y-1">
                  <p className="text-sm font-semibold">{s.full_name}</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Bruto:</span>
                    <span className="font-medium tabular-nums">R$ {s.bruto.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Cash-in:</span>
                    <span className="font-medium tabular-nums" style={{ color: '#00ff9d' }}>R$ {s.cash.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Vendas:</span>
                    <span className="font-medium">{s.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
