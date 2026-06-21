import type {
  ArbiterSignerRecord,
  DeviceSignerRecord,
  RequirementEvaluation,
  SignerRequirement,
  SmartAccountSignerSets,
  SocialSignerRecord,
} from './types';

type SignerKind = 'DEVICE' | 'SOCIAL' | 'ARBITER';
type SignerRecord = DeviceSignerRecord | SocialSignerRecord | ArbiterSignerRecord;

export const normalTransactionRequirement: SignerRequirement = {
  deviceThreshold: 1,
  socialThreshold: 1,
  arbiterThreshold: 0,
};

export const lostAllDevicesRequirement: SignerRequirement = {
  deviceThreshold: 0,
  socialThreshold: 2,
  arbiterThreshold: 1,
};

export const replaceSocialWithOtherSocialRequirement: SignerRequirement = {
  deviceThreshold: 1,
  socialThreshold: 1,
  arbiterThreshold: 0,
};

export const replaceOnlySocialRequirement: SignerRequirement = {
  deviceThreshold: 1,
  socialThreshold: 0,
  arbiterThreshold: 1,
};

export const emergencyFreezeRequirement: SignerRequirement = {
  deviceThreshold: 0,
  socialThreshold: 0,
  arbiterThreshold: 2,
};

export const unfreezeRequirement: SignerRequirement = {
  deviceThreshold: 1,
  socialThreshold: 1,
  arbiterThreshold: 0,
};

export function getActiveSignersByType(kind: 'DEVICE', signerSets: SmartAccountSignerSets): DeviceSignerRecord[];
export function getActiveSignersByType(kind: 'SOCIAL', signerSets: SmartAccountSignerSets): SocialSignerRecord[];
export function getActiveSignersByType(kind: 'ARBITER', signerSets: SmartAccountSignerSets): ArbiterSignerRecord[];
export function getActiveSignersByType(kind: SignerKind, signerSets: SmartAccountSignerSets): SignerRecord[] {
  const signersByKind: Record<SignerKind, SignerRecord[]> = {
    DEVICE: signerSets.deviceSigners,
    SOCIAL: signerSets.socialSigners,
    ARBITER: signerSets.arbiterSigners,
  };

  return signersByKind[kind].filter((signer) => signer.status === 'ACTIVE');
}

export function evaluateSignerRequirement(
  requirement: SignerRequirement,
  selectedSignerIds: string[],
  signerSets: SmartAccountSignerSets,
): RequirementEvaluation {
  const byId = new Map(allSigners(signerSets).map((signer) => [signer.signerId, signer]));
  const seen = new Set<string>();
  const validSignerIds: string[] = [];
  const ignoredSignerIds: string[] = [];
  const selected: SignerRequirement = {
    deviceThreshold: 0,
    socialThreshold: 0,
    arbiterThreshold: 0,
  };

  for (const signerId of selectedSignerIds) {
    if (seen.has(signerId)) {
      ignoredSignerIds.push(signerId);
      continue;
    }

    seen.add(signerId);
    const signer = byId.get(signerId);

    if (!signer || signer.status !== 'ACTIVE') {
      ignoredSignerIds.push(signerId);
      continue;
    }

    validSignerIds.push(signerId);

    if (signer.type === 'DEVICE') {
      selected.deviceThreshold += 1;
    }

    if (signer.type === 'SOCIAL') {
      selected.socialThreshold += 1;
    }

    if (signer.type === 'ARBITER') {
      selected.arbiterThreshold += 1;
    }
  }

  const missing = [
    thresholdMessage('Device', requirement.deviceThreshold, selected.deviceThreshold),
    thresholdMessage('Social', requirement.socialThreshold, selected.socialThreshold),
    thresholdMessage('Arbiter', requirement.arbiterThreshold, selected.arbiterThreshold),
  ].filter((message): message is string => Boolean(message));
  const fulfilled = missing.length === 0;

  return {
    requirement,
    selected,
    validSignerIds,
    ignoredSignerIds,
    fulfilled,
    missing,
    explanation: fulfilled ? 'Порог выполнен.' : missing.join(' '),
  };
}

export function canExecuteNormalTransaction(selectedSignerIds: string[], signerSets: SmartAccountSignerSets): RequirementEvaluation {
  return evaluateSignerRequirement(normalTransactionRequirement, selectedSignerIds, signerSets);
}

export function canReplaceLostDevices(
  selectedSignerIds: string[],
  signerSets: SmartAccountSignerSets,
  hasActiveDeviceRemaining: boolean,
): RequirementEvaluation {
  const requirement = hasActiveDeviceRemaining ? normalTransactionRequirement : lostAllDevicesRequirement;
  return evaluateSignerRequirement(requirement, selectedSignerIds, signerSets);
}

export function canReplaceSocialSigner(
  selectedSignerIds: string[],
  signerSets: SmartAccountSignerSets,
  hasOtherActiveSocial: boolean,
): RequirementEvaluation {
  const requirement = hasOtherActiveSocial ? replaceSocialWithOtherSocialRequirement : replaceOnlySocialRequirement;
  return evaluateSignerRequirement(requirement, selectedSignerIds, signerSets);
}

export function canEmergencyFreeze(selectedSignerIds: string[], signerSets: SmartAccountSignerSets): RequirementEvaluation {
  return evaluateSignerRequirement(emergencyFreezeRequirement, selectedSignerIds, signerSets);
}

export function canUnfreeze(selectedSignerIds: string[], signerSets: SmartAccountSignerSets): RequirementEvaluation {
  return evaluateSignerRequirement(unfreezeRequirement, selectedSignerIds, signerSets);
}

function allSigners(signerSets: SmartAccountSignerSets): SignerRecord[] {
  return [...signerSets.deviceSigners, ...signerSets.socialSigners, ...signerSets.arbiterSigners];
}

function thresholdMessage(label: string, required: number, selected: number): string | null {
  if (selected >= required) {
    return null;
  }

  return `Недостаточно ${label}-подписей: требуется ${required}, выбрано ${selected}.`;
}
