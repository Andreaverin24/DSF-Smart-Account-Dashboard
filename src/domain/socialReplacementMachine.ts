import type { SocialReplacementState } from './types';

export type SocialReplacementAction =
  | 'REPORT_COMPROMISE'
  | 'APPROVE_DEVICE'
  | 'APPROVE_ARBITER'
  | 'SUSPEND_OLD'
  | 'LINK_NEW_SOCIAL'
  | 'EXECUTE'
  | 'RESET';

export function createSocialReplacementState(): SocialReplacementState {
  return {
    request: {
      account: '0x71C4...9A12',
      oldSocialSigner: 'social:google:old...d19',
      newSocialSigner: 'social:google:new...a42',
      recoveryNonce: 18,
      validUntil: '2026-06-24T12:00:00Z',
      deviceApproved: false,
      arbiterApproved: false,
      newSocialProvedOwnership: false,
      status: 'DRAFT',
    },
    oldSocialStatus: 'ACTIVE',
    newSocialStatus: 'NOT_REGISTERED',
    signerEpochBefore: 7,
    signerEpochAfter: 7,
    recoveryNonceBefore: 18,
    recoveryNonceAfter: 18,
  };
}

export function transitionSocialReplacement(
  state: SocialReplacementState,
  action: SocialReplacementAction,
): SocialReplacementState {
  if (action === 'RESET') {
    return createSocialReplacementState();
  }

  if (state.request.status === 'EXECUTED' || state.request.status === 'CANCELLED') {
    return state;
  }

  if (action === 'REPORT_COMPROMISE' && state.request.status === 'DRAFT') {
    return { ...state, request: { ...state.request, status: 'PENDING' } };
  }

  if (action === 'APPROVE_DEVICE' && state.request.status === 'PENDING') {
    return { ...state, request: { ...state.request, deviceApproved: true } };
  }

  if (action === 'APPROVE_ARBITER' && state.request.status === 'PENDING') {
    return { ...state, request: { ...state.request, arbiterApproved: true } };
  }

  if (
    action === 'SUSPEND_OLD' &&
    state.request.status === 'PENDING' &&
    state.request.deviceApproved &&
    state.request.arbiterApproved
  ) {
    return {
      ...state,
      oldSocialStatus: 'SUSPENDED',
      request: { ...state.request, status: 'SUSPENDED_OLD' },
    };
  }

  if (action === 'LINK_NEW_SOCIAL' && state.request.status === 'SUSPENDED_OLD') {
    return {
      ...state,
      newSocialStatus: 'REPLACEMENT_PENDING',
      request: { ...state.request, newSocialProvedOwnership: true },
    };
  }

  if (
    action === 'EXECUTE' &&
    state.request.status === 'SUSPENDED_OLD' &&
    state.request.deviceApproved &&
    state.request.arbiterApproved &&
    state.request.newSocialProvedOwnership
  ) {
    return {
      ...state,
      oldSocialStatus: 'REVOKED',
      newSocialStatus: 'ACTIVE',
      signerEpochAfter: state.signerEpochBefore + 1,
      recoveryNonceAfter: state.recoveryNonceBefore + 1,
      request: { ...state.request, status: 'EXECUTED' },
    };
  }

  return state;
}

export function canReactivateSigner(status: SocialReplacementState['oldSocialStatus']): boolean {
  return status !== 'REVOKED';
}
