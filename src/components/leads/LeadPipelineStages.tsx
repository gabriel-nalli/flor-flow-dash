import { MessageCircle, Calendar, XCircle, Phone, CheckCircle, TrendingUp, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const PIPELINE_STAGES = [
  { actionType: 'whatsapp_sent', icon: MessageCircle, label: 'WhatsApp enviado', color: 'text-emerald-500' },
  { actionType: 'no_response', icon: Clock, label: 'Não respondeu', color: 'text-orange-500' },
  { actionType: 'scheduled_meeting', icon: Calendar, label: 'Agendado', color: 'text-blue-500' },
  { actionType: 'no_show_marked', icon: XCircle, label: 'No-show', color: 'text-red-500' },
  { actionType: 'meeting_done', icon: Phone, label: 'Reunião realizada', color: 'text-violet-500' },
  { actionType: 'followup_done', icon: CheckCircle, label: 'Follow-up feito', color: 'text-yellow-500' },
  { actionType: 'sale_won_call', icon: TrendingUp, label: 'Venda na Call', color: 'text-green-500' },
  { actionType: 'sale_won_followup', icon: TrendingUp, label: 'Venda no Follow-up', color: 'text-green-500' },
];

interface LeadPipelineStagesProps {
  completedActions: string[];
}

export function LeadPipelineStages({ completedActions }: LeadPipelineStagesProps) {
  const actionSet = new Set(completedActions);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-0.5">
        {PIPELINE_STAGES.map((stage) => {
          const done = actionSet.has(stage.actionType);
          const Icon = stage.icon;
          return (
            <Tooltip key={stage.actionType}>
              <TooltipTrigger asChild>
                <div className={cn('p-0.5 rounded', done ? stage.color : 'text-muted-foreground/20')}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {stage.label} {done ? '✓' : '—'}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
