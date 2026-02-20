import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { XCircle } from 'lucide-react';

interface LostReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  onConfirm: (reason: string) => void;
}

const QUICK_REASONS = [
  'Sem orçamento',
  'Não respondeu',
  'Escolheu concorrente',
  'Não tem interesse',
  'Timing ruim',
];

export function LostReasonDialog({ open, onOpenChange, leadName, onConfirm }: LostReasonDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
  };

  const handleQuickReason = (r: string) => {
    setReason(r);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setReason(''); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[420px] bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle size={18} />
            Lead Perdido
          </DialogTitle>
          <DialogDescription>
            Por que <span className="font-semibold text-foreground">{leadName}</span> foi perdido?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap gap-2">
            {QUICK_REASONS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => handleQuickReason(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  reason === r
                    ? 'bg-destructive/20 text-destructive border border-destructive/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Descreva o motivo da perda..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="bg-secondary border-none min-h-[80px]"
          />

          <Button
            onClick={handleConfirm}
            disabled={!reason.trim()}
            variant="destructive"
            className="w-full gap-2"
          >
            <XCircle size={16} />
            Confirmar Lead Perdido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
