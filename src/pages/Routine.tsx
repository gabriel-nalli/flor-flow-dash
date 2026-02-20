import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfileSelector, TEAM_MEMBERS } from '@/contexts/ProfileSelectorContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ROUTINES } from '@/lib/constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Clock, User, CalendarIcon, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

function getRoleRoutine(role: string) {
  if (role === 'SOCIAL_SELLER') return ROUTINES['SOCIAL_SELLER'];
  if (role === 'SDR') return ROUTINES['SDR'];
  return ROUTINES['VENDEDORA'];
}

function getBlockOrder(template: Array<{ block: string; name: string }>) {
  return [...new Set(template.map(t => t.block))];
}

export default function Routine() {
  const { selectedProfile, isAdmin } = useProfileSelector();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dateLabel = format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  // For non-admin, show their own checklist
  const role = selectedProfile.role === 'SOCIAL_SELLER' ? 'SOCIAL_SELLER' : selectedProfile.role === 'SDR' ? 'SDR' : 'VENDEDORA';
  const template = ROUTINES[role] || ROUTINES['VENDEDORA'];

  const [localChecklist, setLocalChecklist] = useState<Record<string, boolean>>({});

  const { data: dbChecklist = [], isLoading } = useQuery({
    queryKey: ['routine', dateStr, isAdmin ? 'all' : selectedProfile.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_checklists')
        .select('*')
        .eq('target_date', dateStr);
      return data || [];
    },
  });

  const toggleItem = async (item: { id: string; task_name: string; task_block: string; is_completed: boolean; fromDb: boolean }) => {
    const newVal = !item.is_completed;
    setLocalChecklist(prev => ({ ...prev, [item.task_name]: newVal }));

    if (item.fromDb) {
      await supabase.from('daily_checklists').update({
        is_completed: newVal,
        completed_at: newVal ? new Date().toISOString() : null,
      }).eq('id', item.id);
    } else {
      await supabase.from('daily_checklists').insert({
        task_name: item.task_name,
        task_block: item.task_block,
        user_id: selectedProfile.id,
        target_date: dateStr,
        is_completed: newVal,
        completed_at: newVal ? new Date().toISOString() : null,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['routine'] });
  };

  // Admin view: show all team members
  if (isAdmin) {
    const members = TEAM_MEMBERS.filter(m => m.role !== 'ADMIN');

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Rotina Diária — Visão Geral</h1>
            <p className="text-muted-foreground capitalize">{dateLabel}</p>
          </div>
          <DateFilter selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando rotinas...</div>
        ) : (
          members.map(member => {
            const memberTemplate = getRoleRoutine(member.role);
            const memberItems = memberTemplate.map(t => {
              const dbItem = dbChecklist.find(c => c.task_name === t.name && c.user_id === member.id);
              return {
                id: dbItem?.id || t.name,
                task_name: t.name,
                task_block: t.block,
                is_completed: dbItem?.is_completed ?? false,
                fromDb: !!dbItem,
              };
            });

            const completed = memberItems.filter(i => i.is_completed).length;
            const total = memberItems.length;
            const progress = total > 0 ? (completed / total) * 100 : 0;

            const grouped = memberItems.reduce((acc, item) => {
              const block = item.task_block || 'Outros';
              if (!acc[block]) acc[block] = [];
              acc[block].push(item);
              return acc;
            }, {} as Record<string, typeof memberItems>);

            const blockOrder = getBlockOrder(memberTemplate);

            const roleLabel = member.role === 'VENDEDORA' ? 'Vendedora' : member.role === 'SDR' ? 'SDR' : 'Social Seller';

            return (
              <MemberRoutineCard
                key={member.id}
                name={member.full_name}
                roleLabel={roleLabel}
                completed={completed}
                total={total}
                progress={progress}
                grouped={grouped}
                blockOrder={blockOrder}
              />
            );
          })
        )}
      </div>
    );
  }

  // Non-admin: original view
  const items = template.map(t => {
    const dbItem = dbChecklist.find(c => c.task_name === t.name);
    return {
      id: dbItem?.id || t.name,
      task_name: t.name,
      task_block: t.block,
      is_completed: dbItem ? dbItem.is_completed : (localChecklist[t.name] || false),
      fromDb: !!dbItem,
    };
  });

  const completed = items.filter(c => c.is_completed).length;
  const total = items.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const grouped = items.reduce((acc, item) => {
    const block = item.task_block || 'Outros';
    if (!acc[block]) acc[block] = [];
    acc[block].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const blockOrder = [...new Set(template.map(t => t.block))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Rotina Diária</h1>
          <p className="text-muted-foreground">
            <span className="capitalize">{dateLabel}</span> — {selectedProfile.full_name} ({selectedProfile.role})
          </p>
        </div>
        <DateFilter selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{completed}/{total} tarefas concluídas</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando rotina...</div>
      ) : (
        blockOrder.filter(block => grouped[block]).map(block => (
          <Card key={block}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {block}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {grouped[block].map((item) => (
                <label key={item.id} className="flex items-center gap-3 py-1 cursor-pointer group">
                  <Checkbox
                    checked={item.is_completed}
                    onCheckedChange={() => toggleItem(item)}
                  />
                  <span className={`text-sm flex-1 ${item.is_completed ? 'line-through text-muted-foreground' : ''} group-hover:text-primary transition-colors`}>
                    {item.task_name}
                  </span>
                  {item.is_completed && <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />}
                </label>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ---- Date Filter ----

function DateFilter({ selectedDate, onDateChange }: { selectedDate: Date; onDateChange: (d: Date) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(selectedDate, "dd/MM/yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => d && onDateChange(d)}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

// ---- Admin sub-component ----

interface MemberRoutineCardProps {
  name: string;
  roleLabel: string;
  completed: number;
  total: number;
  progress: number;
  grouped: Record<string, Array<{ id: string; task_name: string; task_block: string; is_completed: boolean; fromDb: boolean }>>;
  blockOrder: string[];
}

function MemberRoutineCard({ name, roleLabel, completed, total, progress, grouped, blockOrder }: MemberRoutineCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-sm font-bold tabular-nums">{completed}/{total}</span>
                  <span className="text-xs text-muted-foreground ml-1">({Math.round(progress)}%)</span>
                </div>
                <div className="w-24">
                  <Progress value={progress} className="h-2" />
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {blockOrder.filter(block => grouped[block]).map(block => (
              <div key={block}>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {block}
                </p>
                <div className="space-y-1.5 ml-1">
                  {grouped[block].map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      {item.is_completed ? (
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                      )}
                      <span className={item.is_completed ? 'line-through text-muted-foreground' : ''}>
                        {item.task_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
