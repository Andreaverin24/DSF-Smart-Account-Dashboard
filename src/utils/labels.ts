import type { OperationType, PaymasterMode, RiskLevel, SignerType, ValidationMode } from '../domain/types';

export const riskLabels: Record<RiskLevel, string> = {
  NONE: 'Нет риска',
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  CRITICAL: 'Критический',
};

export const signerLabels: Record<SignerType, string> = {
  SOCIAL: 'Social Signer',
  DEVICE: 'Device Signer',
  ARBITER: 'Arbiter Signer',
  RECOVERY: 'Recovery Signer',
  SESSION: 'Session Key',
};

export const validationLabels: Record<ValidationMode, string> = {
  DEVICE_ONLY: 'Device only',
  SOCIAL_ONLY: 'Social only',
  DEVICE_SOCIAL: 'Device + Social',
  DEVICE_ARBITER: 'Device + Arbiter',
  SOCIAL_ARBITER: 'Social + Arbiter',
  DEVICE_SOCIAL_ARBITER: 'Device + Social + Arbiter',
  SESSION_KEY: 'Session Key',
  RECOVERY: 'Recovery',
};

export const operationLabels: Record<OperationType, string> = {
  TRANSFER: 'Transfer',
  APPROVE: 'Approve',
  SWAP: 'Swap',
  DSF_DEPOSIT: 'DSF Deposit',
  DSF_WITHDRAW: 'DSF Withdraw',
  ADD_SIGNER: 'Add Signer',
  REMOVE_SIGNER: 'Remove Signer',
  CREATE_SESSION_KEY: 'Create Session Key',
  UPGRADE: 'Upgrade',
  RECOVERY: 'Recovery',
  CLAIM: 'Claim',
};

export const paymasterLabels: Record<PaymasterMode, string> = {
  ETH: 'Пользователь платит ETH',
  DSF_SPONSORED: 'DSF спонсирует газ',
  USDT: 'Пользователь платит USDT',
  NONE: 'Без Paymaster',
};
