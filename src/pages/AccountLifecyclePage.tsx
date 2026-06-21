import { CheckCircle2, Circle, RotateCcw, ShieldAlert } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { SignerSetPanel } from '../components/signers/SignerSetPanel';
import { ThresholdVisualizer } from '../components/signers/ThresholdVisualizer';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { JsonBlock } from '../components/ui/JsonBlock';
import { Panel } from '../components/ui/Panel';
import { Tooltip } from '../components/ui/Tooltip';
import {
  createEmergencyFreezeState,
  createInitialRegistrationState,
  advanceRegistration,
  isSignatureValidForEpoch,
  lifecycleStages,
  socialSessionDescriptions,
  transitionEmergencyFreeze,
  transitionSocialSession,
} from '../domain/accountLifecycle';
import {
  createDeviceReplacementState,
  transitionDeviceReplacement,
  type DeviceReplacementAction,
} from '../domain/deviceReplacementMachine';
import {
  createSocialReplacementState,
  transitionSocialReplacement,
  type SocialReplacementAction,
} from '../domain/socialReplacementMachine';
import {
  createTransactionLifecycle,
  transitionTransaction,
  type TransactionLifecycleAction,
} from '../domain/transactionLifecycle';
import { demoSignerSets } from '../domain/mockData';
import {
  canEmergencyFreeze,
  canExecuteNormalTransaction,
  canReplaceLostDevices,
  canReplaceSocialSigner,
  canUnfreeze,
} from '../domain/signerRequirements';
import type {
  AccountLifecycleStage,
  SignerLifecycleStatus,
  SmartAccountSignerSets,
  SocialSessionStatus,
  TransactionLifecycleStatus,
} from '../domain/types';

const lifecycleNotice = 'Демонстрационный режим. Ключи, подписи, OAuth и blockchain-операции не создаются.';

const permanentItems = [
  'адрес DSF Smart Account',
  'балансы',
  'DeFi-позиции',
  'история операций',
  'установленные активы',
  'on-chain состояние аккаунта',
];

const mutableItems = [
  'Device Signers[]',
  'Social Signers[]',
  'Recovery Signer',
  'статус подписантов',
  'signerEpoch',
  'recoveryNonce',
  'статус аккаунта ACTIVE/FROZEN',
];

const signerIdNotice =
  'Индекс подписанта — это удобное имя для интерфейса. Контракт идентифицирует подписанта по устойчивому signerId, производному от публичного ключа или адреса.';

const deviceOneSocialZero = [demoSignerSets.deviceSigners[1]!.signerId, demoSignerSets.socialSigners[0]!.signerId];
const deviceZeroSocialOne = [demoSignerSets.deviceSigners[0]!.signerId, demoSignerSets.socialSigners[1]!.signerId];
const twoSocialOneArbiter = [
  demoSignerSets.socialSigners[0]!.signerId,
  demoSignerSets.socialSigners[1]!.signerId,
  demoSignerSets.arbiterSigners[0]!.signerId,
];
const deviceZeroArbiterZero = [demoSignerSets.deviceSigners[0]!.signerId, demoSignerSets.arbiterSigners[0]!.signerId];
const twoArbiters = [demoSignerSets.arbiterSigners[0]!.signerId, demoSignerSets.arbiterSigners[1]!.signerId];

const registrationSteps = [
  {
    title: 'Установка DSF Wallet',
    user: 'Пользователь устанавливает приложение и открывает onboarding.',
    internal: 'Приложение проверяет Android Keystore и готовит локальную демонстрационную модель.',
    chain: 'On-chain действий нет.',
  },
  {
    title: 'Вход через Google',
    user: 'Пользователь выбирает привязанный Google-аккаунт.',
    internal:
      'Google используется для социальной авторизации и получения доступа к Social Signer. Google-аккаунт сам по себе не является Ethereum-приватным ключом.',
    chain: 'OAuth token не записывается в Smart Account.',
  },
  {
    title: 'Создание Social Signer',
    user: 'Пользователь видит подтверждение привязки Social Signer.',
    internal: 'Google OAuth → Social Session → Social Signer → Social Public Identifier.',
    chain: 'Регистрируется публичный идентификатор или verifier-связка, а не пароль Google.',
  },
  {
    title: 'Создание Device Signer',
    user: 'Устройство создаёт локальный фактор подписи.',
    internal: 'Android Keystore → P-256 key pair → private key non-exportable → public key регистрируется в Smart Account.',
    chain: 'В аккаунт попадает только public key.',
  },
  {
    title: 'Биометрическое подтверждение',
    user: 'Пользователь подтверждает создание ключа биометрией устройства.',
    internal: 'Биометрия разрешает использование private key внутри Android Keystore.',
    chain: 'Биометрические данные не отправляются on-chain.',
  },
  {
    title: 'Создание Smart Account',
    user: 'Пользователь получает адрес аккаунта.',
    internal: 'Режим: немедленное развёртывание или контрфактический адрес с развёртыванием при первой UserOperation.',
    chain: 'Factory создаёт аккаунт сразу или позже через initCode/UserOperation.',
  },
  {
    title: 'Аккаунт готов',
    user: 'Приложение показывает готовый кошелёк.',
    internal: 'Device и Social активны, Arbiter ограничен recovery/emergency ролью.',
    chain: 'Signer epoch установлен в 1, Account status ACTIVE.',
  },
];

