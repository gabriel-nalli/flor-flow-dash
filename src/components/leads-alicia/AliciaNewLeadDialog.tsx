import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, User, Instagram, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface AliciaNewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AliciaNewLeadDialog({ open, onOpenChange }: AliciaNewLeadDialogProps) {
  const { isAdmin, teamMembers } = useProfileSelector();
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [assignedTo, setAssignedTo] = useState('none');
  const [tiempoExperiencia, setTiempoExperiencia] = useState('');
  const [cantidadEmpleados, setCantidadEmpleados] = useState('');
  const [facturacionMensual, setFacturacionMensual] = useState('');
  const [planConcreto, setPlanConcreto] = useState('');
  const [mayorObstaculo, setMayorObstaculo] = useState('');
  const [tiempoResultados, setTiempoResultados] = useState('');

  const sellers = teamMembers.filter(p => p.role !== 'ADMIN');

  const resetForm = () => {
    setNombre(''); setWhatsapp(''); setInstagram(''); setAssignedTo('none');
    setTiempoExperiencia(''); setCantidadEmpleados(''); setFacturacionMensual('');
    setPlanConcreto(''); setMayorObstaculo(''); setTiempoResultados('');
    setShowOptional(false);
  };

  const canSubmit = nombre.trim() && whatsapp.trim();

  const handleSubmit = async () => {
    if (!nombre.trim()) { toast.error(t('Nome *')); return; }
    if (!whatsapp.trim()) { toast.error(t('WhatsApp *')); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nombre: nombre.trim(),
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim() || null,
        status: 'novo',
        tiempo_experiencia: tiempoExperiencia.trim() || null,
        cantidad_empleados: cantidadEmpleados.trim() || null,
        facturacion_mensual: facturacionMensual.trim() || null,
        plan_concreto: planConcreto.trim() || null,
        mayor_obstaculo: mayorObstaculo.trim() || null,
        tiempo_resultados: tiempoResultados.trim() || null,
      };

      if (isAdmin && assignedTo !== 'none') {
        payload.assigned_to = assignedTo;
        payload.status = 'contato_1_feito';
      } else if (!isAdmin && user?.id) {
        payload.assigned_to = user.id;
        payload.status = 'contato_1_feito';
      }

      const { error } = await supabase.from('leads_alicia' as any).insert([payload]);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['leads_alicia'] });
      toast.success(t('Lead adicionado com sucesso!'));
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(t('Erro ao adicionar lead') + ': ' + (err?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-card max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Plus size={16} className="text-primary" />
            {t('Novo Lead — Alicia 🇪🇸')}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-1">
          <div className="space-y-3 pt-1 pb-2">
            {/* Nome */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">{t('Nome *')}</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('Nome completo')}
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="pl-8 h-9 bg-secondary border-none text-sm"
                />
              </div>
            </div>

            {/* WhatsApp + Instagram */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">{t('WhatsApp *')}</label>
                <div className="relative">
                  <MessageCircle size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="5511999990000"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    className="pl-8 h-9 bg-secondary border-none text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Instagram</label>
                <div className="relative">
                  <Instagram size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('@usuario')}
                    value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    className="pl-8 h-9 bg-secondary border-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Responsável — somente Admin */}
            {isAdmin && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">{t('Atribuir a vendedora (opcional)')}</label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger className="bg-secondary border-none h-9 text-sm">
                    <SelectValue placeholder={t('Sem responsável')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('Sem responsável (pool)')}</SelectItem>
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
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-0.5"
            >
              {showOptional ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showOptional ? t('Ocultar campos opcionais') : t('Mostrar campos opcionais')}
            </button>

            {showOptional && (
              <div className="space-y-3 border-t border-border pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">{t('Tempo de Experiência')}</label>
                    <Input
                      placeholder={t('Ex: 2 anos')}
                      value={tiempoExperiencia}
                      onChange={e => setTiempoExperiencia(e.target.value)}
                      className="h-9 bg-secondary border-none text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">{t('Qtd. Funcionários')}</label>
                    <Input
                      placeholder={t('Ex: 5 funcionários')}
                      value={cantidadEmpleados}
                      onChange={e => setCantidadEmpleados(e.target.value)}
                      className="h-9 bg-secondary border-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">{t('Faturamento Mensal')}</label>
                  <Input
                    placeholder="Ex: $5.000"
                    value={facturacionMensual}
                    onChange={e => setFacturacionMensual(e.target.value)}
                    className="h-9 bg-secondary border-none text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">{t('Plano Concreto')}</label>
                  <Input
                    placeholder={t('Ex: Escalar para 10k/mês')}
                    value={planConcreto}
                    onChange={e => setPlanConcreto(e.target.value)}
                    className="h-9 bg-secondary border-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">{t('Maior Dificuldade')}</label>
                    <Input
                      placeholder={t('Ex: Conseguir clientes')}
                      value={mayorObstaculo}
                      onChange={e => setMayorObstaculo(e.target.value)}
                      className="h-9 bg-secondary border-none text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">{t('Tempo para Resultados')}</label>
                    <Input
                      placeholder={t('Ex: 3 meses')}
                      value={tiempoResultados}
                      onChange={e => setTiempoResultados(e.target.value)}
                      className="h-9 bg-secondary border-none text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 pt-2 border-t border-border">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className={`w-full gap-2 transition-opacity ${!canSubmit ? 'opacity-60' : ''}`}
          >
            <Plus size={15} />
            {saving ? t('Carregando...') : t('Adicionar Lead')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
