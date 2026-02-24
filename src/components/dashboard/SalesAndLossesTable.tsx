import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ExternalLink, TrendingUp, XCircle, FileText, Filter, CalendarIcon } from 'lucide-react';
import { TEAM_MEMBERS } from '@/contexts/ProfileSelectorContext';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

interface SalesAndLossesTableProps {
    leads: any[];
    isAdmin: boolean;
    selectedSellerId?: string;
    currentUserId?: string;
}

const profileMap = Object.fromEntries(TEAM_MEMBERS.map(p => [p.id, p.full_name]));

const fmtDate = (d: string | null | undefined) => {
    if (!d) return '—';
    try { return format(parseISO(d), "dd/MM/yy HH'h'mm", { locale: ptBR }); }
    catch { return '—'; }
};

const fmtBRL = (v: number | null | undefined) =>
    v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '—';

const parseLostReason = (notes: string | null | undefined): string => {
    if (!notes) return '—';
    const match = notes.match(/\[PERDIDO\]\s*(.+)/s);
    return match ? match[1].trim() : notes.trim();
};

const PAYMENT_LABELS: Record<string, string> = {
    boleto: 'Boleto',
    hubla: 'HUBLA',
    hubla_boleto: 'HUBLA + Boleto',
};

// Parseia o payment_method que pode ser uma string simples ou JSON (hubla_boleto)
const parsePaymentMethod = (pm: string | null | undefined): {
    type: string;
    hubla_entrada?: number;
    boleto_parcelado?: number;
} | null => {
    if (!pm) return null;
    try {
        const parsed = JSON.parse(pm);
        if (parsed && parsed.type) return parsed;
    } catch {
        // não é JSON, é string simples (boleto/hubla)
    }
    return { type: pm };
};

const COMMISSION_RATE = 0.075;

