import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
    Upload, Calculator, Download, Users, DollarSign,
    ChevronDown, ChevronRight, Info, CheckCircle2, AlertCircle,
    Zap, RefreshCw, Search
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface TmbPayment {
    customer_name: string;
    customer_email: string | null;
    amount: number | null;
    paid_at: string | null;
    product: string | null;
    pedido_id?: number;
    produto_id?: number;
    valor_total?: number;
    parcelas?: number;
    status_pedido?: string;
    status_financeiro?: string;
    telefone?: string;
    documento?: string;
}

interface SellerLead {
    id: string;
    customer_name: string;
    customer_email: string | null;
    seller_name: string;
    product: string | null;
    upload_month: string | null;
}

interface CommissionResult {
    seller_name: string;
    clients: {
        name: string;
        email: string | null;
        amount: number | null;
        paid_at: string | null;
        product: string | null;
        status_financeiro?: string;
        pedido_id?: number;
        parcelas?: number;
        valor_total?: number;
    }[];
    total_amount: number;
    payment_count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalize(str: string | null | undefined): string {
    if (!str) return '';
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function parseCSV(text: string): Record<string, string>[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    return lines.slice(1).map(line => {
        const values = parseCsvLine(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });
        return row;
    });
}

function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') { inQuotes = !inQuotes; }
        else if (line[i] === ',' && !inQuotes) { result.push(current); current = ''; }
        else { current += line[i]; }
    }
    result.push(current);
    return result;
}

function findColumn(row: Record<string, string>, candidates: string[]): string {
    for (const candidate of candidates) {
        const found = Object.keys(row).find(k => normalize(k).includes(normalize(candidate)));
        if (found && row[found]) return row[found];
    }
    return '';
}

