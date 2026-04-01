import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, User, Instagram, MessageCircle, Mail, DollarSign, Tag, Briefcase, AlertCircle, Wallet, Heart, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { isAdmin, teamMembers } = useProfileSelector();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
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
  const [webinarDate, setWebinarDate] = useState('');
  const sellers = teamMembers.filter(p => p.role !== 'ADMIN');

  const resetForm = () => {
    setNome(''); setWhatsapp(''); setInstagram(''); setEmail('');
    setFaturamento(''); setOrigem('webinar'); setAssignedTo('none');
    setProfissao(''); setMaiorDificuldade(''); setRendaFamiliar(''); setQuemInveste('');
    setWebinarDate('');
    setShowOptional(false);
  };

  const canSubmit = nome.trim() && whatsapp.trim();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nome.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!whatsapp.trim()) { toast.error('WhatsApp é obrigatório'); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nome: nome.trim(),
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim() || null,
        email: email.trim() || null,
        faturamento: faturamento.trim() || null,
        origem,
        status: 'novo',
        profissao: profissao.trim() || null,
        maior_dificuldade: maiorDificuldade.trim() || null,
        renda_familiar: rendaFamiliar.trim() || null,
        quem_investe: quemInveste.trim() || null,
        ...(origem === 'webinar' && webinarDate
          ? { webinar_date_tag: webinarDate }
          : {}),
      };

      const targetUserId = isAdmin ? (assignedTo !== 'none' ? assignedTo : null) : user?.id;
      
      if (targetUserId) {
        payload.assigned_to = targetUserId;
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
      toast.error('Erro ao adicionar lead: ' + (err?.message || 'Erro de conexão'));
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
              <Plus size={18} className="text-primary" />
              {t('Novo Lead')}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">{t('Faturamento')}</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Ex: 5000" value={faturamento} onChange={e => setFaturamento(e.target.value)} className="pl-9 bg-secondary border-none h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">{t('Origem')}</label>
                <Select value={origem} onValueChange={(v) => { setOrigem(v); if (v !== 'webinar') setWebinarDate(''); }}>
                  <SelectTrigger className="bg-secondary border-none h-11">
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

            {origem === 'webinar' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <CalendarDays size={13} className="text-primary" />
                  {t('Data do Webinário')}
                  <span className="text-[10px] opacity-60 ml-1">{t('(opcional)')}</span>
                </label>
                <div className="relative">
                  <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={webinarDate}
                    onChange={e => setWebinarDate(e.target.value)}
                    className="pl-9 bg-secondary border-none h-11"
                  />
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">{t('Atribuir a vendedora (opcional)')}</label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger className="bg-secondary border-none h-11 text-left">
                    <SelectValue placeholder={t('Sem responsável')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('Sem responsável (pool)')}</SelectItem>
                    {sellers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2 bg-secondary/50 rounded-lg mt-2"
            >
              {showOptional ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showOptional ? t('Ocultar campos opcionais') : t('Mostrar campos opcionais')}
            </button>

            {showOptional && (
              <div className="space-y-4 pt-2 pb-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input type="email" placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9 bg-secondary border-none h-11" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">{t('Profissão')}</label>
                    <div className="relative">
                      <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Ex: Designer" value={profissao} onChange={e => setProfissao(e.target.value)} className="pl-9 bg-secondary border-none h-11" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">{t('Renda Familiar')}</label>
                    <div className="relative">
                      <Wallet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Ex: R$ 5.000" value={rendaFamiliar} onChange={e => setRendaFamiliar(e.target.value)} className="pl-9 bg-secondary border-none h-11" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">{t('Maior Dificuldade')}</label>
                  <div className="relative">
                    <AlertCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Ex: Conseguir clientes" value={maiorDificuldade} onChange={e => setMaiorDificuldade(e.target.value)} className="pl-9 bg-secondary border-none h-11" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">{t('Quem Investe na Sua Carreira?')}</label>
                  <div className="relative">
                    <Heart size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Ex: Eu mesma, Família..." value={quemInveste} onChange={e => setQuemInveste(e.target.value)} className="pl-9 bg-secondary border-none h-11" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 p-6 pt-3 bg-secondary/30 border-t border-border mt-auto">
            <Button
              type="submit"
              disabled={saving}
              className={`w-full gap-2 transition-all h-12 rounded-xl text-base ${!canSubmit ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-lg shadow-primary/20'}`}
            >
              <Plus size={20} />
              {saving ? t('Carregando...') : t('Adicionar Lead')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
