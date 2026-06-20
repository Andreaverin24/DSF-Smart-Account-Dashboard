import { Plus, ShieldMinus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { Panel } from '../components/ui/Panel';
import { StatusBadge } from '../components/ui/Badge';
import { sessionKeys as initialSessionKeys } from '../domain/mockData';
import type { SessionKey } from '../domain/types';

const emptyDraft = {
  name: 'Новый DSF Session Key',
  validUntil: '24 часа',
  allowedContracts: 'DSF Router',
  allowedMethods: 'deposit, withdraw',
  allowedTokens: 'USDT',
  singleOperationLimit: 250,
  dailyLimit: 750,
};

export function SessionKeysPage() {
  const [keys, setKeys] = useState<SessionKey[]>(initialSessionKeys);
  const [draft, setDraft] = useState(emptyDraft);
  const totalRestrictions = useMemo(
    () => ['Transfer запрещён по умолчанию', 'Signer management запрещён', 'Upgrade запрещён', 'Recovery запрещён'],
    [],
  );

  function createKey() {
    const key: SessionKey = {
      id: `sk-${keys.length + 1}`,
      name: draft.name,
      status: 'DRAFT',
      validUntil: draft.validUntil,
      allowedContracts: draft.allowedContracts.split(',').map((item) => item.trim()).filter(Boolean),
      allowedMethods: draft.allowedMethods.split(',').map((item) => item.trim()).filter(Boolean),
      allowedTokens: draft.allowedTokens.split(',').map((item) => item.trim()).filter(Boolean),
      singleOperationLimit: draft.singleOperationLimit,
      dailyLimit: draft.dailyLimit,
      transferAllowed: false,
      signerManagementAllowed: false,
      upgradeAllowed: false,
      recoveryAllowed: false,
    };

    setKeys((current) => [key, ...current]);
  }

  return (
    <div className="space-y-6">
      <Panel title="Принцип минимальных полномочий" eyebrow="Least privilege">
        <div className="grid gap-3 md:grid-cols-4">
          {totalRestrictions.map((item) => (
            <div key={item} className="soft-panel flex items-center gap-3 p-4">
              <ShieldMinus className="h-5 w-5 shrink-0 text-signal-green" aria-hidden="true" />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel title="Демонстрационные session keys" eyebrow="Mock list">
          <div className="grid gap-4">
            {keys.map((key) => (
              <article key={key.id} className="soft-panel p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{key.name}</h3>
                  <StatusBadge tone={key.status === 'ACTIVE' ? 'good' : 'warn'}>{key.status}</StatusBadge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Info label="valid until" value={key.validUntil} />
                  <Info label="target" value={key.allowedContracts.join(', ')} />
                  <Info label="methods" value={key.allowedMethods.join(', ')} />
                  <Info label="token limit" value={`${key.singleOperationLimit} ${key.allowedTokens.join(', ')}`} />
                  <Info label="daily limit" value={`${key.dailyLimit} ${key.allowedTokens.join(', ')}`} />
                  <Info label="transfer" value={key.transferAllowed ? 'разрешён' : 'запрещён'} />
                  <Info label="signer management" value={key.signerManagementAllowed ? 'разрешён' : 'запрещён'} />
                  <Info label="upgrade" value={key.upgradeAllowed ? 'разрешён' : 'запрещён'} />
                  <Info label="recovery" value={key.recoveryAllowed ? 'разрешён' : 'запрещён'} />
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Создать mock session key" eyebrow="Local state only">
          <div className="space-y-4">
            <Field label="Название">
              <input className={inputClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </Field>
            <Field label="Срок действия">
              <input className={inputClass} value={draft.validUntil} onChange={(event) => setDraft({ ...draft, validUntil: event.target.value })} />
            </Field>
            <Field label="Разрешённые контракты">
              <input
                className={inputClass}
                value={draft.allowedContracts}
                onChange={(event) => setDraft({ ...draft, allowedContracts: event.target.value })}
              />
            </Field>
            <Field label="Разрешённые методы">
              <input
                className={inputClass}
                value={draft.allowedMethods}
                onChange={(event) => setDraft({ ...draft, allowedMethods: event.target.value })}
              />
            </Field>
            <Field label="Разрешённые токены">
              <input
                className={inputClass}
                value={draft.allowedTokens}
                onChange={(event) => setDraft({ ...draft, allowedTokens: event.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Лимит одной операции">
                <input
                  className={inputClass}
                  type="number"
                  value={draft.singleOperationLimit}
                  onChange={(event) => setDraft({ ...draft, singleOperationLimit: Number(event.target.value) })}
                />
              </Field>
              <Field label="Дневной лимит">
                <input
                  className={inputClass}
                  type="number"
                  value={draft.dailyLimit}
                  onChange={(event) => setDraft({ ...draft, dailyLimit: Number(event.target.value) })}
                />
              </Field>
            </div>
            <Button type="button" variant="primary" onClick={createKey} icon={<Plus className="h-4 w-4" />}>
              Создать локальный ключ
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
