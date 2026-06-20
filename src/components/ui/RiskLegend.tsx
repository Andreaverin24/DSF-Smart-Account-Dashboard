import type { RiskLevel } from '../../domain/types';
import { RiskBadge } from './Badge';

const risks: RiskLevel[] = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function RiskLegend() {
  return (
    <div className="soft-panel flex flex-wrap items-center gap-3 p-3" aria-label="Легенда уровней риска">
      <span className="text-sm font-semibold text-slate-200">Риск:</span>
      {risks.map((risk) => (
        <RiskBadge key={risk} risk={risk} />
      ))}
    </div>
  );
}
