import { describe, expect, it } from 'vitest';
import {
  advanceRegistration,
  canUseSocialSigner,
  createEmergencyFreezeState,
  createInitialRegistrationState,
  isSignatureValidForEpoch,
  transitionEmergencyFreeze,
  transitionSocialSession,
  validateEpochIncrease,
} from './accountLifecycle';
import { createDeviceReplacementState, transitionDeviceReplacement } from './deviceReplacementMachine';
import { canReactivateSigner, createSocialReplacementState, transitionSocialReplacement } from './socialReplacementMachine';
import { createTransactionLifecycle, transitionTransaction } from './transactionLifecycle';

describe('account lifecycle registration', () => {
  it('completes initial registration and activates signers', () => {
    let state = createInitialRegistrationState();
    for (let index = 0; index < 7; index += 1) {
      state = advanceRegistration(state);
    }

    expect(state.smartAccountReady).toBe(true);
    expect(state.signerSets.deviceSigners.every((signer) => signer.status === 'ACTIVE')).toBe(true);
    expect(state.signerSets.socialSigners.every((signer) => signer.status === 'ACTIVE')).toBe(true);
    expect(state.signerSets.arbiterSigners.every((signer) => signer.status === 'ACTIVE')).toBe(true);
    expect(state.signerEpoch).toBe(1);
    expect(state.accountStatus).toBe('ACTIVE');
  });

  it('moves Device Signer to ACTIVE during registration', () => {
    let state = createInitialRegistrationState();
    for (let index = 0; index < 4; index += 1) {
      state = advanceRegistration(state);
    }

    expect(state.signerSets.deviceSigners.every((signer) => signer.status === 'ACTIVE')).toBe(true);
  });

  it('transitions social session statuses deterministically', () => {
    expect(transitionSocialSession('ACTIVE')).toBe('REFRESHING');
    expect(transitionSocialSession('REFRESHING')).toBe('ACTIVE');
    expect(transitionSocialSession('AUTH_REQUIRED')).toBe('ACTIVE');
    expect(transitionSocialSession('REVOKED')).toBe('REVOKED');
  });
});

describe('transaction lifecycle', () => {
  it('executes Device-only transaction lifecycle', () => {
    let state = createTransactionLifecycle('DEVICE_ONLY', 'ACTIVE');
    state = transitionTransaction(state, 'OPEN_BIOMETRIC');
    state = transitionTransaction(state, 'SIGN_DEVICE');
    state = transitionTransaction(state, 'SUBMIT');
    state = transitionTransaction(state, 'VALIDATE');
    state = transitionTransaction(state, 'EXECUTE');

    expect(state.status).toBe('EXECUTED');
    expect(state.deviceSigned).toBe(true);
    expect(state.socialSigned).toBe(false);
  });

  it('executes Device + Social transaction lifecycle with expired social session', () => {
    let state = createTransactionLifecycle('DEVICE_SOCIAL', 'AUTH_REQUIRED');
    state = transitionTransaction(state, 'CONTINUE_SOCIAL');
    state = transitionTransaction(state, 'SIGN_SOCIAL');
    state = transitionTransaction(state, 'OPEN_BIOMETRIC');
    state = transitionTransaction(state, 'SIGN_DEVICE');
    state = transitionTransaction(state, 'SUBMIT');
    state = transitionTransaction(state, 'VALIDATE');
    state = transitionTransaction(state, 'EXECUTE');

    expect(state.status).toBe('EXECUTED');
    expect(state.socialSigned).toBe(true);
    expect(state.deviceSigned).toBe(true);
  });
});

