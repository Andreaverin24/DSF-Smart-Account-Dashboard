import type { SocialSessionStatus, TransactionLifecycleStatus } from './types';

export type TransactionMode = 'DEVICE_ONLY' | 'DEVICE_SOCIAL';

export interface TransactionLifecycleState {
  mode: TransactionMode;
  status: TransactionLifecycleStatus;
  socialSessionStatus: SocialSessionStatus;
  socialSigned: boolean;
  deviceSigned: boolean;
}

export type TransactionLifecycleAction =
  | 'CREATE'
  | 'CONTINUE_SOCIAL'
  | 'SIGN_SOCIAL'
  | 'OPEN_BIOMETRIC'
  | 'SIGN_DEVICE'
  | 'SUBMIT'
  | 'VALIDATE'
  | 'EXECUTE'
  | 'FAIL'
  | 'RESET';

export function createTransactionLifecycle(mode: TransactionMode, socialSessionStatus: SocialSessionStatus): TransactionLifecycleState {
  return {
    mode,
    status: 'CREATED',
    socialSessionStatus,
    socialSigned: false,
    deviceSigned: false,
  };
}

export function transitionTransaction(
  state: TransactionLifecycleState,
  action: TransactionLifecycleAction,
): TransactionLifecycleState {
  if (action === 'RESET') {
    return createTransactionLifecycle(state.mode, state.socialSessionStatus);
  }

  if (state.status === 'EXECUTED' || state.status === 'FAILED') {
    return state;
  }

  if (action === 'FAIL') {
    return { ...state, status: 'FAILED' };
  }

  if (state.mode === 'DEVICE_ONLY') {
    return transitionDeviceOnly(state, action);
  }

  return transitionDeviceSocial(state, action);
}

function transitionDeviceOnly(
  state: TransactionLifecycleState,
  action: TransactionLifecycleAction,
): TransactionLifecycleState {
  if (state.status === 'CREATED' && action === 'OPEN_BIOMETRIC') {
    return { ...state, status: 'WAITING_BIOMETRIC' };
  }

  if (state.status === 'WAITING_BIOMETRIC' && action === 'SIGN_DEVICE') {
    return { ...state, status: 'DEVICE_SIGNED', deviceSigned: true };
  }

  if (state.status === 'DEVICE_SIGNED' && action === 'SUBMIT') {
    return { ...state, status: 'SUBMITTED' };
  }

  if (state.status === 'SUBMITTED' && action === 'VALIDATE') {
    return { ...state, status: 'VALIDATED' };
  }

  if (state.status === 'VALIDATED' && action === 'EXECUTE') {
    return { ...state, status: 'EXECUTED' };
  }

  return state;
}

function transitionDeviceSocial(
  state: TransactionLifecycleState,
  action: TransactionLifecycleAction,
): TransactionLifecycleState {
  if (state.status === 'CREATED' && action === 'SIGN_SOCIAL' && state.socialSessionStatus === 'ACTIVE') {
    return { ...state, status: 'SOCIAL_SIGNED', socialSigned: true };
  }

  if (state.status === 'CREATED' && action === 'CONTINUE_SOCIAL' && state.socialSessionStatus !== 'ACTIVE') {
    return { ...state, status: 'WAITING_SOCIAL' };
  }

  if (state.status === 'WAITING_SOCIAL' && action === 'SIGN_SOCIAL') {
    return { ...state, status: 'SOCIAL_SIGNED', socialSigned: true, socialSessionStatus: 'ACTIVE' };
  }

  if (state.status === 'SOCIAL_SIGNED' && action === 'OPEN_BIOMETRIC') {
    return { ...state, status: 'WAITING_BIOMETRIC' };
  }

  if (state.status === 'WAITING_BIOMETRIC' && action === 'SIGN_DEVICE') {
    return { ...state, status: 'DEVICE_SIGNED', deviceSigned: true };
  }

  if (state.status === 'DEVICE_SIGNED' && action === 'SUBMIT') {
    return { ...state, status: 'SUBMITTED' };
  }

  if (state.status === 'SUBMITTED' && action === 'VALIDATE') {
    return { ...state, status: 'VALIDATED' };
  }

  if (state.status === 'VALIDATED' && action === 'EXECUTE') {
    return { ...state, status: 'EXECUTED' };
  }

  return state;
}
