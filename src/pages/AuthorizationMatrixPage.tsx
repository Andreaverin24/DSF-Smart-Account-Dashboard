import { useMemo, useState } from 'react';
import { RiskBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { RiskLegend } from '../components/ui/RiskLegend';
import { authorizationRows } from '../domain/mockData';
import type { RiskLevel } from '../domain/types';
import { riskLabels } from '../utils/labels';

const filters: Array<RiskLevel | 'ALL'> = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function AuthorizationMatrixPage() {
  const [filter, setFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [selectedOperation, setSelectedOperation] = useState(authorizationRows[0]?.operation ?? '');

  const rows = useMemo(
    () => authorizationRows.filter((row) => filter === 'ALL' || row.risk === filter),
    [filter],
  );
  const selected = authorizationRows.find((row) => row.operation === selectedOperation) ?? rows[0] ?? authorizationRows[0];

  return (
    <div className="space-y-6">
      <RiskLegend />
      <Panel title="Матрица авторизации" eyebrow="Signer requirements">
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Фильтр по риску">
          {filters.map((item) => (
            <Button
              key={item}
              type="button"
              variant={filter === item ? 'primary' : 'secondary'}
              onClick={() => setFilter(item)}
            >
              {item === 'ALL' ? 'Все' : `${riskLabels[item]} риск`}
            </Button>
          ))}
        </div>

        <div className="table-scroll overflow-x-auto">
          <table className="min-w-[860px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-muted">
                <th className="py-3 pr-4">Операция</th>
                <th className="py-3 pr-4">Риск</th>
                <th className="py-3 pr-4">Device</th>
                <th className="py-3 pr-4">Social</th>
                <th className="py-3 pr-4">Arbiter</th>
                <th className="py-3 pr-4">Recovery</th>
                <th className="py-3 pr-4">Delay</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.operation}
                  className={`cursor-pointer border-b border-white/10 transition hover:bg-white/[0.04] ${
                    selected?.operation === row.operation ? 'bg-accent-500/10' : ''
                  }`}
                  onClick={() => setSelectedOperation(row.operation)}
                >
                  <td className="py-3 pr-4 font-semibold">{row.operation}</td>
                  <td className="py-3 pr-4">
                    <RiskBadge risk={row.risk} />
                  </td>
                  <td className="py-3 pr-4">{row.device}</td>
                  <td className="py-3 pr-4">{row.social}</td>
                  <td className="py-3 pr-4">{row.arbiter}</td>
                  <td className="py-3 pr-4">{row.recovery}</td>
                  <td className="py-3 pr-4">{row.delay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {selected && (
        <Panel title={selected.operation} eyebrow="Почему такой набор подписей">
          <div className="flex flex-wrap items-center gap-3">
            <RiskBadge risk={selected.risk} />
            <span className="text-sm text-muted">Delay: {selected.delay}</span>
          </div>
          <p className="mt-4 leading-7 text-slate-200">{selected.explanation}</p>
        </Panel>
      )}
    </div>
  );
}
