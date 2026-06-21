import type { DeviceReplacementState } from './types';

export type DeviceReplacementAction =
  | 'START'
  | 'APPROVE_SOCIAL'
  | 'APPROVE_ARBITER'
  | 'SUSPEND_OLD'
  | 'ACTIVATE_NEW'
  | 'RESET';

export function createDeviceReplacementState(): DeviceReplacementState {
  return {
    request: {
      account: '0x71C4...9A12',
      oldDeviceKeyHash: '0xoldDeviceHash...7a21',
      newDeviceKeyHash: '0xnewDeviceHash...8b42',
      recoveryNonce: 12,
      validUntil: '2026-06-23T12:00:00Z',
      socialApproved: false,
      arbiterApproved: false,
      status: 'DRAFT',
    },
    oldDeviceStatus: 'ACTIVE',
    newDeviceStatus: 'NOT_REGISTERED',
    signerEpochBefore: 7,
    signerEpochAfter: 7,
    sessionKeysRevoked: false,
  };
}

export function transitionDeviceReplacement(
  state: DeviceReplacementState,
  action: DeviceReplacementAction,
): DeviceReplacementState {
  if (action === 'RESET') {
    return createDeviceReplacementState();
  }

  if (state.request.status === 'EXECUTED' || state.request.status === 'CANCELLED') {
    return state;
  }

  if (action === 'START' && state.request.status === 'DRAFT') {
    return { ...state, request: { ...state.request, status: 'PENDING' }, newDeviceStatus: 'REPLACEMENT_PENDING' };
  }

  if (action === 'APPROVE_SOCIAL' && state.request.status === 'PENDING') {
    return { ...state, request: { ...state.request, socialApproved: true } };
  }

  if (action === 'APPROVE_ARBITER' && state.request.status === 'PENDING') {
    return { ...state, request: { ...state.request, arbiterApproved: true } };
  }

  if (
    action === 'SUSPEND_OLD' &&
    state.request.status === 'PENDING' &&
    state.request.socialApproved &&
    state.request.arbiterApproved
  ) {
    return {
      ...state,
      oldDeviceStatus: 'SUSPENDED',
      request: { ...state.request, status: 'SUSPENDED_OLD' },
    };
  }

  if (action === 'ACTIVATE_NEW' && state.request.status === 'SUSPENDED_OLD') {
    return {
      ...state,
      oldDeviceStatus: 'REVOKED',
      newDeviceStatus: 'ACTIVE',
      signerEpochAfter: state.signerEpochBefore + 1,
      sessionKeysRevoked: true,
      request: { ...state.request, status: 'EXECUTED' },
    };
  }

  return state;
}
