import { describe, expect, it } from 'vitest';
import { createInitialRecoveryRequest, transitionRecovery } from './recoveryMachine';

describe('recoveryMachine', () => {
  it('moves through recovery states in order', () => {
    const initial = createInitialRecoveryRequest(7);
    const started = transitionRecovery(initial, 'START', '2026-06-20T00:00:00Z').request;
    const approved = transitionRecovery(started, 'APPROVE_ARBITER', '2026-06-20T00:01:00Z').request;
    const ready = transitionRecovery(approved, 'COMPLETE_DELAY', '2026-06-22T00:01:00Z').request;

    expect(started.status).toBe('WAITING_ARBITER');
    expect(approved.status).toBe('TIMELOCK');
    expect(ready.status).toBe('READY');
  });

  it('increments signer epoch and revokes old state after execution', () => {
    const initial = createInitialRecoveryRequest(7);
    const started = transitionRecovery(initial, 'START', '2026-06-20T00:00:00Z').request;
    const approved = transitionRecovery(started, 'APPROVE_ARBITER', '2026-06-20T00:01:00Z').request;
    const ready = transitionRecovery(approved, 'COMPLETE_DELAY', '2026-06-22T00:01:00Z').request;
    const executed = transitionRecovery(ready, 'EXECUTE', '2026-06-22T00:02:00Z').request;

    expect(executed.status).toBe('EXECUTED');
    expect(executed.signerEpochAfter).toBe(8);
    expect(executed.oldDeviceStatus).toBe('REVOKED');
    expect(executed.newDeviceStatus).toBe('ACTIVE');
    expect(executed.sessionKeysRevoked).toBe(true);
    expect(executed.accountAddressUnchanged).toBe(true);
    expect(executed.balancesUnchanged).toBe(true);
  });

  it('prevents executing before timelock is ready', () => {
    const initial = createInitialRecoveryRequest(7);
    const started = transitionRecovery(initial, 'START', '2026-06-20T00:00:00Z').request;
    const attempted = transitionRecovery(started, 'EXECUTE', '2026-06-20T00:02:00Z');

    expect(attempted.request.status).toBe('WAITING_ARBITER');
    expect(attempted.message).toContain('не выполнены');
  });
});
