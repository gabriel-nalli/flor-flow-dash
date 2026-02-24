import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X, ImageIcon, Split } from 'lucide-react';
import { toast } from 'sonner';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Venda 🎉</DialogTitle>
          <p className="text-sm text-muted-foreground">Lead: <span className="font-medium text-foreground">{leadName}</span></p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Valor Bruto */}
          <div className="space-y-2">
            <Label htmlFor="sale-value">Valor da Venda (Bruto)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                id="sale-value"
                placeholder="0"
                value={formatCurrency(saleValue)}
                onChange={e => setSaleValue(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Cash-in */}
          <div className="space-y-2">
            <Label htmlFor="cash-value">Valor em Cash-in (Líquido recebido)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                id="cash-value"
                placeholder="0"
                value={formatCurrency(cashValue)}
                onChange={e => setCashValue(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-2">
            <Label>Método de Pagamento</Label>
            <div className="flex flex-wrap gap-3">
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
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
                      ${selected
                        ? 'border-primary bg-primary/10 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]'
                        : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-all ${selected ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                      {selected && <div className="w-1.5 h-1.5 rounded-sm bg-primary-foreground" />}
                    </div>
                    {pm.id === 'hubla_boleto' && <Split className="w-3.5 h-3.5" />}
                    {pm.label}
                  </button>
                );
              })}
            </div>

            {/* Campos extras para HUBLA + Boleto */}
            {paymentMethod === 'hubla_boleto' && (
              <div className="mt-3 p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                <p className="text-xs text-primary font-semibold uppercase tracking-wide flex items-center gap-1.5">
                  <Split className="w-3 h-3" />
                  Detalhes HUBLA + Boleto
                </p>
                {/* Valor entrada Hubla */}
                <div className="space-y-1">
                  <Label htmlFor="hubla-entrada" className="text-xs">Valor da entrada (HUBLA à vista)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                      id="hubla-entrada"
                      placeholder="0"
                      value={formatCurrency(hublaEntrada)}
                      onChange={e => setHublaEntrada(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {/* Valor parcelado Boleto */}
                <div className="space-y-1">
                  <Label htmlFor="boleto-parcelado" className="text-xs">Valor parcelado no Boleto</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                      id="boleto-parcelado"
                      placeholder="0"
                      value={formatCurrency(boletoParcelado)}
                      onChange={e => setBoletoParcelado(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comprovante */}
          <div className="space-y-2">
            <Label>Comprovante de Pagamento</Label>

            {!comprovanteFile ? (
              <div
                className={`relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
                  ${dragging
                    ? 'border-primary bg-primary/10'
                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
                  }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <Upload className="w-7 h-7 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Clique ou arraste o arquivo aqui</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP ou PDF • Máx. 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                {isImage && previewUrl && (
                  <img src={previewUrl} alt="Comprovante" className="w-full max-h-48 object-contain bg-muted/30" />
                )}
                {!isImage && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <FileText className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{comprovanteFile.name}</p>
                      <p className="text-xs text-muted-foreground">PDF • {(comprovanteFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                )}
                {isImage && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
                    <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground flex-1 truncate">{comprovanteFile.name}</span>
                  </div>
                )}
                <div className="px-3 py-2 border-t border-border flex justify-end">
                  <button onClick={handleRemove} className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors">
                    <X className="w-3.5 h-3.5" />
                    Remover arquivo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!saleValue}>Confirmar Venda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
