import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Edit2, User, MessageCircle, Instagram, DollarSign } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface EditLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
}

export function EditLeadDialog({ open, onOpenChange, lead }: EditLeadDialogProps) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [faturamento, setFaturamento] = useState('');

  useEffect(() => {
    if (lead && open) {
      setNome(lead.nome || '');
      setWhatsapp(lead.whatsapp || '');
      setInstagram(lead.instagram || '');
      setFaturamento(lead.faturamento || '');
    }
  }, [lead, open]);

  const canSubmit = nome.trim() && whatsapp.trim();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nome.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!whatsapp.trim()) { toast.error('WhatsApp é obrigatório'); return; }
    if (!lead) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nome: nome.trim(),
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim() || null,
        faturamento: faturamento.trim() || null,
      };

      const { error } = await supabase
        .from('leads')
        .update(payload as any)
        .eq('id', lead.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-leads'] });
      toast.success('Lead editado com sucesso! ✅');
      onOpenChange(false);
    } catch (err: any) {
      console.error('Erro ao editar lead:', err);
      toast.error('Erro ao editar lead: ' + (err?.message || 'Erro de conexão'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[85vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Edit2 size={18} className="text-primary" />
              {t('Editar Lead')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">{t('Nome *')}</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder={t('Nome completo')} 
                  value={nome} 
                  onChange={e => setNome(e.target.value)} 
                  className="pl-9 bg-secondary border-none h-11" 
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">{t('WhatsApp *')}</label>
                <div className="relative">
                  <MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="5511999990000" 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value)} 
                    className="pl-9 bg-secondary border-none h-11"
                    type="tel"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Instagram</label>
                <div className="relative">
                  <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder={t('@usuario')} value={instagram} onChange={e => setInstagram(e.target.value)} className="pl-9 bg-secondary border-none h-11" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">{t('Faturamento')}</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Ex: 5000" value={faturamento} onChange={e => setFaturamento(e.target.value)} className="pl-9 bg-secondary border-none h-11" />
              </div>
            </div>
          </div>

          <div className="shrink-0 p-6 pt-3 bg-secondary/30 border-t border-border mt-auto">
            <Button
              type="submit"
              disabled={saving || !canSubmit}
              className={`w-full gap-2 transition-all h-12 rounded-xl text-base ${!canSubmit ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-lg shadow-primary/20'}`}
            >
              <Edit2 size={20} />
              {saving ? t('Salvando...') : t('Salvar Alterações')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
