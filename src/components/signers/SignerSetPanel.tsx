import type {
  ArbiterSignerRecord,
  DeviceSignerRecord,
  SignerLifecycleStatus,
  SmartAccountSignerSets,
  SocialSignerRecord,
} from '../../domain/types';
import { StatusBadge } from '../ui/Badge';

type SignerRecord = DeviceSignerRecord | SocialSignerRecord | ArbiterSignerRecord;

interface SignerSetPanelProps {
  signerSets: SmartAccountSignerSets;
  selectedSignerIds: string[];
  onToggleSigner: (signerId: string) => void;
  availabilityLabel?: (signer: SignerRecord) => string;
}

export function SignerSetPanel({ signerSets, selectedSignerIds, onToggleSigner, availabilityLabel }: SignerSetPanelProps) {
  const selected = new Set(selectedSignerIds);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <SignerColumn
        title="Device Signers"
        prefix="Device"
        signers={signerSets.deviceSigners}
        selected={selected}
        onToggleSigner={onToggleSigner}
        availabilityLabel={availabilityLabel}
      />
      <SignerColumn
        title="Social Signers"
        prefix="Social"
        signers={signerSets.socialSigners}
        selected={selected}
        onToggleSigner={onToggleSigner}
        availabilityLabel={availabilityLabel}
      />
      <SignerColumn
        title="Arbiter Signers"
        prefix="Arbiter"
        signers={signerSets.arbiterSigners}
        selected={selected}
        onToggleSigner={onToggleSigner}
        availabilityLabel={availabilityLabel}
      />
    </div>
  );
}

function SignerColumn({
  title,
  prefix,
  signers,
  selected,
  onToggleSigner,
  availabilityLabel,
}: {
  title: string;
  prefix: string;
  signers: SignerRecord[];
  selected: Set<string>;
  onToggleSigner: (signerId: string) => void;
  availabilityLabel?: (signer: SignerRecord) => string;
}) {
  return (
    <section className="soft-panel p-4">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      <div className="space-y-3">
        {signers.map((signer) => {
          const active = signer.status === 'ACTIVE';
          const checked = selected.has(signer.signerId);

          return (
            <button
              key={signer.signerId}
              type="button"
              disabled={!active}
              onClick={() => onToggleSigner(signer.signerId)}
              className={`w-full rounded-lg border p-3 text-left transition ${
                checked ? 'border-accent-500 bg-accent-500/12' : 'border-white/10 bg-black/10'
              } ${active ? 'hover:border-accent-500/50' : 'cursor-not-allowed opacity-60'}`}
              aria-pressed={checked}
            >
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">
                  {prefix}[{signer.displayIndex}] — {signer.label}
                </span>
                <StatusBadge tone={statusTone(signer.status)}>{signer.status}</StatusBadge>
              </span>
              <span className="mt-2 block text-xs text-muted">signerId: {shortId(signer.signerId)}</span>
              <span className="mt-1 block text-xs text-muted">Тип: {signer.type}</span>
              <span className="mt-1 block text-xs text-muted">Добавлен: {signer.addedAt}</span>
              <span className="mt-2 block rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs">
                {availabilityLabel?.(signer) ?? (active ? 'Доступен для выбора' : 'Недоступен для текущей операции')}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function statusTone(status: SignerLifecycleStatus): 'good' | 'warn' | 'bad' | 'neutral' {
  if (status === 'ACTIVE') {
    return 'good';
  }

  if (status === 'SUSPENDED' || status === 'REPLACEMENT_PENDING') {
    return 'warn';
  }

  if (status === 'REVOKED') {
    return 'bad';
  }

  return 'neutral';
}

function shortId(value: string): string {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}
