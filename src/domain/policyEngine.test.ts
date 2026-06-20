import { describe, expect, it } from 'vitest';
import { smartAccount, defaultOperationDraft } from './mockData';
import {
  calculateRequiredSigners,
  calculateRisk,
  determineValidationMode,
  evaluateOperation,
  validateDailyLimit,
  validateSessionKeyRestrictions,
} from './policyEngine';
import type { OperationDraft } from './types';

function draft(overrides: Partial<OperationDraft>): OperationDraft {
  return { ...defaultOperationDraft, ...overrides };
}

describe('policyEngine', () => {
  it('calculates low risk for DSF Deposit up to 5,000 USDT', () => {
    const operation = draft({ type: 'DSF_DEPOSIT', amount: 5000, gasMode: 'DSF_SPONSORED' });
    expect(calculateRisk(operation, smartAccount)).toBe('LOW');
    expect(evaluateOperation(operation, smartAccount).paymasterAllowed).toBe(true);
  });

  it('uses DEVICE_ONLY for trusted transfer up to 500 USDT', () => {
    const operation = draft({ type: 'TRANSFER', amount: 400, recipientTrusted: true });
    const risk = calculateRisk(operation, smartAccount);
    const mode = determineValidationMode(operation, risk);
    expect(risk).toBe('LOW');
    expect(mode).toBe('DEVICE_ONLY');
    expect(calculateRequiredSigners(mode, operation)).toEqual(['DEVICE']);
  });

  it('requires DEVICE_SOCIAL for untrusted recipient', () => {
    const operation = draft({ type: 'TRANSFER', amount: 400, recipientTrusted: false });
    const requirement = evaluateOperation(operation, smartAccount);
    expect(requirement.risk).toBe('MEDIUM');
    expect(requirement.validationMode).toBe('DEVICE_SOCIAL');
    expect(requirement.requiredSigners).toEqual(['DEVICE', 'SOCIAL']);
  });

  it('requires DEVICE_ARBITER for transfer above 5,000 USDT', () => {
    const operation = draft({ type: 'TRANSFER', amount: 6000, recipientTrusted: true });
    const requirement = evaluateOperation(operation, smartAccount);
    expect(requirement.risk).toBe('HIGH');
    expect(requirement.validationMode).toBe('DEVICE_ARBITER');
    expect(requirement.requiredSigners).toEqual(['DEVICE', 'ARBITER']);
  });

  it('blocks operation when daily limit remaining is exceeded', () => {
    const operation = draft({ type: 'TRANSFER', amount: 4000, recipientTrusted: true });
    const limit = validateDailyLimit(operation, smartAccount);
    const requirement = evaluateOperation(operation, smartAccount);
    expect(limit.allowed).toBe(false);
    expect(requirement.allowed).toBe(false);
    expect(requirement.reasons.join(' ')).toContain('превышает оставшийся дневной лимит');
  });

  it('applies session key restrictions to signer management, recovery and transfer', () => {
    const addSigner = draft({ type: 'ADD_SIGNER', sessionKeyMode: true });
    const transfer = draft({ type: 'TRANSFER', sessionKeyMode: true, allowTransferBySessionKey: false });
    expect(validateSessionKeyRestrictions(addSigner)).toHaveLength(1);
    expect(validateSessionKeyRestrictions(transfer)).toHaveLength(1);
    expect(evaluateOperation(transfer, smartAccount).allowed).toBe(false);
  });

  it('uses critical rules and delay for upgrade', () => {
    const operation = draft({ type: 'UPGRADE' });
    const requirement = evaluateOperation(operation, smartAccount);
    expect(requirement.risk).toBe('CRITICAL');
    expect(requirement.validationMode).toBe('DEVICE_SOCIAL_ARBITER');
    expect(requirement.delayHours).toBe(168);
  });
});
