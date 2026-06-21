import type {
  AccountLifecycleRegistrationState,
  AccountLifecycleStage,
  EmergencyFreezeState,
  SignerLifecycleStatus,
  SocialSessionStatus,
} from './types';
import { createRegistrationSignerSets } from './mockData';

export interface LifecycleStageInfo {
  id: AccountLifecycleStage;
  title: string;
  userSees: string;
  appDoes: string;
  onChain: string;
  signers: string;
  changes: string;
  unchanged: string;
}

export const lifecycleStages: LifecycleStageInfo[] = [
  {
    id: 'INSTALLATION',
    title: 'Установка',
    userSees: 'Пользователь устанавливает DSF Wallet и открывает первый экран.',
    appDoes: 'Приложение готовит локальное состояние и проверяет доступность защищённого хранилища.',
    onChain: 'On-chain действий нет.',
    signers: 'Подписанты ещё не созданы.',
    changes: 'Создаётся только локальный onboarding state.',
    unchanged: 'Адрес Smart Account, балансы и DeFi-позиции ещё отсутствуют или не меняются.',
  },
  {
    id: 'SOCIAL_AUTH',
    title: 'Регистрация',
    userSees: 'Пользователь выбирает вход через Google или другой Social Provider.',
    appDoes: 'Приложение получает social-сессию без хранения OAuth token в Smart Account.',
    onChain: 'On-chain действий ещё может не быть.',
    signers: 'Готовится Social Signer.',
    changes: 'Появляется привязанный Social Public Identifier.',
    unchanged: 'Google-аккаунт не становится приватным ключом Ethereum.',
  },
  {
    id: 'DEVICE_CREATION',
    title: 'Создание подписантов',
    userSees: 'Пользователь подтверждает создание ключа и биометрию устройства.',
    appDoes: 'Android Keystore создаёт P-256 key pair с неэкспортируемым private key.',
    onChain: 'Public key будет зарегистрирован в Smart Account или init data.',
    signers: 'DeviceSigners[] и SocialSigners[].',
    changes: 'Device public key добавляется в конфигурацию аккаунта.',
    unchanged: 'Private key не покидает устройство.',
  },
  {
    id: 'ACCOUNT_CREATION',
    title: 'Создание Smart Account',
    userSees: 'Пользователь видит адрес кошелька и статус готовности.',
    appDoes: 'Приложение либо разворачивает контракт, либо вычисляет counterfactual address.',
    onChain: 'Factory может создать аккаунт при первой UserOperation.',
    signers: 'DeviceSigners[], SocialSigners[] и ArbiterSigners[] как recovery/emergency факторы.',
    changes: 'Регистрируются правила авторизации.',
    unchanged: 'Адрес определяется контрактной логикой, а не конкретным устройством.',
  },
  {
    id: 'READY',
    title: 'Ежедневная работа',
    userSees: 'Приложение запускается без повторного onboarding.',
    appDoes: 'Проверяются Device Signer и social-сессия без предварительного создания подписи.',
    onChain: 'On-chain действий нет до операции пользователя.',
    signers: 'Device активен, Social проверяется в фоне.',
    changes: 'Может обновиться social-сессия.',
    unchanged: 'Smart Account address, балансы и позиции не меняются.',
  },
  {
    id: 'TRANSACTION',
    title: 'Обычная транзакция',
    userSees: 'Одна кнопка подтверждения и биометрия устройства.',
    appDoes: 'Создаётся UserOperation, userOpHash и одна или несколько подписей.',
    onChain: 'EntryPoint вызывает validateUserOp и execute.',
    signers: 'Device или Device + Social по политике риска.',
    changes: 'Меняется состояние целевого протокола, если операция исполнена.',
    unchanged: 'Подписанты не меняются.',
  },
  {
    id: 'DEVICE_REPLACEMENT',
    title: 'Потеря Device',
    userSees: 'Пользователь входит на новом устройстве через Social Account.',
    appDoes: 'Создаётся новый P-256 Device Signer и ReplaceDeviceRequest.',
    onChain: 'Старый Device отзывается, новый становится ACTIVE, signerEpoch растёт.',
    signers: 'Если активный Device остался: Device + Social. Если потеряны все Device: 2 Social + 1 Arbiter.',
    changes: 'Записи DeviceSigners[], signerEpoch, session keys.',
    unchanged: 'Smart Account address, балансы и DeFi-позиции.',
  },
  {
    id: 'SOCIAL_REPLACEMENT',
    title: 'Потеря Social',
    userSees: 'Пользователь сообщает о компрометации и привязывает новый Social Account.',
    appDoes: 'Формируется ReplaceSocialRequest.',
    onChain: 'Старый Social отзывается, новый становится ACTIVE.',
    signers: 'Если другой Social остался: Device + Social. Если других Social нет: Device + Arbiter.',
    changes: 'Записи SocialSigners[], signerEpoch, recoveryNonce.',
    unchanged: 'Адрес аккаунта и активы.',
  },
  {
    id: 'EMERGENCY_FREEZE',
    title: 'Emergency Freeze',
    userSees: 'Обычные операции временно заблокированы.',
    appDoes: 'Показывает статус FROZEN и доступные recovery-действия.',
    onChain: 'Smart Account переходит ACTIVE → FROZEN.',
    signers: 'Emergency Freeze требует 2-of-3 ArbiterSigners.',
    changes: 'Account status.',
    unchanged: 'Средства не перемещаются, Arbiter не получает доступ к активам.',
  },
  {
    id: 'UNFREEZE',
    title: 'Unfreeze',
    userSees: 'Пользователь подтверждает разморозку после восстановления контроля.',
    appDoes: 'Собирает Device + Social approval.',
    onChain: 'Smart Account переходит FROZEN → ACTIVE.',
    signers: 'Device + Social, не Arbiter-only.',
    changes: 'Account status.',
    unchanged: 'Балансы, NFT, позиции и история.',
  },
];

