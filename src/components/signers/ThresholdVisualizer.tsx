import { StatusBadge } from '../ui/Badge';
import type { RequirementEvaluation } from '../../domain/types';

export function ThresholdVisualizer({ evaluation }: { evaluation: RequirementEvaluation }) {
  return (
    <div className="soft-panel p-5">
      <div className="grid gap-3 md:grid-cols-3">
        <ThresholdLine
          title="Требуется"
          device={evaluation.requirement.deviceThreshold}
          social={evaluation.requirement.socialThreshold}
          arbiter={evaluation.requirement.arbiterThreshold}
        />
        <ThresholdLine
          title="Выбрано"
          device={evaluation.selected.deviceThreshold}
          social={evaluation.selected.socialThreshold}
          arbiter={evaluation.selected.arbiterThreshold}
        />
        <div className="rounded-lg border border-white/10 bg-black/10 p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-muted">Результат</p>
          <div className="mt-2">
            <StatusBadge tone={evaluation.fulfilled ? 'good' : 'bad'}>
              {evaluation.fulfilled ? 'Порог выполнен' : 'Порог не выполнен'}
            </StatusBadge>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">{evaluation.explanation}</p>
        </div>
      </div>
    </div>
  );
}

function ThresholdLine({ title, device, social, arbiter }: { title: string; device: number; social: number; arbiter: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/10 p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{title}</p>
      <div className="mt-2 grid gap-2 text-sm">
        <span>Device: {device}</span>
        <span>Social: {social}</span>
        <span>Arbiter: {arbiter}</span>
      </div>
    </div>
  );
}