export function SalesAndLossesTable({
    leads,
    isAdmin,
    selectedSellerId = 'all',
    currentUserId,
}: SalesAndLossesTableProps) {
    const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null);

    // Filtros
    const [filterSeller, setFilterSeller] = useState('all');
    const [filterPayment, setFilterPayment] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const NEON_GREEN = '#00ff9d';

    const sellers = useMemo(() =>
        TEAM_MEMBERS.filter(p => p.role !== 'ADMIN'),
        []
    );

    const applyBaseFilter = (list: any[]) => {
        if (!isAdmin && currentUserId) return list.filter(l => l.assigned_to === currentUserId);
        if (isAdmin && selectedSellerId !== 'all') return list.filter(l => l.assigned_to === selectedSellerId);
        return list;
    };

    const applyLocalFilters = (list: any[]) => {
        return list.filter(lead => {
            if (isAdmin && filterSeller !== 'all' && lead.assigned_to !== filterSeller) return false;
            if (filterPayment !== 'all') {
                const parsed = parsePaymentMethod(lead.payment_method);
                if (!parsed || parsed.type !== filterPayment) return false;
            }
            if (dateRange?.from && lead.last_action_at) {
                try {
                    if (!isWithinInterval(parseISO(lead.last_action_at), {
                        start: startOfDay(dateRange.from),
                        end: endOfDay(dateRange.to ?? dateRange.from),
                    })) return false;
                } catch { /* ignora datas inválidas */ }
            }
            return true;
        });
    };

    const wonLeads = useMemo(() => {
        const base = applyBaseFilter(
            leads.filter(l => l.status === 'fechado_call' || l.status === 'fechado_followup')
        ).sort((a, b) => new Date(b.last_action_at || 0).getTime() - new Date(a.last_action_at || 0).getTime());
        return applyLocalFilters(base);
    }, [leads, selectedSellerId, currentUserId, filterSeller, filterPayment, dateRange]);

    const lostLeads = useMemo(() => {
        const base = applyBaseFilter(
            leads.filter(l => l.status === 'perdido')
        ).sort((a, b) => new Date(b.last_action_at || 0).getTime() - new Date(a.last_action_at || 0).getTime());
        return applyLocalFilters(base);
    }, [leads, selectedSellerId, currentUserId, filterSeller, filterPayment, dateRange]);

    const hasFilters = filterSeller !== 'all' || filterPayment !== 'all' || !!dateRange?.from;

    // Comissões: por vendedora (7,5% do cash-in)
    const commissionSummary = useMemo(() => {
        if (wonLeads.length === 0) return [];

        const bySellerMap: Record<string, { name: string; totalCash: number; count: number }> = {};

        wonLeads.forEach(lead => {
            const sellerId = lead.assigned_to || 'sem_vendedora';
            const sellerName = lead.assigned_to ? (profileMap[lead.assigned_to] || sellerId) : 'Sem vendedora';
            const cash = Number(lead.cash_value) || 0;
            if (!bySellerMap[sellerId]) {
                bySellerMap[sellerId] = { name: sellerName, totalCash: 0, count: 0 };
            }
            bySellerMap[sellerId].totalCash += cash;
            bySellerMap[sellerId].count += 1;
        });

        return Object.values(bySellerMap).map(s => ({
            ...s,
            commission: s.totalCash * COMMISSION_RATE,
        }));
    }, [wonLeads]);

    const totalCashAll = commissionSummary.reduce((sum, s) => sum + s.totalCash, 0);
    const totalCommissionAll = commissionSummary.reduce((sum, s) => sum + s.commission, 0);
    const colSpanVendas = isAdmin ? 8 : 7;

    return (
        <>
            {/* Modal de comprovante */}
            {comprovanteUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setComprovanteUrl(null)}
                >
                    <div
                        className="relative max-w-2xl w-full mx-4 rounded-2xl overflow-hidden bg-background shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <span className="text-sm font-semibold">Comprovante</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" asChild>
                                    <a href={comprovanteUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Abrir
                                    </a>
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setComprovanteUrl(null)}>✕</Button>
                            </div>
                        </div>
                        {(comprovanteUrl.toLowerCase().includes('.pdf') || comprovanteUrl.toLowerCase().includes('pdf')) ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <FileText className="w-12 h-12 text-red-400" />
                                <p className="text-sm text-muted-foreground">PDF — clique em "Abrir" para visualizar</p>
                            </div>
                        ) : (
                            <img src={comprovanteUrl} alt="Comprovante" className="w-full max-h-[70vh] object-contain p-2" />
                        )}
                    </div>
                </div>
            )}

            <Card className="border-none" style={{ boxShadow: `0 0 20px rgba(0,255,157,0.06)` }}>
                <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" style={{ color: NEON_GREEN, filter: `drop-shadow(0 0 4px ${NEON_GREEN})` }} />
                            Registro de Vendas e Perdidos
                        </CardTitle>

                        {/* Filtros */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />

                            {/* Vendedora (só admin vê) */}
                            {isAdmin && (
                                <Select value={filterSeller} onValueChange={setFilterSeller}>
                                    <SelectTrigger className="h-8 w-[160px] text-xs">
                                        <SelectValue placeholder="Vendedora" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas vendedoras</SelectItem>
                                        {sellers.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Método de pagamento */}
                            <Select value={filterPayment} onValueChange={setFilterPayment}>
                                <SelectTrigger className="h-8 w-[150px] text-xs">
                                    <SelectValue placeholder="Pagamento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="boleto">Boleto</SelectItem>
                                    <SelectItem value="hubla">HUBLA</SelectItem>
                                    <SelectItem value="hubla_boleto">HUBLA + Boleto</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Date range picker */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`h-8 text-xs gap-1.5 ${dateRange?.from ? 'text-foreground' : 'text-muted-foreground'}`}
                                    >
                                        <CalendarIcon className="w-3.5 h-3.5" />
                                        {dateRange?.from ? (
                                            dateRange.to
                                                ? `${format(dateRange.from, 'dd/MM/yy')} → ${format(dateRange.to, 'dd/MM/yy')}`
                                                : format(dateRange.from, 'dd/MM/yy')
                                        ) : 'Período'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={2}
                                        locale={ptBR}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            {hasFilters && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs text-muted-foreground"
                                    onClick={() => { setFilterSeller('all'); setFilterPayment('all'); setDateRange(undefined); }}
                                >
                                    Limpar
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Tabs defaultValue="vendas">
                        <div className="px-4 pt-2 pb-0">
                            <TabsList className="w-full sm:w-auto">
                                <TabsTrigger value="vendas" className="flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    Vendas
                                    <Badge className="ml-1 text-xs px-1.5 py-0" style={{ background: NEON_GREEN, color: '#000' }}>
                                        {wonLeads.length}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="perdidos" className="flex items-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Perdidos
                                    <Badge className="ml-1 text-xs px-1.5 py-0" variant="destructive">
                                        {lostLeads.length}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* ABA VENDAS */}
                        <TabsContent value="vendas" className="mt-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Lead</TableHead>
                                        {isAdmin && <TableHead>Vendedora</TableHead>}
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Pagamento</TableHead>
                                        <TableHead className="text-right">Bruto</TableHead>
                                        <TableHead className="text-right">Cash-in</TableHead>
                                        <TableHead>Comprovante</TableHead>
                                        <TableHead>Data</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {wonLeads.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={colSpanVendas} className="text-center py-10 text-muted-foreground">
                                                Nenhuma venda encontrada
                                            </TableCell>
                                        </TableRow>
                                    ) : wonLeads.map(lead => (
                                        <TableRow key={lead.id}>
                                            <TableCell className="font-medium">{lead.nome}</TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {lead.assigned_to ? profileMap[lead.assigned_to] || '—' : '—'}
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                    style={lead.status === 'fechado_call'
                                                        ? { borderColor: NEON_GREEN, color: NEON_GREEN }
                                                        : { borderColor: 'hsl(280,70%,60%)', color: 'hsl(280,70%,60%)' }
                                                    }
                                                >
                                                    {lead.status === 'fechado_call' ? 'Call' : 'Follow-up'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {(() => {
                                                    const parsed = parsePaymentMethod(lead.payment_method);
                                                    if (!parsed) return <span className="text-muted-foreground">—</span>;
                                                    const label = PAYMENT_LABELS[parsed.type] || parsed.type;
                                                    if (parsed.type === 'hubla_boleto') {
                                                        return (
                                                            <div className="space-y-0.5">
                                                                <span className="font-medium block">{label}</span>
                                                                {parsed.hubla_entrada != null && (
                                                                    <span className="text-xs text-muted-foreground block">
                                                                        HUBLA: {fmtBRL(parsed.hubla_entrada)}
                                                                    </span>
                                                                )}
                                                                {parsed.boleto_parcelado != null && (
                                                                    <span className="text-xs text-muted-foreground block">
                                                                        Boleto: {fmtBRL(parsed.boleto_parcelado)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    return <span className="font-medium">{label}</span>;
                                                })()}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm font-semibold" style={{ color: NEON_GREEN }}>
                                                {fmtBRL(lead.sale_value)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {fmtBRL(lead.cash_value)}
                                            </TableCell>
                                            <TableCell>
                                                {lead.comprovante_url ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs gap-1"
                                                        onClick={() => setComprovanteUrl(lead.comprovante_url)}
                                                    >
                                                        <FileText className="w-3 h-3" /> Ver
                                                    </Button>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {fmtDate(lead.last_action_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Comissões por vendedora (Apenas para ADM) */}
                            {isAdmin && commissionSummary.length > 0 && (
                                <div className="mx-4 mb-4 mt-2 rounded-xl border border-border overflow-hidden">
                                    <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Comissão por Vendedora — {(COMMISSION_RATE * 100).toFixed(1)}% sobre Cash-in
                                        </p>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border text-xs text-muted-foreground">
                                                <th className="text-left px-4 py-2 font-medium">Vendedora</th>
                                                <th className="text-center px-4 py-2 font-medium">Vendas</th>
                                                <th className="text-right px-4 py-2 font-medium">Total Cash-in</th>
                                                <th className="text-right px-4 py-2 font-medium">Comissão (7,5%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {commissionSummary.map((s, i) => (
                                                <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                    <td className="px-4 py-2.5 font-medium">{s.name}</td>
                                                    <td className="px-4 py-2.5 text-center text-muted-foreground">{s.count}</td>
                                                    <td className="px-4 py-2.5 text-right font-mono">{fmtBRL(s.totalCash)}</td>
                                                    <td className="px-4 py-2.5 text-right font-mono font-semibold" style={{ color: NEON_GREEN }}>
                                                        {fmtBRL(s.commission)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {/* Linha de total */}
                                            <tr className="bg-muted/30 font-bold">
                                                <td className="px-4 py-3 text-sm">Total</td>
                                                <td className="px-4 py-3 text-center text-sm">{wonLeads.length}</td>
                                                <td className="px-4 py-3 text-right font-mono text-sm">{fmtBRL(totalCashAll)}</td>
                                                <td
                                                    className="px-4 py-3 text-right font-mono text-sm"
                                                    style={{ color: NEON_GREEN, textShadow: `0 0 8px ${NEON_GREEN}60` }}
                                                >
                                                    {fmtBRL(totalCommissionAll)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </TabsContent>

                        {/* ABA PERDIDOS */}
                        <TabsContent value="perdidos" className="mt-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Lead</TableHead>
                                        {isAdmin && <TableHead>Vendedora</TableHead>}
                                        <TableHead>Faturamento</TableHead>
                                        <TableHead>Motivo</TableHead>
                                        <TableHead>Data</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lostLeads.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-10 text-muted-foreground">
                                                Nenhum lead perdido encontrado
                                            </TableCell>
                                        </TableRow>
                                    ) : lostLeads.map(lead => (
                                        <TableRow key={lead.id}>
                                            <TableCell className="font-medium">{lead.nome}</TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {lead.assigned_to ? profileMap[lead.assigned_to] || '—' : '—'}
                                                </TableCell>
                                            )}
                                            <TableCell className="text-sm">{lead.faturamento || '—'}</TableCell>
                                            <TableCell className="text-sm max-w-xs">
                                                <span className="text-destructive/80">{parseLostReason(lead.notes)}</span>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {fmtDate(lead.last_action_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    );
}