describe('device replacement', () => {
  it('replaces Device and increments signerEpoch', () => {
    let state = createDeviceReplacementState();
    state = transitionDeviceReplacement(state, 'START');
    state = transitionDeviceReplacement(state, 'APPROVE_SOCIAL');
    state = transitionDeviceReplacement(state, 'APPROVE_ARBITER');
    state = transitionDeviceReplacement(state, 'SUSPEND_OLD');
    state = transitionDeviceReplacement(state, 'ACTIVATE_NEW');

    expect(state.request.status).toBe('EXECUTED');
    expect(state.oldDeviceStatus).toBe('REVOKED');
    expect(state.newDeviceStatus).toBe('ACTIVE');
    expect(state.signerEpochAfter).toBe(8);
    expect(state.sessionKeysRevoked).toBe(true);
  });

  it('does not replace Device without Arbiter approval', () => {
    let state = createDeviceReplacementState();
    state = transitionDeviceReplacement(state, 'START');
    state = transitionDeviceReplacement(state, 'APPROVE_SOCIAL');
    state = transitionDeviceReplacement(state, 'SUSPEND_OLD');
    state = transitionDeviceReplacement(state, 'ACTIVATE_NEW');

    expect(state.oldDeviceStatus).toBe('ACTIVE');
    expect(state.newDeviceStatus).toBe('REPLACEMENT_PENDING');
    expect(state.request.status).toBe('PENDING');
  });
});

describe('social replacement', () => {
  it('replaces Social and increments signerEpoch and recoveryNonce', () => {
    let state = createSocialReplacementState();
    state = transitionSocialReplacement(state, 'REPORT_COMPROMISE');
    state = transitionSocialReplacement(state, 'APPROVE_DEVICE');
    state = transitionSocialReplacement(state, 'APPROVE_ARBITER');
    state = transitionSocialReplacement(state, 'SUSPEND_OLD');
    state = transitionSocialReplacement(state, 'LINK_NEW_SOCIAL');
    state = transitionSocialReplacement(state, 'EXECUTE');

    expect(state.request.status).toBe('EXECUTED');
    expect(state.oldSocialStatus).toBe('REVOKED');
    expect(state.newSocialStatus).toBe('ACTIVE');
    expect(state.signerEpochAfter).toBe(8);
    expect(state.recoveryNonceAfter).toBe(19);
  });

  it('does not replace Social without Arbiter approval', () => {
    let state = createSocialReplacementState();
    state = transitionSocialReplacement(state, 'REPORT_COMPROMISE');
    state = transitionSocialReplacement(state, 'APPROVE_DEVICE');
    state = transitionSocialReplacement(state, 'SUSPEND_OLD');
    state = transitionSocialReplacement(state, 'LINK_NEW_SOCIAL');
    state = transitionSocialReplacement(state, 'EXECUTE');

    expect(state.oldSocialStatus).toBe('ACTIVE');
    expect(state.newSocialStatus).toBe('NOT_REGISTERED');
    expect(state.request.status).toBe('PENDING');
  });
});

describe('epoch, freeze and signer restrictions', () => {
  it('invalidates old signatures after signerEpoch change', () => {
    expect(validateEpochIncrease(7, 8)).toBe(true);
    expect(validateEpochIncrease(8, 7)).toBe(false);
    expect(isSignatureValidForEpoch(7, 7)).toBe(true);
    expect(isSignatureValidForEpoch(7, 8)).toBe(false);
  });

  it('freezes account and rejects Arbiter-only unfreeze', () => {
    let state = createEmergencyFreezeState();
    state = transitionEmergencyFreeze(state, 'FREEZE');
    const arbiterOnly = transitionEmergencyFreeze(state, 'UNFREEZE_ARBITER_ONLY');

    expect(state.accountStatus).toBe('FROZEN');
    expect(arbiterOnly.accountStatus).toBe('FROZEN');
  });

  it('unfreezes only after signer restoration with Device + Social approval', () => {
    let state = createEmergencyFreezeState();
    state = transitionEmergencyFreeze(state, 'FREEZE');
    state = transitionEmergencyFreeze(state, 'RESTORE_SIGNERS');
    state = transitionEmergencyFreeze(state, 'UNFREEZE_DEVICE_SOCIAL');

    expect(state.accountStatus).toBe('ACTIVE');
    expect(state.deviceApprovedUnfreeze).toBe(true);
    expect(state.socialApprovedUnfreeze).toBe(true);
  });

  it('rejects using suspended or revoked Social Signer and prevents REVOKED reactivation', () => {
    expect(canUseSocialSigner('ACTIVE')).toBe(true);
    expect(canUseSocialSigner('SUSPENDED')).toBe(false);
    expect(canUseSocialSigner('REVOKED')).toBe(false);
    expect(canReactivateSigner('REVOKED')).toBe(false);
  });
});
