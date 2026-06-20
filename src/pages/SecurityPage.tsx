import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { securityScenarios } from '../domain/mockData';

const threats = [
  'Потеря телефона',
  'Компрометация Device Signer',
  'Компрометация Social Signer',
  'Компрометация Arbiter',
  'Повторное использование подписи',
  'Replay в другой сети',
  'Вредоносный session key',
  'Перевод на неизвестный адрес',
  'Вывод выше лимита',
  'Вредоносное обновление implementation',
  'Зависшая операция',
  'Попытка обхода лимита через ERC-20 calldata',
];

const mechanisms = [
  'multisigner validation',
  'context-based policy',
  'chain ID binding',
  'account binding',
  'nonce channels',
  'signer epoch',
  'validAfter/validUntil',
  'spending limits',
  'calldata inspection',
  'allowlist',
  'timelock',
  'emergency freeze',
  'recovery',
  'session key restrictions',
  'upgrade delay',
];

export function SecurityPage() {
  const [showScenario, setShowScenario] = useState(false);
  const scenario = securityScenarios[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Угрозы" eyebrow="Threat model">
          <div className="grid gap-2">
            {threats.map((threat) => (
              <div key={threat} className="soft-panel flex items-center gap-3 p-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-signal-amber" aria-hidden="true" />
                <span className="text-sm">{threat}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Механизмы защиты" eyebrow="Controls">
          <div className="grid gap-2 sm:grid-cols-2">
            {mechanisms.map((mechanism) => (
              <div key={mechanism} className="soft-panel flex items-center gap-3 p-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-signal-green" aria-hidden="true" />
                <span className="text-sm">{mechanism}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {scenario && (
        <Panel title={scenario.title} eyebrow="Interactive scenario">
          <p className="mb-4 text-sm text-muted">{scenario.threat}</p>
          <Button type="button" onClick={() => setShowScenario((current) => !current)}>
            {showScenario ? 'Скрыть ответ' : 'Показать ответ'}
          </Button>
          {showScenario && (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="soft-panel p-4">
                <h3 className="mb-3 text-sm font-semibold">Почему атака не проходит</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {scenario.outcome.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="soft-panel p-4">
                <h3 className="mb-3 text-sm font-semibold">Какие механизмы срабатывают</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {scenario.mechanisms.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
