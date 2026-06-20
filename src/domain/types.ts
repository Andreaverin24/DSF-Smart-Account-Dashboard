export type SignerType = 'SOCIAL' | 'DEVICE' | 'ARBITER' | 'RECOVERY' | 'SESSION';

export type ValidationMode =
  | 'DEVICE_ONLY'
  | 'SOCIAL_ONLY'
  | 'DEVICE_SOCIAL'
  | 'DEVICE_ARBITER'
  | 'SOCIAL_ARBITER'
  | 'DEVICE_SOCIAL_ARBITER'
  | 'SESSION_KEY'
  | 'RECOVERY';

export type OperationType =
  | 'TRANSFER'
  | 'APPROVE'
  | 'SWAP'
  | 'DSF_DEPOSIT'
  | 'DSF_WITHDRAW'
  | 'ADD_SIGNER'
  | 'REMOVE_SIGNER'
  | 'CREATE_SESSION_KEY'
  | 'UPGRADE'
  | 'RECOVERY'
  | 'CLAIM';

export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RecoveryStatus =
  | 'IDLE'
  | 'INITIATED'
  | 'WAITING_ARBITER'
  | 'TIMELOCK'
  | 'READY'
  | 'EXECUTED'
  | 'CANCELLED';

export type PaymasterMode = 'ETH' | 'DSF_SPONSORED' | 'USDT' | 'NONE';

export type SignerStatus = 'ACTIVE' | 'REVOKED' | 'PENDING' | 'FROZEN';

export type NetworkName = 'Ethereum' | 'Arbitrum' | 'Base' | 'Polygon';

export interface SpendingLimit {
  token: string;
  dailyLimit: number;
  spentToday: number;
  singleOperationLimit: number;
}

export interface SignerSlot {
  id: string;
  type: SignerType;
  title: string;
  keyType: string;
  status: SignerStatus;
  addedAt: string;
  publicKey?: {
    x: string;
    y: string;
  };
  storage?: string;
  permissions: string[];
  restrictions: string[];
  description: string;
}

export interface SmartAccountState {
  address: string;
  network: NetworkName;
  status: 'Активен' | 'Заморожен' | 'Восстановление';
  signerEpoch: number;
  recoveryDelayHours: number;
  paymasterActive: boolean;
  spendingLimit: SpendingLimit;
  trustedRecipients: string[];
}

export interface OperationDraft {
  type: OperationType;
  token: string;
  amount: number;
  targetContract: string;
  recipient: string;
  recipientTrusted: boolean;
  validUntil: string;
  gasMode: PaymasterMode;
  sessionKeyMode: boolean;
  network: NetworkName;
  allowTransferBySessionKey: boolean;
}

export interface AuthorizationRequirement {
  risk: RiskLevel;
  validationMode: ValidationMode;
  requiredSigners: SignerType[];
  delayHours: number | null;
  arbiterRequired: boolean;
  paymasterAllowed: boolean;
  allowed: boolean;
  appliedLimits: string[];
  reasons: string[];
}

export interface UserOperationModel {
  sender: string;
  nonce: string;
  factory: string | null;
  factoryData: string | null;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymaster: string | null;
  paymasterData: string | null;
  signature: string;
  validationMode: ValidationMode;
  validAfter: string | null;
  validUntil: string;
  signerEpoch: number;
}

export interface RecoveryRequest {
  status: RecoveryStatus;
  startedAt: string | null;
  arbiterApproved: boolean;
  timelockComplete: boolean;
  oldDeviceStatus: SignerStatus;
  newDeviceStatus: SignerStatus;
  signerEpochBefore: number;
  signerEpochAfter: number;
  sessionKeysRevoked: boolean;
  accountAddressUnchanged: boolean;
  balancesUnchanged: boolean;
}

export interface SessionKey {
  id: string;
  name: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'DRAFT';
  validUntil: string;
  allowedContracts: string[];
  allowedMethods: string[];
  allowedTokens: string[];
  singleOperationLimit: number;
  dailyLimit: number;
  transferAllowed: boolean;
  signerManagementAllowed: boolean;
  upgradeAllowed: boolean;
  recoveryAllowed: boolean;
}

export interface SecurityScenario {
  id: string;
  title: string;
  threat: string;
  mechanisms: string[];
  outcome: string[];
}

export interface MatrixRow {
  operation: string;
  risk: RiskLevel;
  device: string;
  social: string;
  arbiter: string;
  recovery: string;
  delay: string;
  explanation: string;
}

export interface RecoveryTransitionResult {
  request: RecoveryRequest;
  message: string;
}
