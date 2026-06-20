import type { AuthorizationRequirement, OperationDraft, SmartAccountState, UserOperationModel } from './types';

function encodeMockCallData(operation: OperationDraft): string {
  const selectorByType: Record<OperationDraft['type'], string> = {
    TRANSFER: '0xb61d27f6',
    APPROVE: '0x095ea7b3',
    SWAP: '0x38ed1739',
    DSF_DEPOSIT: '0xd0e30db0',
    DSF_WITHDRAW: '0x2e1a7d4d',
    ADD_SIGNER: '0x9f0f5b44',
    REMOVE_SIGNER: '0x0a5ea466',
    CREATE_SESSION_KEY: '0x6d2f8f3b',
    UPGRADE: '0x3659cfe6',
    RECOVERY: '0x42f7f9ec',
    CLAIM: '0x4e71d92d',
  };

  const amountHex = Math.round(operation.amount).toString(16).padStart(8, '0');
  return `${selectorByType[operation.type]}...${amountHex}`;
}

export function buildUserOperation(
  operation: OperationDraft,
  account: SmartAccountState,
  requirement: AuthorizationRequirement,
): UserOperationModel {
  const nonceTail = operation.type.length.toString(16).padStart(4, '0');
  const usesPaymaster = operation.gasMode === 'DSF_SPONSORED' || operation.gasMode === 'USDT';

  return {
    sender: account.address,
    nonce: `0x0000000${account.signerEpoch}0000${nonceTail}`,
    factory: null,
    factoryData: null,
    callData: encodeMockCallData(operation),
    callGasLimit: requirement.risk === 'CRITICAL' ? '320000' : '180000',
    verificationGasLimit: requirement.arbiterRequired ? '260000' : '240000',
    preVerificationGas: '52000',
    maxFeePerGas: '22000000000',
    maxPriorityFeePerGas: '1500000000',
    paymaster: usesPaymaster && requirement.paymasterAllowed ? '0xDSFPaymaster...A4337' : null,
    paymasterData: usesPaymaster && requirement.paymasterAllowed ? '0xquotaAndPolicyProof...' : null,
    signature: '0xmockSignatureBundle',
    validationMode: requirement.validationMode,
    validAfter: requirement.delayHours ? `+${requirement.delayHours} часов` : null,
    validUntil: operation.validUntil,
    signerEpoch: account.signerEpoch,
  };
}

export const signedPayloadFormula = `userOpHash = hash(
  account,
  chainId,
  EntryPoint,
  nonce,
  signerEpoch,
  validAfter,
  validUntil,
  callDataHash,
  gasParameters,
  validationMode
)`;
