import { CheckCircle2, KeyRound, LockKeyhole, WalletCards } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { StatusBadge } from '../components/ui/Badge';
import { smartAccount } from '../domain/mockData';

const eoaItems = [
  'Один приватный ключ',
  'secp256k1',
  'Потеря ключа означает потерю доступа',
  'Нет recovery',
  'Нет встроенных лимитов',
  'Газ оплачивается ETH',
  'Одна операция за одну транзакцию',
];

const smartItems = [
  'Несколько способов авторизации',
  'P-256 и ECDSA',
  'Recovery',
  'Spending limits',
  'Session keys',
  'Batch execution',
  'Paymaster',
  'Контекстные правила безопасности',
  'Возможность заморозки',
  'Модульная архитектура',
];

export function OverviewPage() {
  const config = [
    ['Smart Account', smartAccount.address],
    ['Сеть', smartAccount.network],
    ['Статус', smartAccount.status],
    ['Signer epoch', String(smartAccount.signerEpoch)],
    ['Дневной лимит', `${smartAccount.spendingLimit.dailyLimit.toLocaleString('ru-RU')} USDT`],
    ['Потрачено сегодня', `${smartAccount.spendingLimit.spentToday.toLocaleString('ru-RU')} USDT`],
    ['Recovery delay', `${smartAccount.recoveryDelayHours} часов`],
    ['Paymaster', smartAccount.paymasterActive ? 'Активен' : 'Отключён'],
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Обычный EOA" eyebrow="Классическая модель">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-md bg-signal-amber/12 p-3 text-signal-amber">
              <KeyRound className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted">Аккаунт управляется одним приватным ключом, а правила заданы протоколом.</p>
          </div>
          <ul className="space-y-2">
            {eoaItems.map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal-amber" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4">
            <p className="text-sm font-semibold">Правильная подпись одного ключа = операция разрешена</p>
          </div>
        </Panel>

        <Panel title="DSF Smart Account" eyebrow="Account Abstraction">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-md bg-accent-500/12 p-3 text-accent-500">
              <WalletCards className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted">Контракт сам проверяет подписи, роли, политики, лимиты и сроки действия.</p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {smartItems.map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-lg border border-accent-500/30 bg-accent-500/10 p-4">
            <p className="text-sm font-semibold">Подписи + роли + порог + политика + лимиты + срок действия = операция разрешена</p>
          </div>
        </Panel>
      </section>

      <Panel title="Текущая демонстрационная конфигурация" eyebrow="Mock data">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {config.map(([label, value]) => (
            <div key={label} className="soft-panel p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
              <p className="mt-2 text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <StatusBadge tone="good">Аккаунт активен</StatusBadge>
          <StatusBadge tone="good">Paymaster активен</StatusBadge>
          <StatusBadge tone="warn">Recovery delay 48 часов</StatusBadge>
          <span className="inline-flex items-center gap-2 text-sm text-muted">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            Приватные ключи в демонстрации не создаются и не хранятся.
          </span>
        </div>
      </Panel>
    </div>
  );
}
