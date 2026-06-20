import { RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RiskBadge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { JsonBlock } from '../components/ui/JsonBlock';
import { Panel } from '../components/ui/Panel';
import { Tooltip } from '../components/ui/Tooltip';
import { defaultOperationDraft, smartAccount } from '../domain/mockData';
import type { NetworkName, OperationDraft, OperationType, PaymasterMode } from '../domain/types';
import { evaluateOperation } from '../domain/policyEngine';
import { buildUserOperation, signedPayloadFormula } from '../domain/userOperationBuilder';
import { operationLabels, paymasterLabels, signerLabels, validationLabels } from '../utils/labels';

const operationTypes: OperationType[] = [
  'TRANSFER',
  'APPROVE',
  'SWAP',
  'DSF_DEPOSIT',
  'DSF_WITHDRAW',
  'ADD_SIGNER',
  'REMOVE_SIGNER',
  'CREATE_SESSION_KEY',
  'UPGRADE',
  'RECOVERY',
];
const gasModes: PaymasterMode[] = ['ETH', 'DSF_SPONSORED', 'USDT', 'NONE'];
const networks: NetworkName[] = ['Ethereum', 'Arbitrum', 'Base', 'Polygon'];

export function UserOperationSimulatorPage() {
  const [draft, setDraft] = useState<OperationDraft>(defaultOperationDraft);
  const [showSignedPayload, setShowSignedPayload] = useState(false);
  const requirement = useMemo(() => evaluateOperation(draft, smartAccount), [draft]);
  const userOperation = useMemo(() => buildUserOperation(draft, smartAccount, requirement), [draft, requirement]);

  function update<K extends keyof OperationDraft>(key: K, value: OperationDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
      <Panel title="Параметры операции" eyebrow="Local simulator">
        <div className="space-y-4">
          <Field label="Тип операции">
            <select className={inputClass} value={draft.type} onChange={(event) => update('type', event.target.value as OperationType)}>
              {operationTypes.map((type) => (
                <option key={type} value={type}>
                  {operationLabels[type]}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Токен">
              <select className={inputClass} value={draft.token} onChange={(event) => update('token', event.target.value)}>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
                <option value="DSF">DSF</option>
                <option value="ETH">ETH</option>
              </select>
            </Field>
            <Field label="Сумма">
              <input
                className={inputClass}
                type="number"
                min="0"
                value={draft.amount}
                onChange={(event) => update('amount', Number(event.target.value))}
              />
            </Field>
          </div>

          <Field label="Target contract">
            <input className={inputClass} value={draft.targetContract} onChange={(event) => update('targetContract', event.target.value)} />
          </Field>
          <Field label="Recipient">
            <input className={inputClass} value={draft.recipient} onChange={(event) => update('recipient', event.target.value)} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Recipient trusted/untrusted">
              <select
                className={inputClass}
                value={draft.recipientTrusted ? 'trusted' : 'untrusted'}
                onChange={(event) => update('recipientTrusted', event.target.value === 'trusted')}
              >
                <option value="trusted">Trusted</option>
                <option value="untrusted">Untrusted</option>
              </select>
            </Field>
            <Field label="Срок действия">
              <input className={inputClass} value={draft.validUntil} onChange={(event) => update('validUntil', event.target.value)} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Способ оплаты газа">
              <select className={inputClass} value={draft.gasMode} onChange={(event) => update('gasMode', event.target.value as PaymasterMode)}>
                {gasModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {paymasterLabels[mode]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Сеть">
              <select className={inputClass} value={draft.network} onChange={(event) => update('network', event.target.value as NetworkName)}>
                {networks.map((network) => (
                  <option key={network} value={network}>
                    {network}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="soft-panel space-y-3 p-4">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.sessionKeyMode}
                onChange={(event) => update('sessionKeyMode', event.target.checked)}
              />
              Режим Session Key
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.allowTransferBySessionKey}
                onChange={(event) => update('allowTransferBySessionKey', event.target.checked)}
                disabled={!draft.sessionKeyMode}
              />
              Transfer явно разрешён для Session Key
            </label>
          </div>

          <Button type="button" variant="ghost" onClick={() => setDraft(defaultOperationDraft)} icon={<RotateCcw className="h-4 w-4" />}>
            Сбросить симулятор
          </Button>
        </div>
      </Panel>

      <div className="space-y-6">
        <Panel title="Результат Policy Engine" eyebrow="Authorization decision">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="soft-panel p-4">
              <p className="text-xs text-muted">Риск</p>
              <div className="mt-2">
                <RiskBadge risk={requirement.risk} />
              </div>
            </div>
            <div className="soft-panel p-4">
              <p className="text-xs text-muted">Validation mode</p>
              <p className="mt-2 font-semibold">{validationLabels[requirement.validationMode]}</p>
            </div>
            <div className="soft-panel p-4">
              <p className="text-xs text-muted">Операция</p>
              <StatusBadge tone={requirement.allowed ? 'good' : 'bad'}>{requirement.allowed ? 'Разрешена' : 'Запрещена'}</StatusBadge>
            </div>
            <div className="soft-panel p-4">
              <p className="text-xs text-muted">Необходимые подписанты</p>
              <p className="mt-2 font-semibold">{requirement.requiredSigners.map((signer) => signerLabels[signer]).join(' + ')}</p>
            </div>
            <div className="soft-panel p-4">
              <p className="text-xs text-muted">Timelock</p>
              <p className="mt-2 font-semibold">{requirement.delayHours ? `${requirement.delayHours} часов` : 'Не требуется'}</p>
            </div>
            <div className="soft-panel p-4">
              <p className="text-xs text-muted">Paymaster</p>
              <p className="mt-2 font-semibold">{requirement.paymasterAllowed ? 'Может спонсировать' : 'Не спонсирует'}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Причины</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {requirement.reasons.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Применённые лимиты</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {requirement.appliedLimits.map((limit) => (
                  <li key={limit}>• {limit}</li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>

        <Panel title="Mock UserOperation" eyebrow="ERC-4337 object">
          <JsonBlock value={userOperation} label="Формируемая UserOperation" />
          <div className="mt-5">
            <Button type="button" onClick={() => setShowSignedPayload((current) => !current)}>
              {showSignedPayload ? 'Скрыть' : 'Показать'} блок «Что именно подписывается»
            </Button>
            {showSignedPayload && (
              <div className="mt-4">
                <Tooltip label="Это концептуальная формула. Реальный hash зависит от версии EntryPoint и кодирования полей.">
                  <span className="text-sm font-semibold">Что именно подписывается</span>
                </Tooltip>
                <pre className="code-block mt-3">
                  <code>{signedPayloadFormula}</code>
                </pre>
                <p className="mt-3 text-sm text-muted">Реальные приватные ключи и подписи в демонстрации не используются.</p>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
