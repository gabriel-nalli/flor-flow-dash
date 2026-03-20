import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X, ImageIcon, Split } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import confetti from 'canvas-confetti';

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (saleValue: number, cashValue: number, comprovanteFile: File | null, paymentMethod: string | null) => void;
  leadName: string;
}

const PAYMENT_METHODS = [
  { id: 'boleto', label: 'Boleto' },
  { id: 'hubla', label: 'HUBLA' },
  { id: 'hubla_boleto', label: 'HUBLA + Boleto' },
];

export function SaleDialog({ open, onOpenChange, onConfirm, leadName }: SaleDialogProps) {
  const { t } = useLanguage();
  const [saleValue, setSaleValue] = useState('');
  const [cashValue, setCashValue] = useState('');
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  // Campos extras para HUBLA + Boleto
  const [hublaEntrada, setHublaEntrada] = useState('');
  const [boletoParcelado, setBoletoParcelado] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const MAX_SIZE_MB = 10;

  const handleFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG, WEBP ou PDF.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.`);
      return;
    }
    setComprovanteFile(file);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setComprovanteFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirm = () => {
    const sv = parseFloat(saleValue.replace(/\D/g, '')) || 0;
    const cv = parseFloat(cashValue.replace(/\D/g, '')) || 0;

    // Para HUBLA + Boleto, serializamos os detalhes no paymentMethod
    let finalPaymentMethod = paymentMethod;
    if (paymentMethod === 'hubla_boleto') {
      const entrada = parseFloat(hublaEntrada.replace(/\D/g, '')) || 0;
      const parcelado = parseFloat(boletoParcelado.replace(/\D/g, '')) || 0;
      finalPaymentMethod = JSON.stringify({
        type: 'hubla_boleto',
        hubla_entrada: entrada,
        boleto_parcelado: parcelado,
      });
    }

    onConfirm(sv, cv, comprovanteFile, finalPaymentMethod);
    setSaleValue('');
    setCashValue('');
    setComprovanteFile(null);
    setPreviewUrl(null);
    setPaymentMethod(null);
    setHublaEntrada('');
    setBoletoParcelado('');
  };

  const formatCurrency = (value: string) => {
    const num = value.replace(/\D/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('pt-BR');
  };

  const isImage = comprovanteFile?.type.startsWith('image/');

  useEffect(() => {
    if (open) {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Registrar Venda 🎉')}</DialogTitle>
          <p className="text-sm text-muted-foreground">Lead: <span className="font-medium text-foreground">{leadName}</span></p>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Valores em mesma linha */}
          <div className="grid grid-cols-2 gap-3">
            {/* Valor Bruto */}
            <div className="space-y-1.5">
              <Label htmlFor="sale-value" className="text-xs">{t('Valor da Venda (Bruto)')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                <Input
                  id="sale-value"
                  placeholder="0"
                  value={formatCurrency(saleValue)}
                  onChange={e => setSaleValue(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            {/* Cash-in */}
            <div className="space-y-1.5">
              <Label htmlFor="cash-value" className="text-xs">{t('Valor em Cash-in (Líquido)')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                <Input
                  id="cash-value"
                  placeholder="0"
                  value={formatCurrency(cashValue)}
                  onChange={e => setCashValue(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t('Método de Pagamento')}</Label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(pm => {
                const selected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(selected ? null : pm.id);
                      if (pm.id !== 'hubla_boleto') {
                        setHublaEntrada('');
                        setBoletoParcelado('');
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                      ${selected
                        ? 'border-primary bg-primary/10 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]'
                        : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      }`}
                  >
                    <div className={`w-3 h-3 rounded-sm flex items-center justify-center border transition-all ${selected ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                      {selected && <div className="w-1 h-1 rounded-sm bg-primary-foreground" />}
                    </div>
                    {pm.id === 'hubla_boleto' && <Split className="w-3 h-3" />}
                    {pm.label}
                  </button>
                );
              })}
            </div>

            {/* Campos extras para HUBLA + Boleto */}
            {paymentMethod === 'hubla_boleto' && (
              <div className="mt-2 p-2.5 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                <p className="text-[10px] text-primary font-bold uppercase tracking-wide flex items-center gap-1.5">
                  <Split className="w-3 h-3" />
                  {t('Detalhes HUBLA + Boleto')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Valor entrada Hubla */}
                  <div className="space-y-1">
                    <Label htmlFor="hubla-entrada" className="text-[10px] leading-tight">{t('Sinal (HUBLA)')}</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                      <Input
                        id="hubla-entrada"
                        placeholder="0"
                        value={formatCurrency(hublaEntrada)}
                        onChange={e => setHublaEntrada(e.target.value)}
                        className="pl-7 h-8 text-xs"
                      />
                    </div>
                  </div>
                  {/* Valor parcelado Boleto */}
                  <div className="space-y-1">
                    <Label htmlFor="boleto-parcelado" className="text-[10px] leading-tight">{t('Parcelado (Boleto)')}</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                      <Input
                        id="boleto-parcelado"
                        placeholder="0"
                        value={formatCurrency(boletoParcelado)}
                        onChange={e => setBoletoParcelado(e.target.value)}
                        className="pl-7 h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comprovante */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t('Comprovante')}</Label>

            {!comprovanteFile ? (
              <div
                className={`relative border-2 border-dashed rounded-lg p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all
                  ${dragging
                    ? 'border-primary bg-primary/10'
                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
                  }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <Upload className="w-5 h-5 text-muted-foreground" />
                <p className="text-xs font-medium text-foreground">{t('Clique ou arraste o arquivo aqui')}</p>
                <p className="text-[10px] text-muted-foreground">JPG, PNG, WEBP ou PDF</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden flex items-center justify-between pr-2">
                <div className="flex bg-muted/20 w-full">
                  {isImage && previewUrl ? (
                    <img src={previewUrl} alt="Comprovante" className="w-12 h-12 object-cover bg-muted/30 mr-2" />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-red-500/10 mr-2">
                      <FileText className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                    <p className="text-xs font-medium truncate">{comprovanteFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(comprovanteFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <button onClick={handleRemove} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0 bg-background rounded-md ml-2 border">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">{t('Cancelar')}</Button>
          <Button size="sm" onClick={handleConfirm} disabled={!saleValue} className="h-8 text-xs">{t('Confirmar')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
