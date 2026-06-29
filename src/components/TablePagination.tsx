import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Paginador simples para as tabelas de leads. Renderizar só uma página por vez
 * (ex.: 25 linhas) em vez de ~1000 é o que elimina o congelamento ao abrir a aba.
 */
export function TablePagination({ page, pageSize, total, onPageChange }: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  if (total <= pageSize) {
    return (
      <div className="px-4 py-2 text-xs text-muted-foreground">
        {total} {total === 1 ? 'registro' : 'registros'}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 flex-wrap">
      <span className="text-xs text-muted-foreground">
        Mostrando <span className="font-medium text-foreground">{from}–{to}</span> de{' '}
        <span className="font-medium text-foreground">{total}</span>
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {current} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current + 1)}
          disabled={current >= pageCount}
          className="gap-1"
        >
          Próxima <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
