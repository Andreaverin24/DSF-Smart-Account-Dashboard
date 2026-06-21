import { CheckCircle2, Fingerprint, ShieldCheck, UserCheck, UsersRound, XCircle } from 'lucide-react';
import { useState } from 'react';
import { SignerSetPanel } from '../components/signers/SignerSetPanel';
import { ThresholdVisualizer } from '../components/signers/ThresholdVisualizer';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { StatusBadge } from '../components/ui/Badge';
import { demoSignerSets, signerSlots } from '../domain/mockData';
import { canExecuteNormalTransaction } from '../domain/signerRequirements';

const iconById = {
  social: UsersRound,
  device: Fingerprint,
  arbiter: ShieldCheck,
  recovery: UserCheck,
};

export function SignersPage() {
  const [scenarioSigner, setScenarioSigner] = useState<string>('device');
  const [selectedSignerIds, setSelectedSignerIds] = useState<string[]>([
    demoSignerSets.deviceSigners[0]!.signerId,
    demoSignerSets.socialSigners[0]!.signerId,
  ]);
  const activeSigner = signerSlots.find((signer) => signer.id === scenarioSigner) ?? signerSlots[1]!;
  const evaluation = canExecuteNormalTransaction(selectedSignerIds, demoSignerSets);

  function toggleSigner(signerId: string) {
    setSelectedSignerIds((current) =>
      current.includes(signerId) ? current.filter((selectedSignerId) => selectedSignerId !== signerId) : [...current, signerId],
    );
  }

  return (
    <div className="space-y-6">
      <Panel title="Зарегистрированные signer sets" eyebrow="Массивы подписантов">
        <p className="mb-4 rounded-lg border border-accent-500/30 bg-accent-500/10 p-4 text-sm leading-6">
          Индекс подписанта — это удобное имя для интерфейса. Контракт идентифицирует подписанта по устойчивому signerId, производному от публичного ключа или адреса.
        </p>
        <SignerSetPanel signerSets={demoSignerSets} selectedSignerIds={selectedSignerIds} onToggleSigner={toggleSigner} />
        <div className="mt-5">
          <ThresholdVisualizer evaluation={evaluation} />
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        {signerSlots.map((signer) => {
          const Icon = iconById[signer.id as keyof typeof iconById];
          return (
            <Panel key={signer.id} title={signer.title} eyebrow={signer.type}>
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-md bg-accent-500/12 p-3 text-accent-500">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="text-sm leading-6 text-slate-300">{signer.description}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="soft-panel p-3">
                  <p className="text-xs text-muted">Тип ключа</p>
                  <p className="font-semibold">{signer.keyType}</p>
                </div>
                <div className="soft-panel p-3">
                  <p className="text-xs text-muted">Статус</p>
                  <StatusBadge tone={signer.status === 'ACTIVE' ? 'good' : 'warn'}>{signer.status}</StatusBadge>
                </div>
                <div className="soft-panel p-3">
                  <p className="text-xs text-muted">Дата добавления</p>
                  <p className="font-semibold">{signer.addedAt}</p>
                </div>
                {signer.storage && (
                  <div className="soft-panel p-3">
                    <p className="text-xs text-muted">Хранилище</p>
                    <p className="font-semibold">{signer.storage}</p>
                  </div>
                )}
              </div>

              {signer.publicKey && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="soft-panel p-3">
                    <p className="text-xs text-muted">Public key X</p>
                    <code className="text-sm">{signer.publicKey.x}</code>
                  </div>
                  <div className="soft-panel p-3">
                    <p className="text-xs text-muted">Public key Y</p>
                    <code className="text-sm">{signer.publicKey.y}</code>
                  </div>
                </div>
              )}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Разрешения</h3>
                  <ul className="space-y-2">
                    {signer.permissions.map((permission) => (
                      <li key={permission} className="flex gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal-green" aria-hidden="true" />
                        <span>{permission}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Ограничения</h3>
                  <ul className="space-y-2">
                    {signer.restrictions.map((restriction) => (
                      <li key={restriction} className="flex gap-2 text-sm text-slate-300">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-signal-red" aria-hidden="true" />
                        <span>{restriction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Button type="button" className="mt-5" onClick={() => setScenarioSigner(signer.id)}>
                Показать роль в сценариях
              </Button>
            </Panel>
          );
        })}
      </div>

      <Panel title="Роль в сценариях" eyebrow={activeSigner.title}>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="soft-panel p-4">
            <p className="text-sm font-semibold">Обычная операция</p>
            <p className="mt-2 text-sm text-muted">
              {activeSigner.type === 'DEVICE'
                ? 'Device Signer обычно подтверждает ежедневные операции и лимитированные переводы.'
                : 'Этот signer подключается только когда policy engine требует дополнительный фактор.'}
            </p>
          </div>
          <div className="soft-panel p-4">
            <p className="text-sm font-semibold">Критическая операция</p>
            <p className="mt-2 text-sm text-muted">
              {activeSigner.type === 'ARBITER'
                ? 'Arbiter добавляет независимое подтверждение, но не может действовать один.'
                : 'Критические действия требуют комбинацию нескольких независимых подписантов.'}
            </p>
          </div>
          <div className="soft-panel p-4">
            <p className="text-sm font-semibold">Recovery</p>
            <p className="mt-2 text-sm text-muted">
              {activeSigner.type === 'RECOVERY' || activeSigner.type === 'SOCIAL'
                ? 'Этот фактор помогает заменить потерянное устройство без переноса активов.'
                : 'При recovery старый Device может быть заменён, а signer epoch увеличивается.'}
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
