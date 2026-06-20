import type { RecoveryRequest, RecoveryStatus, RecoveryTransitionResult } from './types';

export type RecoveryAction =
  | 'START'
  | 'APPROVE_ARBITER'
  | 'COMPLETE_DELAY'
  | 'CANCEL'
  | 'EXECUTE'
  | 'RESET';

export function createInitialRecoveryRequest(epoch: number): RecoveryRequest {
  return {
    status: 'IDLE',
    startedAt: null,
    arbiterApproved: false,
    timelockComplete: false,
    oldDeviceStatus: 'ACTIVE',
    newDeviceStatus: 'PENDING',
    signerEpochBefore: epoch,
    signerEpochAfter: epoch,
    sessionKeysRevoked: false,
    accountAddressUnchanged: true,
    balancesUnchanged: true,
  };
}

export function canExecuteRecovery(status: RecoveryStatus): boolean {
  return status === 'READY';
}

export function transitionRecovery(
  request: RecoveryRequest,
  action: RecoveryAction,
  nowIso: string,
): RecoveryTransitionResult {
  if (action === 'RESET') {
    return {
      request: createInitialRecoveryRequest(request.signerEpochBefore),
      message: 'Сценарий восстановлен в исходное состояние.',
    };
  }

  if (action === 'CANCEL') {
    if (request.status === 'EXECUTED') {
      return { request, message: 'Исполненное восстановление уже нельзя отменить в демонстрационном сценарии.' };
    }

    return {
      request: { ...request, status: 'CANCELLED' },
      message: 'Восстановление отменено старым устройством или Recovery Signer.',
    };
  }

  if (action === 'START' && request.status === 'IDLE') {
    return {
      request: {
        ...request,
        status: 'WAITING_ARBITER',
        startedAt: nowIso,
        newDeviceStatus: 'PENDING',
      },
      message: 'Recovery request создан. Требуется подтверждение Arbiter.',
    };
  }

  if (action === 'APPROVE_ARBITER' && request.status === 'WAITING_ARBITER') {
    return {
      request: {
        ...request,
        status: 'TIMELOCK',
        arbiterApproved: true,
      },
      message: 'Arbiter подтвердил запрос. Начался timelock 48 часов.',
    };
  }

  if (action === 'COMPLETE_DELAY' && request.status === 'TIMELOCK') {
    return {
      request: {
        ...request,
        status: 'READY',
        timelockComplete: true,
      },
      message: 'Задержка завершена. Recovery готов к исполнению.',
    };
  }

  if (action === 'EXECUTE' && canExecuteRecovery(request.status)) {
    return {
      request: {
        ...request,
        status: 'EXECUTED',
        oldDeviceStatus: 'REVOKED',
        newDeviceStatus: 'ACTIVE',
        signerEpochAfter: request.signerEpochBefore + 1,
        sessionKeysRevoked: true,
        accountAddressUnchanged: true,
        balancesUnchanged: true,
      },
      message: 'Device Signer заменён, signer epoch увеличен, старые session keys отозваны.',
    };
  }

  return {
    request,
    message: 'Для этого действия ещё не выполнены необходимые условия.',
  };
}
