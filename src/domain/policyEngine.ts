import type {
  AuthorizationRequirement,
  OperationDraft,
  OperationType,
  RiskLevel,
  SessionKey,
  SignerType,
  SmartAccountState,
  ValidationMode,
} from './types';

const signerModes: Record<ValidationMode, SignerType[]> = {
  DEVICE_ONLY: ['DEVICE'],
  SOCIAL_ONLY: ['SOCIAL'],
  DEVICE_SOCIAL: ['DEVICE', 'SOCIAL'],
  DEVICE_ARBITER: ['DEVICE', 'ARBITER'],
  SOCIAL_ARBITER: ['SOCIAL', 'ARBITER'],
  DEVICE_SOCIAL_ARBITER: ['DEVICE', 'SOCIAL', 'ARBITER'],
  SESSION_KEY: ['SESSION'],
  RECOVERY: ['RECOVERY'],
};

const delayByOperation: Partial<Record<OperationType, number>> = {
  ADD_SIGNER: 24,
  REMOVE_SIGNER: 72,
  UPGRADE: 168,
  RECOVERY: 48,
};

export function calculateRisk(operation: OperationDraft, account: SmartAccountState): RiskLevel {
  if (operation.type === 'UPGRADE' || operation.type === 'RECOVERY') {
    return 'CRITICAL';
  }

  if (operation.type === 'REMOVE_SIGNER') {
    return 'CRITICAL';
  }

  if (operation.type === 'ADD_SIGNER') {
    return 'HIGH';
  }

  if (operation.type === 'CREATE_SESSION_KEY') {
    return 'MEDIUM';
  }

  if (operation.type === 'TRANSFER') {
    if (operation.amount > account.spendingLimit.dailyLimit) {
      return 'HIGH';
    }

    if (!operation.recipientTrusted) {
      return 'MEDIUM';
    }

    return operation.amount <= account.spendingLimit.singleOperationLimit ? 'LOW' : 'MEDIUM';
  }

  if (operation.type === 'DSF_DEPOSIT' && operation.amount <= account.spendingLimit.dailyLimit) {
    return 'LOW';
  }

  if (operation.type === 'DSF_WITHDRAW' || operation.type === 'SWAP' || operation.type === 'APPROVE') {
    return operation.amount > account.spendingLimit.dailyLimit ? 'HIGH' : 'MEDIUM';
  }

  return 'LOW';
}

export function determineValidationMode(operation: OperationDraft, risk: RiskLevel): ValidationMode {
  if (operation.sessionKeyMode) {
    return 'SESSION_KEY';
  }

  if (operation.type === 'RECOVERY') {
    return 'SOCIAL_ARBITER';
  }

  if (operation.type === 'REMOVE_SIGNER') {
    return 'DEVICE_SOCIAL';
  }

  if (operation.type === 'UPGRADE') {
    return 'DEVICE_SOCIAL_ARBITER';
  }

  if (operation.type === 'ADD_SIGNER') {
    return 'DEVICE_ARBITER';
  }

  if (operation.type === 'CREATE_SESSION_KEY') {
    return 'DEVICE_SOCIAL';
  }

  if (risk === 'HIGH') {
    return 'DEVICE_ARBITER';
  }

  if (risk === 'MEDIUM') {
    return 'DEVICE_SOCIAL';
  }

  return 'DEVICE_ONLY';
}

export function calculateRequiredSigners(mode: ValidationMode, operation: OperationDraft): SignerType[] {
  const signers = signerModes[mode];

  if (operation.type === 'REMOVE_SIGNER') {
    return [...signers, 'RECOVERY'];
  }

  return signers;
}

