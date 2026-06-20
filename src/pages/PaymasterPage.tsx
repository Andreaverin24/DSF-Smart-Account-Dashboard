import { ArrowRight, Fuel } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import type { PaymasterMode } from '../domain/types';
import { paymasterLabels } from '../utils/labels';

interface GasScenario {
  mode: PaymasterMode;
  title: string;
  facts: string[];
  path: string[];
}

const scenarios: GasScenario[] = [
  {
    mode: 'ETH',
    title: 'Пользователь платит ETH',
    facts: ['gas payer: Smart Account', 'источник: ETH balance', 'требования Paymaster отсутствуют'],
    path: ['Smart Account', 'ETH balance', 'EntryPoint', 'Bundler refund'],
  },
  {
    mode: 'DSF_SPONSORED',
    title: 'DSF спонсирует операцию',
    facts: [
      'gas payer: DSF Paymaster',
      'разрешены только DSF Deposit, Withdraw и Claim',
      'есть дневная квота',
      'операция предварительно симулируется',
    ],
    path: ['DSF Paymaster', 'EntryPoint deposit', 'Bundler', 'DSF operation'],
  },
  {
    mode: 'USDT',
    title: 'Пользователь платит USDT',
    facts: [
      'Paymaster оплачивает ETH',
      'после операции списывается эквивалент в USDT',
      'mock exchange rate: 1 ETH = 3 450 USDT',
      'максимальный предел комиссии: 12 USDT',
    ],
    path: ['Paymaster ETH', 'EntryPoint', 'Operation', 'USDT reimbursement'],
  },
];

export function PaymasterPage() {
  const [mode, setMode] = useState<PaymasterMode>('DSF_SPONSORED');
  const active = scenarios.find((scenario) => scenario.mode === mode) ?? scenarios[0]!;

  return (
    <div className="space-y-6">
      <Panel title="Сценарии оплаты газа" eyebrow="Paymaster policy">
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Сценарии Paymaster">
          {scenarios.map((scenario) => (
            <Button
              key={scenario.mode}
              type="button"
              variant={mode === scenario.mode ? 'primary' : 'secondary'}
              onClick={() => setMode(scenario.mode)}
            >
              {paymasterLabels[scenario.mode]}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="soft-panel p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-md bg-accent-500/12 p-3 text-accent-500">
                <Fuel className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-semibold">{active.title}</h2>
            </div>
            <ul className="space-y-2">
              {active.facts.map((fact) => (
                <li key={fact} className="text-sm text-slate-300">
                  • {fact}
                </li>
              ))}
            </ul>
          </div>

          <div className="soft-panel p-5">
            <p className="mb-4 text-sm font-semibold">Схема движения газа</p>
            <div className="grid gap-3 md:grid-cols-4">
              {active.path.map((node, index) => (
                <div key={node} className="flex items-center gap-3">
                  <div className="min-h-20 flex-1 rounded-lg border border-white/10 bg-black/20 p-4 text-center text-sm font-semibold">
                    {node}
                  </div>
                  {index < active.path.length - 1 && <ArrowRight className="hidden h-5 w-5 shrink-0 text-accent-500 md:block" aria-hidden="true" />}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted">
              Paymaster не получает права управлять кошельком. Он только решает, оплачивать ли gas для уже сформированной и проверяемой UserOperation.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
