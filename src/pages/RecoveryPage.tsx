import { CheckCircle2, Clock, RotateCcw, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { StatusBadge } from '../components/ui/Badge';
import { smartAccount } from '../domain/mockData';
import {
  createInitialRecoveryRequest,
  transitionRecovery,
  type RecoveryAction,
} from '../domain/recoveryMachine';
import type { RecoveryStatus } from '../domain/types';

const timeline = [
  'Вход через Social Signer',
  'Создание нового Device Signer',
  'Отправка recovery request',
  'Подтверждение Arbiter',
  'Ожидание 48 часов',
  'Возможность отмены старым устройством или Recovery Signer',
  'Замена Device Signer',
  'Увеличение signer epoch',
  'Отзыв старых session keys',
  'Завершение восстановления',
];

const statusTone: Record<RecoveryStatus, 'good' | 'warn' | 'bad' | 'neutral'> = {
  IDLE: 'neutral',
  INITIATED: 'warn',
  WAITING_ARBITER: 'warn',
  TIMELOCK: 'warn',
  READY: 'good',
  EXECUTED: 'good',
  CANCELLED: 'bad',
};

export function RecoveryPage() {
  const [request, setRequest] = useState(() => createInitialRecoveryRequest(smartAccount.signerEpoch));
  const [message, setMessage] = useState('Recovery ещё не запущен.');

  function run(action: RecoveryAction) {
    const result = transitionRecovery(request, action, new Date().toISOString());
    setRequest(result.request);
    setMessage(result.message);
  }

  const executed = request.status === 'EXECUTED';

  return (
    <div className="space-y-6">
      <Panel title="Recovery wizard" eyebrow="State machine">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <StatusBadge tone={statusTone[request.status]}>{request.status}</StatusBadge>
          <span className="text-sm text-muted">{message}</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Button type="button" onClick={() => run('START')} disabled={request.status !== 'IDLE'}>
            Начать восстановление
          </Button>
          <Button type="button" onClick={() => run('APPROVE_ARBITER')} disabled={request.status !== 'WAITING_ARBITER'}>
            Подтвердить Arbiter
          </Button>
          <Button type="button" onClick={() => run('COMPLETE_DELAY')} disabled={request.status !== 'TIMELOCK'}>
            Смоделировать завершение задержки
          </Button>
          <Button type="button" variant="danger" onClick={() => run('CANCEL')} disabled={request.status === 'IDLE' || executed}>
            Отменить восстановление
          </Button>
          <Button type="button" variant="primary" onClick={() => run('EXECUTE')} disabled={request.status !== 'READY'}>
            Исполнить восстановление
          </Button>
          <Button type="button" variant="ghost" onClick={() => run('RESET')} icon={<RotateCcw className="h-4 w-4" />}>
            Сбросить сценарий
          </Button>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel title="Timeline" eyebrow="Recovery steps">
          <ol className="space-y-3">
            {timeline.map((step, index) => {
              const done =
                executed ||
                (request.status !== 'IDLE' && index <= 2) ||
                (request.arbiterApproved && index <= 3) ||
                (request.timelockComplete && index <= 5);
              return (
                <li key={step} className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      done ? 'bg-accent-500 text-slate-950' : 'bg-white/8 text-slate-400'
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Clock className="h-4 w-4" aria-hidden="true" />}
                  </span>
                  <span className="pt-1 text-sm">{step}</span>
                </li>
              );
            })}
          </ol>
        </Panel>

        <Panel title="Результат после исполнения" eyebrow="Account state">
          <div className="space-y-3">
            <StateLine label="Старый Device Signer" value={request.oldDeviceStatus === 'REVOKED' ? 'Отозван' : 'Активен'} ok={executed} />
            <StateLine label="Новый Device Signer" value={request.newDeviceStatus === 'ACTIVE' ? 'Активен' : 'Ожидает'} ok={executed} />
            <StateLine label="Signer epoch" value={`${request.signerEpochBefore} → ${request.signerEpochAfter}`} ok={executed} />
            <StateLine label="Старые подписи" value={executed ? 'Недействительны' : 'Пока действительны'} ok={executed} />
            <StateLine label="Session keys" value={request.sessionKeysRevoked ? 'Отозваны' : 'Активны'} ok={executed} />
            <StateLine label="Адрес аккаунта" value="Не изменился" ok={request.accountAddressUnchanged} />
            <StateLine label="Балансы" value="Не изменились" ok={request.balancesUnchanged} />
          </div>
        </Panel>
      </div>

      <Panel title="Почему средства не нужно переносить" eyebrow="Smart Account ownership">
        <p className="text-lg leading-8">
          Активы принадлежат Smart Account. При восстановлении меняются правила авторизации, а не адрес аккаунта.
        </p>
      </Panel>
    </div>
  );
}

function StateLine({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="soft-panel flex items-center justify-between gap-3 p-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="inline-flex items-center gap-2 text-sm font-semibold">
        {ok ? <CheckCircle2 className="h-4 w-4 text-signal-green" aria-hidden="true" /> : <XCircle className="h-4 w-4 text-slate-500" aria-hidden="true" />}
        {value}
      </span>
    </div>
  );
}
