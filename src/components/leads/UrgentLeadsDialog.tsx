import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { format, parseISO } from 'date-fns';

interface UrgentLead {
  id: string;
  nome: string;
  whatsapp?: string | null;
  assigned_to?: string | null;
  status?: string | null;
  faturamento?: string | null;
  reason?: string;
  created_at?: string | null;
  next_followup_date?: string | null;
}

interface UrgentLeadsDialogProps {
  title?: string;
  leads: UrgentLead[];
  profileMap: Record<string, string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateLabel?: string;
  getDate?: (lead: UrgentLead) => string | null | undefined;
}

export function UrgentLeadsDialog({ title = 'Leads Urgentes', leads, profileMap, open, onOpenChange, dateLabel = 'Criado em', getDate }: UrgentLeadsDialogProps) {
  const formatPhone = (phone: string) => phone.replace(/\D/g, '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{leads.length} lead{leads.length !== 1 ? 's' : ''}</DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Faturamento</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>{dateLabel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map(lead => {
              const dateVal = getDate ? getDate(lead) : lead.created_at;
              return (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    <div>
                      <span>{lead.nome}</span>
                      {lead.whatsapp && (
                        <a
                          href={`https://wa.me/${formatPhone(lead.whatsapp)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-primary hover:underline"
                        >
                          {lead.whatsapp}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {lead.faturamento || '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {lead.assigned_to ? (profileMap[lead.assigned_to] || 'Desconhecido') : 'Sem responsável'}
                  </TableCell>
                  <TableCell><StatusBadge status={lead.status || null} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                    {lead.reason || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {dateVal ? format(parseISO(dateVal), 'dd/MM/yyyy') : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
