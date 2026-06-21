import { describe, expect, it } from 'vitest';
import { demoSignerSets } from './mockData';
import {
  canEmergencyFreeze,
  canExecuteNormalTransaction,
  canReplaceLostDevices,
  canReplaceSocialSigner,
  canUnfreeze,
  evaluateSignerRequirement,
  lostAllDevicesRequirement,
} from './signerRequirements';
import type { SmartAccountSignerSets } from './types';

describe('signer requirements', () => {
  it('allows Device[1] + Social[0] to execute a normal operation', () => {
    const result = canExecuteNormalTransaction(
      [demoSignerSets.deviceSigners[1]!.signerId, demoSignerSets.socialSigners[0]!.signerId],
      demoSignerSets,
    );

    expect(result.fulfilled).toBe(true);
  });

  it('rejects two Social signatures without Device for a normal operation', () => {
    const result = canExecuteNormalTransaction(
      [demoSignerSets.socialSigners[0]!.signerId, demoSignerSets.socialSigners[1]!.signerId],
      demoSignerSets,
    );

    expect(result.fulfilled).toBe(false);
    expect(result.missing).toContain('Недостаточно Device-подписей: требуется 1, выбрано 0.');
  });

  it('rejects two Arbiter signatures for a normal operation', () => {
    const result = canExecuteNormalTransaction(
      [demoSignerSets.arbiterSigners[0]!.signerId, demoSignerSets.arbiterSigners[1]!.signerId],
      demoSignerSets,
    );

    expect(result.fulfilled).toBe(false);
    expect(result.selected.arbiterThreshold).toBe(2);
  });

  it('allows ACTIVE Device + ACTIVE Social for a normal operation', () => {
    const result = canExecuteNormalTransaction(
      [demoSignerSets.deviceSigners[0]!.signerId, demoSignerSets.socialSigners[0]!.signerId],
      demoSignerSets,
    );

    expect(result.fulfilled).toBe(true);
  });

  it('does not count a SUSPENDED Device', () => {
    const signerSets = cloneSignerSets();
    signerSets.deviceSigners[0] = { ...signerSets.deviceSigners[0]!, status: 'SUSPENDED' };
    const result = canExecuteNormalTransaction([signerSets.deviceSigners[0]!.signerId, signerSets.socialSigners[0]!.signerId], signerSets);

    expect(result.fulfilled).toBe(false);
    expect(result.selected.deviceThreshold).toBe(0);
  });

  it('does not count a REVOKED Social signer', () => {
    const signerSets = cloneSignerSets();
    signerSets.socialSigners[0] = { ...signerSets.socialSigners[0]!, status: 'REVOKED' };
    const result = canExecuteNormalTransaction([signerSets.deviceSigners[0]!.signerId, signerSets.socialSigners[0]!.signerId], signerSets);

    expect(result.fulfilled).toBe(false);
    expect(result.selected.socialThreshold).toBe(0);
  });

  it('allows revoking a lost Device without Arbiter when a second Device remains active', () => {
    const result = canReplaceLostDevices(
      [demoSignerSets.deviceSigners[1]!.signerId, demoSignerSets.socialSigners[0]!.signerId],
      demoSignerSets,
      true,
    );

    expect(result.fulfilled).toBe(true);
    expect(result.requirement.arbiterThreshold).toBe(0);
  });

  it('requires two Social signers and one Arbiter when all Device signers are lost', () => {
    const result = canReplaceLostDevices(
      [
        demoSignerSets.socialSigners[0]!.signerId,
        demoSignerSets.socialSigners[1]!.signerId,
        demoSignerSets.arbiterSigners[0]!.signerId,
      ],
      demoSignerSets,
      false,
    );

    expect(result.fulfilled).toBe(true);
    expect(result.requirement).toEqual(lostAllDevicesRequirement);
  });

  it('rejects one Social and one Arbiter for a 2 Social + 1 Arbiter policy', () => {
    const result = canReplaceLostDevices(
      [demoSignerSets.socialSigners[0]!.signerId, demoSignerSets.arbiterSigners[0]!.signerId],
      demoSignerSets,
      false,
    );

    expect(result.fulfilled).toBe(false);
    expect(result.missing).toContain('Недостаточно Social-подписей: требуется 2, выбрано 1.');
  });

  it('allows Device + another Social to revoke a compromised Social without Arbiter', () => {
    const result = canReplaceSocialSigner(
      [demoSignerSets.deviceSigners[0]!.signerId, demoSignerSets.socialSigners[1]!.signerId],
      demoSignerSets,
      true,
    );

    expect(result.fulfilled).toBe(true);
    expect(result.requirement.arbiterThreshold).toBe(0);
  });

  it('requires 2-of-3 Arbiter for Emergency Freeze', () => {
    const oneArbiter = canEmergencyFreeze([demoSignerSets.arbiterSigners[0]!.signerId], demoSignerSets);
    const twoArbiters = canEmergencyFreeze(
      [demoSignerSets.arbiterSigners[0]!.signerId, demoSignerSets.arbiterSigners[1]!.signerId],
      demoSignerSets,
    );

    expect(oneArbiter.fulfilled).toBe(false);
    expect(twoArbiters.fulfilled).toBe(true);
  });

  it('rejects Arbiter-only Unfreeze', () => {
    const result = canUnfreeze(
      [demoSignerSets.arbiterSigners[0]!.signerId, demoSignerSets.arbiterSigners[1]!.signerId],
      demoSignerSets,
    );

    expect(result.fulfilled).toBe(false);
  });

  it('does not count a duplicated signerId twice', () => {
    const result = evaluateSignerRequirement(
      { deviceThreshold: 2, socialThreshold: 0, arbiterThreshold: 0 },
      [demoSignerSets.deviceSigners[0]!.signerId, demoSignerSets.deviceSigners[0]!.signerId],
      demoSignerSets,
    );

    expect(result.fulfilled).toBe(false);
    expect(result.selected.deviceThreshold).toBe(1);
  });

  it('keeps signerId identity stable when a UI array element is removed', () => {
    const originalSecondDeviceId = demoSignerSets.deviceSigners[1]!.signerId;
    const withoutFirstDevice = demoSignerSets.deviceSigners.slice(1);

    expect(withoutFirstDevice[0]!.displayIndex).toBe(1);
    expect(withoutFirstDevice[0]!.signerId).toBe(originalSecondDeviceId);
  });
});

function cloneSignerSets(): SmartAccountSignerSets {
  return {
    deviceSigners: demoSignerSets.deviceSigners.map((signer) => ({ ...signer })),
    socialSigners: demoSignerSets.socialSigners.map((signer) => ({ ...signer })),
    arbiterSigners: demoSignerSets.arbiterSigners.map((signer) => ({ ...signer })),
  };
}
