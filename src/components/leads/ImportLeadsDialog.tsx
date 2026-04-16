import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportLeadsDialog({ open, onOpenChange }: ImportLeadsDialogProps) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 1) {
        toast.error('O arquivo parece estar vazio.');
        return;
      }

      // Simple CSV parser that handles quotes
      const parseLine = (line: string) => {
        const result = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuote = !inQuote;
          } else if (char === ',' && !inQuote) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result.map(s => s.replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
      };

      const headers = parseLine(lines[0]);
      const data = lines.slice(1).map(line => {
        const values = parseLine(line);
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] || '';
        });
        return obj;
      });

      setPreview(data.slice(0, 5)); // Mostra os primeiros 5 para conferência
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        
        const parseLine = (line: string) => {
          const result = [];
          let cur = '';
          let inQuote = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
              result.push(cur.trim());
              cur = '';
            } else {
              cur += char;
            }
          }
          result.push(cur.trim());
          return result.map(s => s.replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
        };

        const headers = parseLine(lines[0]);
        const data = lines.slice(1).map(line => {
          const values = parseLine(line);
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header] = values[i] || '';
          });
          return obj;
        });

        const leadsToInsert = data.map(item => {
          // Mapeamento das colunas específicas fornecidas pelo usuário
          const nome = item['Qual o seu nome e sobrenome?'] || item['NOME'] || item['Nome'] || '';
          const whatsapp = item['Qual o seu número WhatsApp?'] || item['WHATSAPP'] || item['WhatsApp'] || '';
          const instagram = item['Qual é o seu Instagram?'] || item['INSTAGRAM'] || item['Instagram'] || '';
          const profissao = item['Qual é a sua área de atuação atual?'] || item['Área de Atuação'] || '';
          const momento = item['Qual das opções abaixo DESCREVE SEU MOMENTO ATUAL?'] || item['Momento'] || '';
          const faturamento = item['Qual é a faixa de faturamento mensal do seu negócio?'] || item['Faturamento'] || '';
          const desafio = item['Qual o seu maior desafio hoje para faturar alto na área da beleza e crescer no digital?'] || item['Desafio'] || '';
          const investimento = item['Quanto você está disposta a investir hoje para se tornar referência na área da beleza e no digital?'] || item['Investimento'] || '';

          const notes = [];
          if (momento) notes.push(`Momento: ${momento}`);
          if (investimento) notes.push(`Disponibilidade de Investimento: ${investimento}`);

          return {
            nome: nome.trim(),
            whatsapp: whatsapp.toString().trim(),
            instagram: instagram.toString().trim() || null,
            profissao: profissao.toString().trim() || null,
            faturamento: faturamento.toString().trim() || null,
            maior_dificuldade: desafio.toString().trim() || null,
            notes: notes.join('\n'),
            status: 'novo',
            assigned_to: null,
            webinar_date_tag: 'NOVO FORMS THAYLOR',
            origem: 'webinar'
          };
        }).filter(l => l.nome && l.whatsapp);

        if (leadsToInsert.length === 0) {
          throw new Error('Nenhum lead válido encontrado no arquivo (Nome e WhatsApp são obrigatórios).');
        }

        const { error } = await supabase.from('leads').insert(leadsToInsert as any);
        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['leads'] });
        toast.success(`${leadsToInsert.length} leads importados com sucesso! ✅`);
        onOpenChange(false);
        setFile(null);
        setPreview([]);
      } catch (err: any) {
        console.error('Erro na importação:', err);
        toast.error('Erro ao importar: ' + (err?.message || 'Erro no processamento do arquivo'));
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card p-6 overflow-hidden border-none shadow-2xl flex flex-col">
        <DialogHeader className="mb-4 text-left">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Upload size={20} className="text-primary" />
            {t('Importar Leads')}
          </DialogTitle>
          <div className="text-sm text-muted-foreground mt-2 space-y-1">
            <p>Suba sua planilha CSV seguindo o formato das colunas do Google Forms.</p>
            <p className="text-[10px] opacity-70">Suporta colunas: Qual o seu nome e sobrenome?, Qual o seu número WhatsApp?, etc.</p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${file ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/30'}`}>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center text-center">
              {file ? (
                <>
                  <FileText className="w-12 h-12 text-primary mb-3" />
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  <button 
                    onClick={(e) => { e.preventDefault(); setFile(null); setPreview([]); }}
                    className="mt-4 text-xs text-destructive hover:underline flex items-center gap-1"
                  >
                    <X size={12} /> Remover arquivo
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
                  <p className="font-medium text-foreground">Clique ou arraste o arquivo CSV</p>
                  <p className="text-xs text-muted-foreground mt-2 max-w-[280px]">
                    Os leads serão marcados com a tag "NOVO FORMS THAYLOR" e ficariam disponíveis para coleta.
                  </p>
                </>
              )}
            </div>
          </div>

          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-500" />
                  {t('Pré-visualização')} (Top {preview.length})
                </h3>
              </div>
              <div className="bg-secondary/40 rounded-xl p-3 overflow-hidden border border-white/5">
                <div className="overflow-x-auto max-h-[160px]">
                  <table className="w-full text-[10px] text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="pb-2 font-bold uppercase opacity-60 px-2">Nome</th>
                        <th className="pb-2 font-bold uppercase opacity-60 px-2">WhatsApp</th>
                        <th className="pb-2 font-bold uppercase opacity-60 px-2">Instagram</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                          <td className="py-2 px-2 truncate max-w-[150px]">{row['Qual o seu nome e sobrenome?'] || row['NOME'] || row['Nome'] || '—'}</td>
                          <td className="py-2 px-2 truncate max-w-[100px]">{row['Qual o seu número WhatsApp?'] || row['WHATSAPP'] || row['WhatsApp'] || '—'}</td>
                          <td className="py-2 px-2 truncate max-w-[100px] font-mono text-primary/70">{row['Qual é o seu Instagram?'] || row['INSTAGRAM'] || row['Instagram'] || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full h-12 rounded-xl text-base font-bold gap-2 shadow-lg shadow-primary/20"
            >
              {importing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('Processando...')}
                </>
              ) : (
                <>
                  <Upload size={18} />
                  {t('Importar Leads')}
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground h-11"
            >
              {t('Cancelar')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