const transactionStatuses: TransactionLifecycleStatus[] = [
  'CREATED',
  'WAITING_SOCIAL',
  'SOCIAL_SIGNED',
  'WAITING_BIOMETRIC',
  'DEVICE_SIGNED',
  'SUBMITTED',
  'VALIDATED',
  'EXECUTED',
];

const signerStates: Array<{ status: SignerLifecycleStatus; description: string }> = [
  { status: 'NOT_REGISTERED', description: 'Signer ещё не добавлен в аккаунт.' },
  { status: 'ACTIVE', description: 'Signer может участвовать в разрешённых операциях.' },
  { status: 'SUSPENDED', description: 'Signer временно не принимается валидатором.' },
  { status: 'REPLACEMENT_PENDING', description: 'Идёт процедура замены подписанта.' },
  { status: 'REVOKED', description: 'Signer окончательно отозван и больше не может быть восстановлен как прежняя запись.' },
];

export function AccountLifecyclePage() {
  const [selectedStage, setSelectedStage] = useState<AccountLifecycleStage>('INSTALLATION');
  const [tab, setTab] = useState<'user' | 'internal' | 'chain'>('user');
  const [registration, setRegistration] = useState(() => createInitialRegistrationState());
  const [socialSession, setSocialSession] = useState<SocialSessionStatus>('ACTIVE');
  const [deviceTx, setDeviceTx] = useState(() => createTransactionLifecycle('DEVICE_ONLY', 'ACTIVE'));
  const [socialTx, setSocialTx] = useState(() => createTransactionLifecycle('DEVICE_SOCIAL', 'ACTIVE'));
  const [socialExpiredTx, setSocialExpiredTx] = useState(() => createTransactionLifecycle('DEVICE_SOCIAL', 'AUTH_REQUIRED'));
  const [selectedDeviceSignerId, setSelectedDeviceSignerId] = useState(demoSignerSets.deviceSigners[1]!.signerId);
  const [selectedSocialSignerId, setSelectedSocialSignerId] = useState(demoSignerSets.socialSigners[0]!.signerId);
  const [selectedSetSignerIds, setSelectedSetSignerIds] = useState<string[]>(deviceOneSocialZero);
  const [deviceReplacement, setDeviceReplacement] = useState(() => createDeviceReplacementState());
  const [socialReplacement, setSocialReplacement] = useState(() => createSocialReplacementState());
  const [selectedSignerState, setSelectedSignerState] = useState<SignerLifecycleStatus>('ACTIVE');
  const [epochAfterRecovery, setEpochAfterRecovery] = useState(false);
  const [freeze, setFreeze] = useState(() => createEmergencyFreezeState());

  const selectedStageInfo = lifecycleStages.find((stage) => stage.id === selectedStage) ?? lifecycleStages[0]!;
  const activeRegistrationStep = registrationSteps[Math.min(registration.step, registrationSteps.length - 1)]!;
  const currentEpoch = epochAfterRecovery ? 8 : 7;
  const signatureStatus = isSignatureValidForEpoch(7, currentEpoch) ? 'VALID' : 'INVALIDATED_BY_EPOCH_CHANGE';
  const normalSelectedSignerIds = [selectedDeviceSignerId, selectedSocialSignerId];
  const normalEvaluation = canExecuteNormalTransaction(normalSelectedSignerIds, demoSignerSets);
  const selectedSetEvaluation = canExecuteNormalTransaction(selectedSetSignerIds, demoSignerSets);
  const deviceScenarioAEvaluation = canReplaceLostDevices(deviceOneSocialZero, demoSignerSets, true);
  const deviceScenarioBEvaluation = canReplaceLostDevices(twoSocialOneArbiter, demoSignerSets, false);
  const socialScenarioAEvaluation = canReplaceSocialSigner(deviceZeroSocialOne, demoSignerSets, true);
  const socialScenarioBEvaluation = canReplaceSocialSigner(deviceZeroArbiterZero, demoSignerSets, false);
  const emergencyFreezeEvaluation = canEmergencyFreeze(twoArbiters, demoSignerSets);
  const unfreezeEvaluation = canUnfreeze(deviceOneSocialZero, demoSignerSets);

  function runDeviceAction(action: DeviceReplacementAction) {
    setDeviceReplacement((current) => transitionDeviceReplacement(current, action));
  }

  function runSocialAction(action: SocialReplacementAction) {
    setSocialReplacement((current) => transitionSocialReplacement(current, action));
  }

  function toggleSetSigner(signerId: string) {
    setSelectedSetSignerIds((current) =>
      current.includes(signerId) ? current.filter((selectedSignerId) => selectedSignerId !== signerId) : [...current, signerId],
    );
  }

  function advanceDeviceTransaction() {
    const actionByStatus: Partial<Record<TransactionLifecycleStatus, TransactionLifecycleAction>> = {
      CREATED: 'OPEN_BIOMETRIC',
      WAITING_BIOMETRIC: 'SIGN_DEVICE',
      DEVICE_SIGNED: 'SUBMIT',
      SUBMITTED: 'VALIDATE',
      VALIDATED: 'EXECUTE',
    };
    const action = actionByStatus[deviceTx.status] ?? 'RESET';
    setDeviceTx((current) => transitionTransaction(current, action));
  }

  function advanceSocialTransaction(expired: boolean) {
    const current = expired ? socialExpiredTx : socialTx;
    const actionByStatus: Partial<Record<TransactionLifecycleStatus, TransactionLifecycleAction>> = {
      CREATED: current.socialSessionStatus === 'ACTIVE' ? 'SIGN_SOCIAL' : 'CONTINUE_SOCIAL',
      WAITING_SOCIAL: 'SIGN_SOCIAL',
      SOCIAL_SIGNED: 'OPEN_BIOMETRIC',
      WAITING_BIOMETRIC: 'SIGN_DEVICE',
      DEVICE_SIGNED: 'SUBMIT',
      SUBMITTED: 'VALIDATE',
      VALIDATED: 'EXECUTE',
    };
    const action = actionByStatus[current.status] ?? 'RESET';
    const update = (state: typeof current) => transitionTransaction(state, action);
    if (expired) {
      setSocialExpiredTx(update);
    } else {
      setSocialTx(update);
    }
  }

  return (
    <div className="space-y-6">
      <Panel title="Жизненный цикл DSF Smart Account" eyebrow="Account lifecycle">
        <div className="rounded-lg border border-accent-500/30 bg-accent-500/10 p-5">
          <p className="text-xl font-semibold leading-8">
            Smart Account остаётся прежним. При восстановлении меняются подписанты, а не адрес кошелька и не владелец активов.
          </p>
          <p className="mt-3 text-sm text-muted">{lifecycleNotice}</p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <StableMutableCard title="Постоянные элементы" items={permanentItems} />
          <StableMutableCard title="Изменяемые элементы" items={mutableItems} />
        </div>
      </Panel>

      <Panel title="Общая временная линия" eyebrow="Кликабельные этапы">
        <div className="grid gap-5 xl:grid-cols-[minmax(260px,420px)_minmax(0,1fr)]">
          <div className="grid gap-2">
            {lifecycleStages.map((stage, index) => (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStage(stage.id)}
                className={`rounded-lg border p-3 text-left transition ${
                  selectedStage === stage.id
                    ? 'border-accent-500 bg-accent-500/12'
                    : 'border-white/10 bg-white/[0.04] hover:border-accent-500/50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/8 text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="font-semibold">{stage.title}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="soft-panel p-5">
            <h3 className="text-lg font-semibold">{selectedStageInfo.title}</h3>
            <ExplanationTabs tab={tab} onTabChange={setTab} />
            <p className="mt-4 leading-7">
              {tab === 'user' && selectedStageInfo.userSees}
              {tab === 'internal' && selectedStageInfo.appDoes}
              {tab === 'chain' && selectedStageInfo.onChain}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <InfoBox label="Подписанты" value={selectedStageInfo.signers} />
              <InfoBox label="Изменяется" value={selectedStageInfo.changes} />
              <InfoBox label="Не меняется" value={selectedStageInfo.unchanged} />
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Регистрация и первая установка" eyebrow="Interactive onboarding">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {registrationSteps.map((step, index) => (
                <span
                  key={step.title}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    index <= registration.step ? 'border-accent-500 bg-accent-500/15 text-accent-500' : 'border-white/10 text-muted'
                  }`}
                >
                  {index + 1}. {step.title}
                </span>
              ))}
            </div>
            <div className="soft-panel p-5">
              <h3 className="text-lg font-semibold">{activeRegistrationStep.title}</h3>
              <ExplanationTabs tab={tab} onTabChange={setTab} />
              <p className="mt-4 leading-7">
                {tab === 'user' && activeRegistrationStep.user}
                {tab === 'internal' && activeRegistrationStep.internal}
                {tab === 'chain' && activeRegistrationStep.chain}
              </p>
              <p className="mt-5 rounded-lg border border-accent-500/30 bg-accent-500/10 p-3 text-sm leading-6">
                {signerIdNotice}
              </p>
              <p className="mt-3 rounded-lg border border-signal-amber/40 bg-signal-amber/10 p-3 text-sm leading-6">
                Для полного восстановления при потере всех устройств рекомендуется зарегистрировать не менее трёх независимых Social Signer.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <InfoBox label="DeviceSigners[]" value={summarizeSignerSets(registration.signerSets, 'DEVICE')} />
                <InfoBox label="SocialSigners[]" value={summarizeSignerSets(registration.signerSets, 'SOCIAL')} />
                <InfoBox label="ArbiterSigners[]" value={summarizeSignerSets(registration.signerSets, 'ARBITER')} />
                <InfoBox label="Signer epoch" value={String(registration.signerEpoch)} />
              </div>
              <div className="mt-5">
                <SignerSetPanel
                  signerSets={registration.signerSets}
                  selectedSignerIds={[]}
                  onToggleSigner={() => undefined}
                  availabilityLabel={(signer) => (signer.status === 'ACTIVE' ? 'Зарегистрирован и активен' : 'Будет добавлен на следующем шаге')}
                />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Button type="button" variant="primary" onClick={() => setRegistration((current) => advanceRegistration(current))}>
              Запустить демонстрацию регистрации
            </Button>
            <Button type="button" variant="ghost" onClick={() => setRegistration(createInitialRegistrationState())} icon={<RotateCcw className="h-4 w-4" />}>
              Сбросить
            </Button>
            <JsonBlock
              label="Mock-состояние"
              value={{
                smartAccount: registration.smartAccountReady ? '0x71C4...9A12' : 'ещё не готов',
                deviceSigners: registration.signerSets.deviceSigners,
                socialSigners: registration.signerSets.socialSigners,
                arbiterSigners: registration.signerSets.arbiterSigners,
                signerEpoch: registration.signerEpoch,
                accountStatus: registration.accountStatus,
              }}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Signer sets и пороговая авторизация" eyebrow="DeviceSigners[] / SocialSigners[] / ArbiterSigners[]">
        <p className="mb-4 rounded-lg border border-accent-500/30 bg-accent-500/10 p-4 text-sm leading-6">
          {signerIdNotice}
        </p>
        <SignerSetPanel signerSets={demoSignerSets} selectedSignerIds={selectedSetSignerIds} onToggleSigner={toggleSetSigner} />
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <ThresholdVisualizer evaluation={selectedSetEvaluation} />
          <div className="soft-panel p-5">
            <h3 className="text-base font-semibold">Быстрые примеры</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" onClick={() => setSelectedSetSignerIds(deviceOneSocialZero)}>
                Device[1] + Social[0]
              </Button>
              <Button type="button" onClick={() => setSelectedSetSignerIds(twoSocialOneArbiter)}>
                Social[0] + Social[1] + Arbiter[0]
              </Button>
              <Button type="button" onClick={() => setSelectedSetSignerIds(twoArbiters)}>
                Arbiter[0] + Arbiter[1]
              </Button>
              <Button type="button" variant="ghost" onClick={() => setSelectedSetSignerIds([])}>
                Сбросить выбор
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Что происходит при запуске приложения" eyebrow="Device check и Social session">
        <div className="grid gap-5 xl:grid-cols-2">
          <Checklist
            title="Device Signer check"
            items={[
              'ключ найден в Android Keystore',
              'public key соответствует зарегистрированному',
              'ключ не отозван',
              'подпись не создаётся',
              'биометрия пока не требуется',
            ]}
          />
          <div className="soft-panel p-5">
            <h3 className="mb-4 text-lg font-semibold">Social Signer check</h3>
            <Checklist
              title="Фоновая проверка"
              items={[
                'проверяется существование social-сессии',
                'проверяется срок действия',
                'refresh выполняется в фоне при возможности',
                'проверяется соответствие зарегистрированному Social Signer',
                'подпись не создаётся заранее',
              ]}
            />
            <div className="mt-5 flex flex-wrap gap-2">
              {Object.keys(socialSessionDescriptions).map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={socialSession === status ? 'primary' : 'secondary'}
                  onClick={() => setSocialSession(status as SocialSessionStatus)}
                >
                  {status}
                </Button>
              ))}
              <Button type="button" variant="ghost" onClick={() => setSocialSession((current) => transitionSocialSession(current))}>
                Следующий статус
              </Button>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">{socialSessionDescriptions[socialSession]}</p>
          </div>
        </div>
      </Panel>

      <Panel title="Обычная транзакция через Device Signer" eyebrow="Депозит 1 000 USDT в DSF">
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="soft-panel p-5">
            <InfoBox label="Вы отправляете" value="1 000 USDT" />
            <InfoBox label="Получаете" value="≈ 998 DSF LP" />
            <InfoBox label="Авторизация" value={formatSignerCombination(normalSelectedSignerIds, demoSignerSets)} />
            <InfoBox label="Подтверждение" value="Биометрия устройства" />
            <div className="mt-4 grid gap-3">
              <label className="block text-sm">
                <span className="mb-2 block font-medium">Выбрать Device Signer</span>
                <select
                  className="min-h-10 w-full rounded-md border border-white/10 bg-white/8 px-3 py-2 text-sm"
                  value={selectedDeviceSignerId}
                  onChange={(event) => setSelectedDeviceSignerId(event.target.value)}
                >
                  {demoSignerSets.deviceSigners
                    .filter((signer) => signer.status === 'ACTIVE')
                    .map((signer) => (
                      <option key={signer.signerId} value={signer.signerId}>
                        Device[{signer.displayIndex}] — {signer.label}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-2 block font-medium">Выбрать Social Signer</span>
                <select
                  className="min-h-10 w-full rounded-md border border-white/10 bg-white/8 px-3 py-2 text-sm"
                  value={selectedSocialSignerId}
                  onChange={(event) => setSelectedSocialSignerId(event.target.value)}
                >
                  {demoSignerSets.socialSigners
                    .filter((signer) => signer.status === 'ACTIVE')
                    .map((signer) => (
                      <option key={signer.signerId} value={signer.signerId}>
                        Social[{signer.displayIndex}] — {signer.label}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="primary" onClick={advanceDeviceTransaction}>
                Смоделировать Device-транзакцию
              </Button>
              <Button type="button" variant="ghost" onClick={() => setDeviceTx(createTransactionLifecycle('DEVICE_ONLY', 'ACTIVE'))}>
                Сбросить
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <ThresholdVisualizer evaluation={normalEvaluation} />
            <JsonBlock
              label="Mock authorization payload"
              value={{
                mode: 'DEVICE_SOCIAL',
                deviceSignatures: [
                  {
                    signerId: selectedDeviceSignerId,
                    signature: '0xDeviceSignature...',
                  },
                ],
                socialSignatures: [
                  {
                    signerId: selectedSocialSignerId,
                    signature: '0xSocialSignature...',
                  },
                ],
                arbiterSignatures: [],
              }}
            />
            <StatusFlow
              statuses={['CREATED', 'WAITING_BIOMETRIC', 'DEVICE_SIGNED', 'SUBMITTED', 'VALIDATED', 'EXECUTED']}
              current={deviceTx.status}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Device Signer + Social Signer" eyebrow="Одна кнопка, несколько подписей">
        <p className="mb-5 rounded-lg border border-accent-500/30 bg-accent-500/10 p-4 text-sm leading-6">
          Одна кнопка в интерфейсе не означает одну подпись. Приложение может собрать несколько независимых подписей внутри одного пользовательского действия.
        </p>
        <div className="grid gap-5 xl:grid-cols-2">
          <DualSignerScenario
            title="Social session active"
            state={socialTx}
            onNext={() => advanceSocialTransaction(false)}
            onReset={() => setSocialTx(createTransactionLifecycle('DEVICE_SOCIAL', 'ACTIVE'))}
            note="Social signature создаётся в фоне; пользователь видит только биометрию."
          />
          <DualSignerScenario
            title="Social session expired"
            state={socialExpiredTx}
            onNext={() => advanceSocialTransaction(true)}
            onReset={() => setSocialExpiredTx(createTransactionLifecycle('DEVICE_SOCIAL', 'AUTH_REQUIRED'))}
            note="Появляется шаг «Продолжить через Google», затем требуется биометрия Device Signer."
          />
        </div>
        <div className="mt-5">
          <JsonBlock
            label="Mock payload"
            value={{
              mode: 'DEVICE_SOCIAL',
              deviceSignatures: [
                {
                  signerId: selectedDeviceSignerId,
                  signature: '0xDeviceSignature...',
                },
              ],
              socialSignatures: [
                {
                  signerId: selectedSocialSignerId,
                  signature: '0xSocialSignature...',
                },
              ],
              arbiterSignatures: [],
            }}
          />
        </div>
      </Panel>

      <Panel title="Потеря устройства" eyebrow="ReplaceDeviceRequest">
        <div className="mb-5 grid gap-4 xl:grid-cols-2">
          <div className="soft-panel p-5">
            <h3 className="text-lg font-semibold">Сценарий A: есть другой активный Device</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Device[0] потерян, но Device[1] ACTIVE и Social[0] ACTIVE. Пользователь сохраняет обычный порог, поэтому Arbiter не требуется.
            </p>
            <p className="mt-3 text-sm">Device[1] + Social[0] → suspend Device[0] → revoke Device[0].</p>
            <div className="mt-4">
              <ThresholdVisualizer evaluation={deviceScenarioAEvaluation} />
            </div>
          </div>
          <div className="soft-panel p-5">
            <h3 className="text-lg font-semibold">Сценарий B: потеряны все Device</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Когда пользователь больше не может собрать обычный пользовательский порог, нужен усиленный recovery: два Social и один Arbiter из массива ArbiterSigners[].
            </p>
            <p className="mt-3 text-sm">Social[0] + Social[1] + Arbiter[0] → New Device[2].</p>
            <div className="mt-4">
              <ThresholdVisualizer evaluation={deviceScenarioBEvaluation} />
            </div>
          </div>
        </div>
        <p className="mb-5 rounded-lg border border-signal-amber/40 bg-signal-amber/10 p-4 text-sm leading-6">
          Arbiter нужен только тогда, когда пользователь больше не может собрать обычный пользовательский порог.
        </p>
        <WizardGrid
          left={
            <>
              <InfoBox label="Old Device" value={deviceReplacement.oldDeviceStatus} />
              <InfoBox label="New Device" value={deviceReplacement.newDeviceStatus} />
              <InfoBox label="Signer epoch" value={`${deviceReplacement.signerEpochBefore} → ${deviceReplacement.signerEpochAfter}`} />
              <InfoBox label="Session keys" value={deviceReplacement.sessionKeysRevoked ? 'Отозваны' : 'Активны'} />
              <p className="mt-4 text-sm leading-6 text-muted">
                Arbiter не выбирает новый ключ. Новый ключ создаётся на устройстве пользователя. Arbiter только подтверждает строго типизированный запрос на перепривязку.
              </p>
            </>
          }
          right={
            <>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => runDeviceAction('START')}>Начать перепривязку Device</Button>
                <Button type="button" onClick={() => runDeviceAction('APPROVE_SOCIAL')}>Подтвердить Social</Button>
                <Button type="button" onClick={() => runDeviceAction('APPROVE_ARBITER')}>Подтвердить Arbiter</Button>
                <Button type="button" onClick={() => runDeviceAction('SUSPEND_OLD')}>Приостановить старый Device</Button>
                <Button type="button" onClick={() => runDeviceAction('ACTIVATE_NEW')}>Активировать новый Device</Button>
                <Button type="button" variant="ghost" onClick={() => runDeviceAction('RESET')}>Сбросить сценарий</Button>
              </div>
              <JsonBlock label="ReplaceDeviceRequest" value={deviceReplacement.request} />
            </>
          }
        />
      </Panel>

      <Panel title="Потеря или компрометация Social Signer" eyebrow="ReplaceSocialRequest">
        <div className="mb-5 grid gap-4 xl:grid-cols-2">
          <div className="soft-panel p-5">
            <h3 className="text-lg font-semibold">Сценарий A: есть другой Social</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Social[0] скомпрометирован, но Social[1] ACTIVE и Device[0] ACTIVE. Arbiter не требуется, потому что пользователь сохраняет обычный порог.
            </p>
            <p className="mt-3 text-sm">Device[0] + Social[1] → suspend Social[0] → revoke Social[0].</p>
            <div className="mt-4">
              <ThresholdVisualizer evaluation={socialScenarioAEvaluation} />
            </div>
          </div>
          <div className="soft-panel p-5">
            <h3 className="text-lg font-semibold">Сценарий B: других Social нет</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Если других активных Social Signer нет, замену подтверждают Device[0] и Arbiter[0].
            </p>
            <p className="mt-3 text-sm">Device[0] + Arbiter[0] → добавить новый Social → revoke старый Social.</p>
            <div className="mt-4">
              <ThresholdVisualizer evaluation={socialScenarioBEvaluation} />
            </div>
          </div>
        </div>
        <WizardGrid
          left={
            <>
              <p className="mb-4 rounded-lg border border-signal-amber/40 bg-signal-amber/10 p-3 text-sm">
                Потерян Social → Device + другой активный Social. Если другого Social нет, требуется Device + Arbiter.
              </p>
              <InfoBox label="Old Social" value={socialReplacement.oldSocialStatus} />
              <InfoBox label="New Social" value={socialReplacement.newSocialStatus} />
              <InfoBox label="Signer epoch" value={`${socialReplacement.signerEpochBefore} → ${socialReplacement.signerEpochAfter}`} />
              <InfoBox label="recoveryNonce" value={`${socialReplacement.recoveryNonceBefore} → ${socialReplacement.recoveryNonceAfter}`} />
            </>
          }
          right={
            <>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => runSocialAction('REPORT_COMPROMISE')}>Сообщить о компрометации Social</Button>
                <Button type="button" onClick={() => runSocialAction('APPROVE_DEVICE')}>Подтвердить Device</Button>
                <Button type="button" onClick={() => runSocialAction('APPROVE_ARBITER')}>Подтвердить Arbiter</Button>
                <Button type="button" onClick={() => runSocialAction('SUSPEND_OLD')}>Приостановить старый Social</Button>
                <Button type="button" onClick={() => runSocialAction('LINK_NEW_SOCIAL')}>Привязать новый Social</Button>
                <Button type="button" onClick={() => runSocialAction('EXECUTE')}>Завершить замену</Button>
                <Button type="button" variant="ghost" onClick={() => runSocialAction('RESET')}>Сбросить сценарий</Button>
              </div>
              <JsonBlock label="ReplaceSocialRequest" value={socialReplacement.request} />
            </>
          }
        />
      </Panel>

      <Panel title="Симметричная модель восстановления" eyebrow="Recovery symmetry">
        <div className="grid gap-4 xl:grid-cols-3">
          <FlowCard title="Потерян один Device" steps={['Device[1] + Social[0]', 'отзыв Device[0] без Arbiter']} />
          <FlowCard title="Потерян один Social" steps={['Device[0] + Social[1]', 'отзыв Social[0] без Arbiter']} />
          <FlowCard
            title="Потеряны все Device"
            steps={['Social[0] + Social[1] + Arbiter[0]', 'новый Device[2]', 'отзыв потерянных Device']}
          />
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <FlowCard
            title="Device и часть Social потеряны"
            steps={['Device[0] LOST, Device[1] LOST', 'Social[0] LOST, Social[1] ACTIVE, Social[2] ACTIVE', 'Social[1] + Social[2] + Arbiter[0] → новый Device', 'New Device + Social[1] → отзыв Social[0]']}
          />
          <div className="rounded-lg border border-signal-red/50 bg-signal-red/10 p-5">
            <h3 className="text-lg font-semibold">Все Device и все Social потеряны</h3>
            <p className="mt-3 text-sm leading-6">
              Если пользователь потерял все собственные факторы, обычная криптографическая процедура восстановления невозможна. Поэтому DSF рекомендует заранее зарегистрировать минимум три независимых Social Signer и, при необходимости, отдельный резервный recovery-фактор.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <Checklist title="Arbiter может" items={['подтверждать перепривязку Device', 'подтверждать перепривязку Social', 'инициировать Emergency Freeze по схеме 2-of-3 Arbiter', 'участвовать в чрезвычайной процедуре']} />
          <Checklist title="Arbiter не может" items={['подписывать обычные DeFi-операции', 'переводить токены', 'выполнять swap', 'делать approve', 'выбирать новый ключ пользователя', 'единолично менять signer', 'единолично размораживать аккаунт']} />
        </div>
      </Panel>

      <Panel title="Signer states" eyebrow="State diagram">
        <div className="grid gap-3 md:grid-cols-5">
          {signerStates.map((state) => (
            <button
              key={state.status}
              type="button"
              onClick={() => setSelectedSignerState(state.status)}
              className={`rounded-lg border p-4 text-left text-sm ${
                selectedSignerState === state.status ? 'border-accent-500 bg-accent-500/12' : 'border-white/10 bg-white/[0.04]'
              }`}
            >
              <span className="font-semibold">{state.status}</span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">
          {signerStates.find((state) => state.status === selectedSignerState)?.description}
        </p>
      </Panel>

      <Panel title="Signer epoch" eyebrow="Replay protection">
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-4">
            <InfoBox label="До recovery" value="signerEpoch = 7" />
            <pre className="code-block">
              <code>{`hash(
  account,
  chainId,
  nonce,
  signerEpoch = 7,
  callDataHash
)`}</code>
            </pre>
            <Button type="button" variant={epochAfterRecovery ? 'primary' : 'secondary'} onClick={() => setEpochAfterRecovery((current) => !current)}>
              Выполнить recovery
            </Button>
          </div>
          <div className="soft-panel p-5">
            <InfoBox label="После recovery" value={`signerEpoch = ${currentEpoch}`} />
            <StatusBadge tone={signatureStatus === 'VALID' ? 'good' : 'bad'}>{signatureStatus}</StatusBadge>
            <p className="mt-4 text-sm leading-6 text-muted">
              Все старые подписи, сформированные для signerEpoch 7, больше не принимаются после перехода на signerEpoch 8.
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Emergency Freeze" eyebrow="Strictly typed emergency request">
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="soft-panel p-5">
            <InfoBox label="Account status" value={freeze.accountStatus} />
            <InfoBox label="Arbiter request" value={freeze.arbiterRequested ? 'Создан' : 'Нет'} />
            <InfoBox label="Signers restored" value={freeze.signersRestored ? 'Да' : 'Нет'} />
            <div className="mt-4 space-y-4">
              <ThresholdVisualizer evaluation={emergencyFreezeEvaluation} />
              <ThresholdVisualizer evaluation={unfreezeEvaluation} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" onClick={() => setFreeze((current) => transitionEmergencyFreeze(current, 'FREEZE'))}>Смоделировать Emergency Freeze</Button>
              <Button type="button" onClick={() => setFreeze((current) => transitionEmergencyFreeze(current, 'RESTORE_SIGNERS'))}>Восстановить подписантов</Button>
              <Button type="button" onClick={() => setFreeze((current) => transitionEmergencyFreeze(current, 'UNFREEZE_DEVICE_SOCIAL'))}>Подтвердить Unfreeze</Button>
              <Button type="button" variant="ghost" onClick={() => setFreeze((current) => transitionEmergencyFreeze(current, 'RESET'))}>Сбросить</Button>
            </div>
          </div>
          <Checklist
            title="Что происходит"
            items={[
              'Arbiter обнаруживает чрезвычайное событие',
              'формируется EMERGENCY_FREEZE request',
              'Smart Account переходит ACTIVE → FROZEN',
              'обычные DeFi-операции блокируются',
              'средства не перемещаются',
              'Arbiter не получает доступ к активам',
              'Device + Social подтверждают Unfreeze',
              'Account возвращается FROZEN → ACTIVE',
            ]}
          />
        </div>
      </Panel>

      <Panel title="Что остаётся неизменным" eyebrow="Account identity">
        <div className="grid gap-5 xl:grid-cols-2">
          <Checklist title="Не изменяется" items={['Smart Account address', 'токен-балансы', 'NFT', 'DeFi-позиции', 'allowances', 'история', 'адреса протокольных позиций']} />
          <Checklist title="Изменяется" items={['signer public key', 'signer status', 'signerEpoch', 'recoveryNonce', 'связанные session keys', 'pending recovery requests']} />
        </div>
        <p className="mt-5 rounded-lg border border-accent-500/30 bg-accent-500/10 p-4 text-sm leading-6">
          Активы принадлежат Smart Account, а не конкретному Device Signer или Social Signer.
        </p>
      </Panel>

      <Panel title="Термины" eyebrow="Tooltips">
        <div className="flex flex-wrap gap-4 text-sm">
          <Tooltip label="Ключ P-256 в защищённом хранилище устройства. Private key не экспортируется.">Device Signer</Tooltip>
          <Tooltip label="Подписант, связанный с социальным провайдером вроде Google, Apple, Privy или Web3Auth.">Social Signer</Tooltip>
          <Tooltip label="Независимый фактор для recovery, risk approval и emergency freeze, без права единолично управлять активами.">Arbiter</Tooltip>
          <Tooltip label="Версия набора подписантов. Рост epoch инвалидирует подписи предыдущей версии.">signerEpoch</Tooltip>
          <Tooltip label="Счётчик recovery-запросов, защищающий от повторного исполнения старых запросов.">recoveryNonce</Tooltip>
          <Tooltip label="Контрактный аккаунт, которому принадлежат активы и который проверяет политики авторизации.">Smart Account</Tooltip>
          <Tooltip label="Защищённое хранилище Android для создания и использования неэкспортируемых ключей.">Android Keystore</Tooltip>
          <Tooltip label="Объект ERC-4337, который Bundler доставляет в EntryPoint вместо обычной транзакции пользователя.">UserOperation</Tooltip>
        </div>
      </Panel>
    </div>
  );
}

function summarizeSignerSets(signerSets: SmartAccountSignerSets, kind: 'DEVICE' | 'SOCIAL' | 'ARBITER'): string {
  const signers =
    kind === 'DEVICE' ? signerSets.deviceSigners : kind === 'SOCIAL' ? signerSets.socialSigners : signerSets.arbiterSigners;
  const activeCount = signers.filter((signer) => signer.status === 'ACTIVE').length;

  return `${activeCount}/${signers.length} ACTIVE`;
}

function formatSignerCombination(signerIds: string[], signerSets: SmartAccountSignerSets): string {
  return signerIds.map((signerId) => formatSignerLabel(signerId, signerSets)).join(' + ');
}

function formatSignerLabel(signerId: string, signerSets: SmartAccountSignerSets): string {
  const device = signerSets.deviceSigners.find((signer) => signer.signerId === signerId);
  if (device) {
    return `Device[${device.displayIndex}]`;
  }

  const social = signerSets.socialSigners.find((signer) => signer.signerId === signerId);
  if (social) {
    return `Social[${social.displayIndex}]`;
  }

  const arbiter = signerSets.arbiterSigners.find((signer) => signer.signerId === signerId);
  if (arbiter) {
    return `Arbiter[${arbiter.displayIndex}]`;
  }

  return 'Unknown signer';
}

function ExplanationTabs({
  tab,
  onTabChange,
}: {
  tab: 'user' | 'internal' | 'chain';
  onTabChange: (tab: 'user' | 'internal' | 'chain') => void;
}) {
  const tabs = [
    ['user', 'Что видит пользователь'],
    ['internal', 'Что происходит внутри'],
    ['chain', 'Что меняется on-chain'],
  ] as const;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tabs.map(([id, label]) => (
        <Button key={id} type="button" variant={tab === id ? 'primary' : 'secondary'} onClick={() => onTabChange(id)}>
          {label}
        </Button>
      ))}
    </div>
  );
}

function StableMutableCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="soft-panel p-5">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 rounded-lg border border-white/10 bg-black/10 p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="soft-panel p-5">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal-green" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusFlow({ statuses, current }: { statuses: TransactionLifecycleStatus[]; current: TransactionLifecycleStatus }) {
  const currentIndex = Math.max(statuses.indexOf(current), 0);

  return (
    <div className="soft-panel p-5">
      <div className="grid gap-3 md:grid-cols-3">
        {statuses.map((status, index) => (
          <div key={status} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/10 p-3 text-sm">
            {index <= currentIndex ? (
              <CheckCircle2 className="h-4 w-4 text-accent-500" aria-hidden="true" />
            ) : (
              <Circle className="h-4 w-4 text-muted" aria-hidden="true" />
            )}
            <span>{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DualSignerScenario({
  title,
  state,
  onNext,
  onReset,
  note,
}: {
  title: string;
  state: ReturnType<typeof createTransactionLifecycle>;
  onNext: () => void;
  onReset: () => void;
  note: string;
}) {
  const statuses = useMemo(
    () =>
      state.socialSessionStatus === 'ACTIVE'
        ? (['CREATED', 'SOCIAL_SIGNED', 'WAITING_BIOMETRIC', 'DEVICE_SIGNED', 'SUBMITTED', 'VALIDATED', 'EXECUTED'] as TransactionLifecycleStatus[])
        : transactionStatuses,
    [state.socialSessionStatus],
  );

  return (
    <div className="soft-panel p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{note}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="primary" onClick={onNext}>Продолжить сценарий</Button>
        <Button type="button" variant="ghost" onClick={onReset}>Сбросить</Button>
      </div>
      <div className="mt-4">
        <StatusFlow statuses={statuses} current={state.status} />
      </div>
    </div>
  );
}

function WizardGrid({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid min-w-0 max-w-full gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="soft-panel min-w-0 max-w-full overflow-hidden p-5">{left}</div>
      <div className="min-w-0 max-w-full space-y-4 overflow-hidden">{right}</div>
    </div>
  );
}

function FlowCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="soft-panel p-5">
      <div className="mb-4 flex items-center gap-3">
        <ShieldAlert className="h-5 w-5 text-signal-amber" aria-hidden="true" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step} className="rounded-lg border border-white/10 bg-black/10 p-3 text-sm">
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