export function validateDailyLimit(operation: OperationDraft, account: SmartAccountState): {
  allowed: boolean;
  remaining: number;
  reason: string | null;
} {
  const remaining = account.spendingLimit.dailyLimit - account.spendingLimit.spentToday;
  const applies =
    operation.token === account.spendingLimit.token &&
    ['TRANSFER', 'DSF_WITHDRAW', 'APPROVE', 'SWAP'].includes(operation.type);

  if (!applies) {
    return { allowed: true, remaining, reason: null };
  }

  if (operation.amount > remaining) {
    return {
      allowed: false,
      remaining,
      reason: `Сумма ${operation.amount.toLocaleString('ru-RU')} ${operation.token} превышает оставшийся дневной лимит ${remaining.toLocaleString('ru-RU')} ${operation.token}.`,
    };
  }

  return { allowed: true, remaining, reason: null };
}

export function validateSessionKeyRestrictions(operation: OperationDraft, sessionKey?: SessionKey): string[] {
  if (!operation.sessionKeyMode) {
    return [];
  }

  const violations: string[] = [];
  const forbiddenTypes: OperationType[] = ['ADD_SIGNER', 'REMOVE_SIGNER', 'RECOVERY', 'UPGRADE'];

  if (forbiddenTypes.includes(operation.type)) {
    violations.push('Session Key не может менять подписантов, запускать recovery или выполнять upgrade.');
  }

  if (operation.type === 'TRANSFER' && !operation.allowTransferBySessionKey) {
    violations.push('Transfer запрещён для текущего Session Key, потому что transfer не разрешён явно.');
  }

  if (sessionKey) {
    if (!sessionKey.allowedContracts.includes(operation.targetContract)) {
      violations.push('Target contract не входит в allowlist выбранного Session Key.');
    }

    if (operation.amount > sessionKey.singleOperationLimit && sessionKey.singleOperationLimit > 0) {
      violations.push('Сумма превышает лимит одной операции для Session Key.');
    }
  }

  return violations;
}

export function evaluateOperation(
  operation: OperationDraft,
  account: SmartAccountState,
  sessionKey?: SessionKey,
): AuthorizationRequirement {
  const risk = calculateRisk(operation, account);
  const validationMode = determineValidationMode(operation, risk);
  const requiredSigners = calculateRequiredSigners(validationMode, operation);
  const delayHours = delayByOperation[operation.type] ?? null;
  const dailyLimit = validateDailyLimit(operation, account);
  const sessionViolations = validateSessionKeyRestrictions(operation, sessionKey);
  const paymasterAllowed =
    account.paymasterActive &&
    (operation.type === 'DSF_DEPOSIT' || operation.type === 'DSF_WITHDRAW' || operation.type === 'CLAIM') &&
    operation.amount <= account.spendingLimit.dailyLimit;
  const reasons: string[] = [];
  const appliedLimits = [
    `Дневной лимит: ${account.spendingLimit.dailyLimit.toLocaleString('ru-RU')} ${account.spendingLimit.token}`,
    `Потрачено сегодня: ${account.spendingLimit.spentToday.toLocaleString('ru-RU')} ${account.spendingLimit.token}`,
    `Остаток лимита: ${dailyLimit.remaining.toLocaleString('ru-RU')} ${account.spendingLimit.token}`,
  ];

  if (operation.type === 'TRANSFER' && !operation.recipientTrusted) {
    reasons.push('Получатель не входит в allowlist, поэтому требуется усиленная проверка.');
  }

  if (dailyLimit.reason) {
    reasons.push(dailyLimit.reason);
  }

  if (!paymasterAllowed && operation.gasMode === 'DSF_SPONSORED') {
    reasons.push('Paymaster не спонсирует эту операцию: разрешены только DSF Deposit, Withdraw и Claim в пределах квоты.');
  }

  reasons.push(...sessionViolations);

  if (reasons.length === 0) {
    reasons.push('Операция соответствует текущим политикам и лимитам демонстрационного аккаунта.');
  }

  return {
    risk,
    validationMode,
    requiredSigners,
    delayHours,
    arbiterRequired: requiredSigners.includes('ARBITER'),
    paymasterAllowed,
    allowed: dailyLimit.allowed && sessionViolations.length === 0,
    appliedLimits,
    reasons,
  };
}