function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatCurrency(value: number | null | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatMonth(month: string): string {
    const [year, m] = month.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(m) - 1]}/${year}`;
}

// ─── Match Logic ─────────────────────────────────────────────────────────────
function matchPaymentsToSellers(
    payments: TmbPayment[],
    sellers: SellerLead[]
): CommissionResult[] {
    const resultMap: Record<string, CommissionResult> = {};
    for (const payment of payments) {
        const payEmail = normalize(payment.customer_email);
        const payName = normalize(payment.customer_name);
        let matched: SellerLead | undefined;
        if (payEmail) matched = sellers.find(s => normalize(s.customer_email) === payEmail);
        if (!matched && payName) matched = sellers.find(s => normalize(s.customer_name) === payName);
        if (!matched && payName.length > 4) {
            matched = sellers.find(s => {
                const sName = normalize(s.customer_name);
                return sName.includes(payName) || payName.includes(sName);
            });
        }
        if (!matched) continue;
        const seller = matched.seller_name;
        if (!resultMap[seller]) {
            resultMap[seller] = { seller_name: seller, clients: [], total_amount: 0, payment_count: 0 };
        }
        resultMap[seller].clients.push({
            name: payment.customer_name,
            email: payment.customer_email,
            amount: payment.amount,
            paid_at: payment.paid_at,
            product: payment.product,
            status_financeiro: (payment as TmbPayment).status_financeiro,
            pedido_id: (payment as TmbPayment).pedido_id,
            parcelas: (payment as TmbPayment).parcelas,
            valor_total: (payment as TmbPayment).valor_total,
        });
        resultMap[seller].total_amount += payment.amount || 0;
        resultMap[seller].payment_count += 1;
    }
    return Object.values(resultMap).sort((a, b) => b.total_amount - a.total_amount);
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Commissions() {
    const queryClient = useQueryClient();
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    const [results, setResults] = useState<CommissionResult[]>([]);
    const [expandedSellers, setExpandedSellers] = useState<Set<string>>(new Set());
    const [isCalculating, setIsCalculating] = useState(false);
    const [isFetchingTmb, setIsFetchingTmb] = useState(false);
    const [tmbPayments, setTmbPayments] = useState<TmbPayment[]>([]);

    // Mapping upload
    const [mappingUploadStep, setMappingUploadStep] = useState<'idle' | 'preview' | 'done'>('idle');
    const [mappingPreview, setMappingPreview] = useState<SellerLead[]>([]);

    // Optional CSV payment fallback
    const [paymentUploadStep, setPaymentUploadStep] = useState<'idle' | 'preview' | 'done'>('idle');
    const [paymentPreview, setPaymentPreview] = useState<TmbPayment[]>([]);

    // Date range for TMB fetch
    const [dateStart, setDateStart] = useState(() => `${selectedMonth}-01`);
    const [dateEnd, setDateEnd] = useState(() => {
        const [y, m] = selectedMonth.split('-');
        const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
        return `${selectedMonth}-${lastDay}`;
    });

    const monthOptions = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const handleMonthChange = (m: string) => {
        setSelectedMonth(m);
        const [y, mo] = m.split('-');
        const lastDay = new Date(parseInt(y), parseInt(mo), 0).getDate();
        setDateStart(`${m}-01`);
        setDateEnd(`${m}-${lastDay}`);
        setResults([]);
        setTmbPayments([]);
    };

    // Query existing seller mapping
    const { data: dbSellers = [] } = useQuery<SellerLead[]>({
        queryKey: ['seller_lead_mapping', selectedMonth],
        queryFn: async () => {
            const { data } = await supabase
                .from('seller_lead_mapping')
                .select('*')
                .eq('upload_month', selectedMonth);
            return (data || []) as SellerLead[];
        },
    });

    // ─── Fetch from TMB API ───────────────────────────────────────────────────
    const fetchFromTmb = async () => {
        setIsFetchingTmb(true);
        setResults([]);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const params = new URLSearchParams({
                data_inicio: dateStart,
                data_final: dateEnd,
                efetivado: 'true',
            });
            const res = await fetch(
                `https://vnrfzgbqiagxidcaeanr.supabase.co/functions/v1/tmb-fetch-payments?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setTmbPayments(json.data || []);
            toast.success(`${json.total} pedidos efetivados buscados da TMB! ✅`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro desconhecido';
            toast.error(`Erro ao buscar da TMB: ${msg}`);
        } finally {
            setIsFetchingTmb(false);
        }
    };

    // ─── CSV Upload: Seller Mapping ──────────────────────────────────────────
    const handleSellerCSV = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const rows = parseCSV(text);
            if (!rows.length) { toast.error('CSV vazio ou mal formatado'); return; }
            const parsed: SellerLead[] = rows.map((row, i) => ({
                id: `preview-${i}`,
                customer_name: findColumn(row, ['nome', 'name', 'cliente']),
                customer_email: findColumn(row, ['email', 'e-mail', 'mail']) || null,
                seller_name: findColumn(row, ['vendedora', 'vendedor', 'seller', 'responsavel', 'responsável']),
                product: findColumn(row, ['produto', 'product', 'oferta']) || null,
                upload_month: selectedMonth,
            })).filter(r => r.customer_name && r.seller_name);
            if (!parsed.length) { toast.error('Colunas não identificadas. Verifique: nome, email, vendedora'); return; }
            setMappingPreview(parsed);
            setMappingUploadStep('preview');
        };
        reader.readAsText(file, 'UTF-8');
        e.target.value = '';
    }, [selectedMonth]);

    const saveMappingMutation = useMutation({
        mutationFn: async () => {
            await supabase.from('seller_lead_mapping').delete().eq('upload_month', selectedMonth);
            const toInsert = mappingPreview.map(({ id: _id, ...rest }) => rest);
            const { error } = await supabase.from('seller_lead_mapping').insert(toInsert);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seller_lead_mapping', selectedMonth] });
            setMappingUploadStep('done');
            toast.success(`${mappingPreview.length} clientes salvos! ✅`);
        },
        onError: () => toast.error('Erro ao salvar mapeamento'),
    });

    // ─── CSV Upload: Payments (fallback) ─────────────────────────────────────
    const handlePaymentCSV = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const rows = parseCSV(text);
            if (!rows.length) { toast.error('CSV vazio ou mal formatado'); return; }
            const parsed: TmbPayment[] = rows.map((row) => {
                const amountStr = findColumn(row, ['valor', 'value', 'amount', 'parcela', 'preco', 'preço']);
                const amount = amountStr ? parseFloat(amountStr.replace(/[^\d,.-]/g, '').replace(',', '.')) : null;
                return {
                    customer_name: findColumn(row, ['nome', 'name', 'cliente', 'comprador']),
                    customer_email: findColumn(row, ['email', 'e-mail', 'mail']) || null,
                    amount: isNaN(amount!) ? null : amount,
                    paid_at: findColumn(row, ['data', 'date', 'pagamento', 'paid_at']) || null,
                    product: findColumn(row, ['produto', 'product', 'oferta']) || null,
                };
            }).filter(r => r.customer_name);
            if (!parsed.length) { toast.error('Colunas de nome não identificadas no CSV'); return; }
            setPaymentPreview(parsed);
            setPaymentUploadStep('preview');
        };
        reader.readAsText(file, 'UTF-8');
        e.target.value = '';
    }, []);

    // ─── Calculate ──────────────────────────────────────────────────────────
    const handleCalculate = () => {
        const payments = tmbPayments.length > 0 ? tmbPayments : paymentPreview;
        const sellers = dbSellers.length > 0 ? dbSellers : mappingPreview;
        if (!payments.length) { toast.error('Nenhum pagamento. Busque da TMB ou faça upload do CSV.'); return; }
        if (!sellers.length) { toast.error('Nenhum mapeamento. Faça upload da planilha de clientes por vendedora.'); return; }
        setIsCalculating(true);
        setTimeout(() => {
            const r = matchPaymentsToSellers(payments, sellers);
            setResults(r);
            setIsCalculating(false);
            const total = r.reduce((a, b) => a + b.payment_count, 0);
            if (!r.length) toast.warning('Nenhum match encontrado. Verifique nomes/emails.');
            else toast.success(`${total} pagamentos identificados para ${r.length} vendedora${r.length !== 1 ? 's' : ''}! 🎉`);
        }, 200);
    };

    const toggleSeller = (seller: string) => {
        setExpandedSellers(prev => {
            const next = new Set(prev);
            if (next.has(seller)) next.delete(seller); else next.add(seller);
            return next;
        });
    };

    const exportResults = () => {
        const rows = ['Vendedora,Cliente,Email,Valor Parcela,Valor Total,Parcelas,Status,Pedido,Data'];
        results.forEach(r => {
            r.clients.forEach(c => {
                rows.push([
                    r.seller_name, c.name, c.email || '',
                    formatCurrency(c.amount), formatCurrency(c.valor_total),
                    c.parcelas || '', c.status_financeiro || '',
                    c.pedido_id || '',
                    c.paid_at ? new Date(c.paid_at).toLocaleDateString('pt-BR') : '',
                ].join(','));
            });
        });
        const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `comissoes-${selectedMonth}.csv`; a.click();
        URL.revokeObjectURL(url);
        toast.success('Relatório exportado! 📥');
    };

    const NEON_GREEN = 'hsl(142, 70%, 45%)';
    const NEON_GOLD = 'hsl(45, 90%, 50%)';

    const activePayments = tmbPayments.length > 0 ? tmbPayments : paymentPreview;
    const activeSellers = dbSellers.length > 0 ? dbSellers : mappingPreview;
    const unmatchedCount = results.length > 0
        ? activePayments.length - results.reduce((a, b) => a + b.payment_count, 0)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold">Comissões</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Identifique automaticamente quem pagou e qual vendedora vendeu
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedMonth} onValueChange={handleMonthChange}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {monthOptions.map(m => <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {results.length > 0 && (
                        <Button variant="outline" size="sm" onClick={exportResults} className="gap-2">
                            <Download className="w-4 h-4" /> Exportar CSV
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Pedidos da TMB', value: tmbPayments.length || paymentPreview.length, icon: DollarSign, color: 'hsl(200, 80%, 55%)' },
                    { label: 'Clientes Mapeados', value: activeSellers.length, icon: Users, color: NEON_GOLD },
                    { label: 'Vendedoras com Comissão', value: results.length, icon: CheckCircle2, color: NEON_GREEN },
                    { label: 'Total Identificado', value: formatCurrency(results.reduce((a, b) => a + b.total_amount, 0)), icon: DollarSign, color: NEON_GREEN },
                ].map((stat, i) => (
                    <Card key={i} className="border-none">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                                <span className="text-xs text-muted-foreground">{stat.label}</span>
                            </div>
                            <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Area: two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* LEFT: Busca TMB + CSV fallback */}
                <div className="space-y-4">
                    {/* TMB Direct Fetch */}
                    <Card className="border-none" style={{ boxShadow: '0 0 14px hsl(142,70%,45%,0.2)' }}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                                <Zap className="w-4 h-4 text-green-400" />
                                Buscar Pagamentos da TMB (Automático)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                                Busca diretamente os pedidos <strong>Efetivados</strong> no período selecionado.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Data início</label>
                                    <Input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Data fim</label>
                                    <Input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="h-8 text-sm" />
                                </div>
                            </div>
                            <Button
                                className="w-full gap-2"
                                style={{ background: 'linear-gradient(135deg, hsl(142,70%,30%), hsl(142,70%,20%))' }}
                                onClick={fetchFromTmb}
                                disabled={isFetchingTmb}
                            >
                                {isFetchingTmb ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                {isFetchingTmb ? 'Buscando na TMB...' : 'Buscar na TMB'}
                            </Button>
                            {tmbPayments.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-green-400">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span><strong>{tmbPayments.length}</strong> pedidos efetivados encontrados</span>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto rounded border text-xs">
                                        <table className="w-full">
                                            <thead className="bg-muted/30 sticky top-0">
                                                <tr>
                                                    <th className="text-left p-2">Cliente</th>
                                                    <th className="text-left p-2">Email</th>
                                                    <th className="text-right p-2">Parcela</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tmbPayments.slice(0, 8).map((p, i) => (
                                                    <tr key={i} className="border-t border-muted/20">
                                                        <td className="p-2 max-w-[120px] truncate">{p.customer_name}</td>
                                                        <td className="p-2 text-muted-foreground max-w-[140px] truncate">{p.customer_email || '—'}</td>
                                                        <td className="p-2 text-right font-medium text-green-400">{formatCurrency(p.amount)}</td>
                                                    </tr>
                                                ))}
                                                {tmbPayments.length > 8 && (
                                                    <tr><td colSpan={3} className="p-2 text-center text-muted-foreground">+ {tmbPayments.length - 8} mais...</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* CSV Fallback */}
                    <Card className="border-none border border-muted/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                                <Upload className="w-4 h-4" />
                                Alternativa: Upload Manual de Pagamentos (CSV)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                Use se preferir exportar o CSV da TMB manualmente. Colunas: nome, email, valor, data, produto.
                            </p>
                            {paymentUploadStep === 'idle' && (
                                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-muted rounded-lg p-3 cursor-pointer hover:border-muted-foreground transition-colors text-sm text-muted-foreground">
                                    <Upload className="w-4 h-4" />
                                    Clique para upload do CSV
                                    <input type="file" accept=".csv" className="hidden" onChange={handlePaymentCSV} />
                                </label>
                            )}
                            {paymentUploadStep === 'preview' && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs">
                                        <Info className="w-3 h-3 text-blue-400" />
                                        <span><strong>{paymentPreview.length}</strong> pagamentos detectados</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" className="h-7 text-xs" onClick={() => setPaymentUploadStep('done')}>Usar estes dados</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPaymentUploadStep('idle')}>Cancelar</Button>
                                    </div>
                                </div>
                            )}
                            {paymentUploadStep === 'done' && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-green-400">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>{paymentPreview.length} pagamentos carregados</span>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { setPaymentUploadStep('idle'); setPaymentPreview([]); }}>Trocar</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT: Seller Mapping CSV */}
                <Card className="border-none" style={{ boxShadow: '0 0 14px hsl(45,90%,50%,0.15)' }}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-yellow-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                            Planilha: Clientes × Vendedoras
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                            Planilha com colunas: <strong>nome</strong>, <strong>email</strong>, <strong>vendedora</strong>
                            <br />Esta planilha fica salva e reutilizada mês a mês.
                        </p>
                        {activeSellers.length > 0 && mappingUploadStep !== 'preview' && (
                            <div className="flex items-center gap-2 text-sm text-yellow-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span><strong>{activeSellers.length}</strong> clientes mapeados para {formatMonth(selectedMonth)}</span>
                            </div>
                        )}
                        {(mappingUploadStep === 'idle' || mappingUploadStep === 'done') && (
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-5 cursor-pointer hover:border-yellow-400 transition-colors">
                                <Upload className="w-7 h-7 text-muted-foreground mb-1" />
                                <span className="text-sm text-muted-foreground">
                                    {activeSellers.length > 0 ? 'Clique para substituir o CSV' : 'Clique para fazer upload do CSV'}
                                </span>
                                <input type="file" accept=".csv" className="hidden" onChange={handleSellerCSV} />
                            </label>
                        )}
                        {mappingUploadStep === 'preview' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Info className="w-4 h-4 text-yellow-400" />
                                    <span><strong>{mappingPreview.length}</strong> clientes detectados</span>
                                </div>
                                <div className="max-h-40 overflow-y-auto rounded border text-xs">
                                    <table className="w-full">
                                        <thead className="bg-muted/30 sticky top-0">
                                            <tr>
                                                <th className="text-left p-2">Nome</th>
                                                <th className="text-left p-2">Email</th>
                                                <th className="text-left p-2">Vendedora</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mappingPreview.slice(0, 6).map((r, i) => (
                                                <tr key={i} className="border-t border-muted/20">
                                                    <td className="p-2">{r.customer_name}</td>
                                                    <td className="p-2 text-muted-foreground">{r.customer_email || '—'}</td>
                                                    <td className="p-2 font-medium text-yellow-400">{r.seller_name}</td>
                                                </tr>
                                            ))}
                                            {mappingPreview.length > 6 && (
                                                <tr><td colSpan={3} className="p-2 text-center text-muted-foreground">+ {mappingPreview.length - 6} mais...</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => saveMappingMutation.mutate()} disabled={saveMappingMutation.isPending}>
                                        {saveMappingMutation.isPending ? 'Salvando...' : 'Confirmar e Salvar'}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setMappingUploadStep('idle')}>Cancelar</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Calculate Button */}
            <div className="flex justify-center">
                <Button
                    size="lg"
                    className="gap-3 px-14 font-bold text-base"
                    style={{ background: 'linear-gradient(135deg, hsl(142,70%,30%), hsl(142,70%,20%))', boxShadow: `0 0 20px ${NEON_GREEN}40` }}
                    onClick={handleCalculate}
                    disabled={isCalculating || (!activePayments.length && !tmbPayments.length)}
                >
                    <Calculator className="w-5 h-5" />
                    {isCalculating ? 'Calculando...' : 'Calcular Comissões'}
                </Button>
            </div>

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        Resultado — {formatMonth(selectedMonth)}
                    </h2>

                    {/* Summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {results.map(r => (
                            <Card
                                key={r.seller_name}
                                className="border-none cursor-pointer hover:scale-[1.01] transition-transform"
                                style={{ boxShadow: `0 0 12px ${NEON_GOLD}20` }}
                                onClick={() => toggleSeller(r.seller_name)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-bold text-base">{r.seller_name}</p>
                                            <p className="text-xs text-muted-foreground">{r.payment_count} pagamento{r.payment_count !== 1 ? 's' : ''}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold" style={{ color: NEON_GREEN }}>{formatCurrency(r.total_amount)}</p>
                                            {expandedSellers.has(r.seller_name)
                                                ? <ChevronDown className="w-4 h-4 ml-auto mt-1 text-muted-foreground" />
                                                : <ChevronRight className="w-4 h-4 ml-auto mt-1 text-muted-foreground" />}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Detail tables */}
                    {results.filter(r => expandedSellers.has(r.seller_name)).map(r => (
                        <Card key={`detail-${r.seller_name}`} className="border-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">
                                    {r.seller_name} — Detalhes
                                    <Badge className="ml-2" style={{ background: NEON_GOLD, color: '#000' }}>
                                        {formatCurrency(r.total_amount)} total parcelas
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Produto</TableHead>
                                            <TableHead>Parcelas</TableHead>
                                            <TableHead>Efetivado em</TableHead>
                                            <TableHead className="text-right">Parcela</TableHead>
                                            <TableHead className="text-right">V. Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {r.clients.map((c, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{c.name}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{c.email || '—'}</TableCell>
                                                <TableCell className="text-sm">{c.product || '—'}</TableCell>
                                                <TableCell className="text-sm text-center">{c.parcelas || '—'}</TableCell>
                                                <TableCell className="text-sm">
                                                    {c.paid_at ? new Date(c.paid_at).toLocaleDateString('pt-BR') : '—'}
                                                </TableCell>
                                                <TableCell className="text-right font-bold" style={{ color: NEON_GREEN }}>
                                                    {formatCurrency(c.amount)}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground text-sm">
                                                    {formatCurrency(c.valor_total)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Unmatched warning */}
                    {unmatchedCount > 0 && (
                        <Card className="border border-yellow-500/20 bg-yellow-500/5">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-300">
                                            {unmatchedCount} pagamento{unmatchedCount !== 1 ? 's' : ''} sem correspondência
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Esses clientes pagaram mas não estão na planilha de vendedoras.
                                            Verifique se nome ou email batem entre as duas fontes.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
