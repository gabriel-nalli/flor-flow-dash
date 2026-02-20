import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { format, parseISO } from 'date-fns';

interface Lead {
  id: string;
  nome: string;
  whatsapp?: string | null;
  assigned_to?: string | null;
  status?: string | null;
  next_followup_date?: string | null;
  created_at?: string | null;
}

interface AlertLeadsDialogProps {
  title: string;
  leads: Lead[];
  profileMap: Record<string, string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateLabel?: string;
  getDate?: (lead: Lead) => string | null | undefined;
}

export function AlertLeadsDialog({ title, leads, profileMap, open, onOpenChange, dateLabel = 'Data', getDate }: AlertLeadsDialogProps) {
  const formatPhone = (phone: string) => phone.replace(/\D/g, '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{leads.length} lead{leads.length !== 1 ? 's' : ''}</DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>{dateLabel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map(lead => {
              const dateVal = getDate ? getDate(lead) : lead.created_at;
              return (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.nome}</TableCell>
                  <TableCell>
                    {lead.whatsapp ? (
                      <a
                        href={`https://wa.me/${formatPhone(lead.whatsapp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {lead.whatsapp}
                      </a>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {lead.assigned_to ? (profileMap[lead.assigned_to] || 'Desconhecido') : 'Sem responsável'}
                  </TableCell>
                  <TableCell><StatusBadge status={lead.status || null} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">
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
