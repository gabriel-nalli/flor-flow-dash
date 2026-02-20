import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfileSelector, TEAM_MEMBERS } from '@/contexts/ProfileSelectorContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, User, Instagram, MessageCircle, Mail, DollarSign, Tag, Briefcase, AlertCircle, Wallet, Heart, ChevronDown, ChevronUp } from 'lucide-react';

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ORIGIN_OPTIONS = [
  { value: 'webinar', label: 'Webinar' },
  { value: 'bio', label: 'Bio' },
  { value: 'social', label: 'Social' },
  { value: 'lista', label: 'Lista' },
];

export function NewLeadDialog({ open, onOpenChange }: NewLeadDialogProps) {
  const { isAdmin } = useProfileSelector();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [email, setEmail] = useState('');
  const [faturamento, setFaturamento] = useState('');
  const [origem, setOrigem] = useState<string>('webinar');
  const [assignedTo, setAssignedTo] = useState<string>('none');
  const [profissao, setProfissao] = useState('');
  const [maiorDificuldade, setMaiorDificuldade] = useState('');
  const [rendaFamiliar, setRendaFamiliar] = useState('');
  const [quemInveste, setQuemInveste] = useState('');

  const sellers = TEAM_MEMBERS.filter(p => p.role !== 'ADMIN');

  const resetForm = () => {
    setNome(''); setWhatsapp(''); setInstagram(''); setEmail('');
    setFaturamento(''); setOrigem('webinar'); setAssignedTo('none');
    setProfissao(''); setMaiorDificuldade(''); setRendaFamiliar(''); setQuemInveste('');
    setShowOptional(false);
  };

  const canSubmit = nome.trim() && whatsapp.trim() && instagram.trim() && faturamento.trim();

  const handleSubmit = async () => {
    if (!nome.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!whatsapp.trim()) { toast.error('WhatsApp é obrigatório'); return; }
    if (!instagram.trim()) { toast.error('Instagram é obrigatório'); return; }
    if (!faturamento.trim()) { toast.error('Faturamento é obrigatório'); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nome: nome.trim(),
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim(),
        email: email.trim() || null,
        faturamento: faturamento.trim(),
        origem,
        status: 'novo',
        profissao: profissao.trim() || null,
        maior_dificuldade: maiorDificuldade.trim() || null,
        renda_familiar: rendaFamiliar.trim() || null,
        quem_investe: quemInveste.trim() || null,
      };

      if (isAdmin && assignedTo !== 'none') {
        payload.assigned_to = assignedTo;
        payload.status = 'contato_1_feito';
      }

      const { error } = await supabase.from('leads').insert([payload as any]);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-leads'] });
      toast.success('Lead adicionado com sucesso! ✅');
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Erro ao adicionar lead:', err);
      toast.error('Erro ao adicionar lead: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Plus size={18} className="text-primary" />
            Novo Lead
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Nome * */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Nome *</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} className="pl-9 bg-secondary border-none" />
            </div>
          </div>

          {/* WhatsApp * + Instagram * */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">WhatsApp *</label>
              <div className="relative">
                <MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="5511999990000" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="pl-9 bg-secondary border-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Instagram *</label>
              <div className="relative">
                <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="@usuario" value={instagram} onChange={e => setInstagram(e.target.value)} className="pl-9 bg-secondary border-none" />
              </div>
            </div>
          </div>

          {/* Faturamento * + Origem */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Faturamento *</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Ex: 5000" value={faturamento} onChange={e => setFaturamento(e.target.value)} className="pl-9 bg-secondary border-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Origem</label>
              <Select value={origem} onValueChange={setOrigem}>
                <SelectTrigger className="bg-secondary border-none h-10">
                  <Tag size={14} className="mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGIN_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsável — somente Admin */}
          {isAdmin && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Atribuir a vendedora (opcional)</label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="bg-secondary border-none h-10">
                  <SelectValue placeholder="Sem responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem responsável (pool)</SelectItem>
                  {sellers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Toggle campos opcionais */}
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-1"
          >
            {showOptional ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showOptional ? 'Ocultar campos opcionais' : 'Mostrar campos opcionais (email, profissão, etc.)'}
          </button>

          {showOptional && (
            <div className="space-y-4 border-t border-border pt-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9 bg-secondary border-none" />
                </div>
              </div>

              {/* Profissão + Renda Familiar */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Profissão</label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Ex: Designer" value={profissao} onChange={e => setProfissao(e.target.value)} className="pl-9 bg-secondary border-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Renda Familiar</label>
                  <div className="relative">
                    <Wallet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Ex: R$ 5.000" value={rendaFamiliar} onChange={e => setRendaFamiliar(e.target.value)} className="pl-9 bg-secondary border-none" />
                  </div>
                </div>
              </div>

              {/* Maior Dificuldade */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Maior Dificuldade</label>
                <div className="relative">
                  <AlertCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Ex: Conseguir clientes" value={maiorDificuldade} onChange={e => setMaiorDificuldade(e.target.value)} className="pl-9 bg-secondary border-none" />
                </div>
              </div>

              {/* Quem Investe */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Quem Investe na Sua Carreira?</label>
                <div className="relative">
                  <Heart size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Ex: Eu mesma, Família..." value={quemInveste} onChange={e => setQuemInveste(e.target.value)} className="pl-9 bg-secondary border-none" />
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className="w-full gap-2 mt-2"
          >
            <Plus size={16} />
            {saving ? 'Salvando...' : 'Adicionar Lead'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