export const socialSessionDescriptions: Record<SocialSessionStatus, string> = {
  ACTIVE: 'Повторный вход через Google не требуется.',
  REFRESHING: 'Сессия обновляется в фоне.',
  AUTH_REQUIRED: 'Необходимо снова подтвердить привязанный Google-аккаунт.',
  REVOKED: 'Этот Social Signer больше не является активным подписантом аккаунта.',
  UNAVAILABLE:
    'Social Provider временно недоступен. Device-only операции могут продолжать работать, если политика аккаунта это разрешает.',
};

export function createInitialRegistrationState(): AccountLifecycleRegistrationState {
  return {
    step: 0,
    signerSets: createRegistrationSignerSets(0),
    smartAccountReady: false,
    signerEpoch: 0,
    accountStatus: 'NOT_CREATED',
  };
}

export function advanceRegistration(state: AccountLifecycleRegistrationState): AccountLifecycleRegistrationState {
  const nextStep = Math.min(state.step + 1, 7);

  if (nextStep < state.step) {
    return state;
  }

  return {
    ...state,
    step: nextStep,
    signerSets: createRegistrationSignerSets(nextStep),
    smartAccountReady: nextStep >= 6,
    signerEpoch: nextStep >= 7 ? 1 : state.signerEpoch,
    accountStatus: nextStep >= 7 ? 'ACTIVE' : state.accountStatus,
  };
}

export function canUseSocialSigner(status: SignerLifecycleStatus): boolean {
  return status === 'ACTIVE';
}

export function transitionSocialSession(status: SocialSessionStatus): SocialSessionStatus {
  const next: Record<SocialSessionStatus, SocialSessionStatus> = {
    ACTIVE: 'REFRESHING',
    REFRESHING: 'ACTIVE',
    AUTH_REQUIRED: 'ACTIVE',
    REVOKED: 'REVOKED',
    UNAVAILABLE: 'AUTH_REQUIRED',
  };

  return next[status];
}

export function createEmergencyFreezeState(): EmergencyFreezeState {
  return {
    accountStatus: 'ACTIVE',
    arbiterRequested: false,
    signersRestored: false,
    deviceApprovedUnfreeze: false,
    socialApprovedUnfreeze: false,
  };
}

export type EmergencyFreezeAction = 'FREEZE' | 'RESTORE_SIGNERS' | 'UNFREEZE_DEVICE_SOCIAL' | 'UNFREEZE_ARBITER_ONLY' | 'RESET';

export function transitionEmergencyFreeze(state: EmergencyFreezeState, action: EmergencyFreezeAction): EmergencyFreezeState {
  if (action === 'RESET') {
    return createEmergencyFreezeState();
  }

  if (action === 'FREEZE' && state.accountStatus === 'ACTIVE') {
    return { ...state, accountStatus: 'FROZEN', arbiterRequested: true };
  }

  if (action === 'RESTORE_SIGNERS' && state.accountStatus === 'FROZEN') {
    return { ...state, signersRestored: true };
  }

  if (action === 'UNFREEZE_ARBITER_ONLY') {
    return state;
  }

  if (action === 'UNFREEZE_DEVICE_SOCIAL' && state.accountStatus === 'FROZEN' && state.signersRestored) {
    return {
      ...state,
      accountStatus: 'ACTIVE',
      deviceApprovedUnfreeze: true,
      socialApprovedUnfreeze: true,
    };
  }

  return state;
}

export function validateEpochIncrease(previous: number, next: number): boolean {
  return next > previous;
}

export function isSignatureValidForEpoch(signatureEpoch: number, currentEpoch: number): boolean {
  return signatureEpoch === currentEpoch;
}
