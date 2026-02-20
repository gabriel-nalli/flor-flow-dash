import { Search, Instagram, Tag, DollarSign, Calendar, MoreHorizontal, MessageCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { STATUS_CONFIG } from '@/lib/constants';

// Neon Input
export function NeonInput({ icon: Icon, placeholder, value, onChange, type = "text", className = "" }: {
  icon?: any; placeholder?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; className?: string;
}) {
  return (
    <div className={`relative group ${className}`}>
      {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground/70 transition-colors" />}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-secondary border-none rounded-xl py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-all"
        style={{ paddingLeft: Icon ? '2.5rem' : '0.75rem', paddingRight: '0.75rem' }}
      />
    </div>
  );
}

// Neon Select visual wrapper
export function NeonSelectWrapper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`[&_button]:bg-secondary [&_button]:border-none [&_button]:rounded-xl [&_button]:text-sm [&_button]:text-muted-foreground [&_button]:h-10 ${className}`}>
      {children}
    </div>
  );
}

// Neon Status Badge
export function NeonStatusBadge({ status }: { status: string | null }) {
  const config = STATUS_CONFIG[status || ''];
  if (!config) return <span className="text-xs text-muted-foreground">{status || '—'}</span>;

  const neonStyles: Record<string, string> = {
    novo: 'bg-blue-500/10 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
    contato_1_feito: 'bg-cyan-500/10 text-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.1)]',
    nao_respondeu_d0: 'bg-orange-500/10 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.1)]',
    nao_respondeu_d1: 'bg-orange-500/10 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.1)]',
    agendado: 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
    no_show: 'bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]',
    reuniao_realizada: 'bg-violet-500/10 text-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.1)]',
    proposta_enviada: 'bg-indigo-500/10 text-indigo-500',
    aguardando_decisao: 'bg-amber-500/10 text-amber-500',
    follow_up: 'bg-yellow-500/10 text-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.1)]',
    fechado_call: 'bg-green-500/10 text-green-600 shadow-[0_0_10px_rgba(34,197,94,0.1)]',
    fechado_followup: 'bg-green-500/10 text-green-600 shadow-[0_0_10px_rgba(34,197,94,0.1)]',
    perdido: 'bg-muted text-muted-foreground',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${neonStyles[status || ''] || 'text-muted-foreground'}`}>
      {config.label}
    </span>
  );
}

// Lead Avatar
export function LeadAvatar({ name }: { name: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0">
      {(name || '??').substring(0, 2).toUpperCase()}
    </div>
  );
}

// Canal Icon Button
export function ChannelIcon({ icon: Icon, hoverColor = "hover:bg-muted/50" }: { icon: any; hoverColor?: string }) {
  return (
    <div className={`p-2 rounded-lg bg-secondary ${hoverColor} transition-colors cursor-pointer`}>
      <Icon size={14} className="text-muted-foreground" />
    </div>
  );
}

// Neon Table Wrapper
export function NeonTableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      {children}
    </div>
  );
}

// Pagination
export function NeonPagination({ showing, total }: { showing: number; total: number }) {
  return (
    <div className="flex justify-between items-center px-6 py-4">
      <span className="text-muted-foreground text-xs">
        Mostrando {showing} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">Anterior</button>
        <button className="px-3 py-1.5 text-xs bg-muted text-foreground rounded-lg font-semibold">1</button>
        <button className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">2</button>
        <button className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">3</button>
        <button className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">Próximo</button>
      </div>
    </div>
  );
}
