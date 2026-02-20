import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIG } from '@/lib/constants';

export function StatusBadge({ status }: { status: string | null }) {
  const config = STATUS_CONFIG[status || ''];
  if (!config) return <Badge variant="outline">{status || '—'}</Badge>;
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}
