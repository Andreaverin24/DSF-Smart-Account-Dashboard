import { AlertOctagon, Code2 } from 'lucide-react';
import { JsonBlock } from '../components/ui/JsonBlock';
import { Panel } from '../components/ui/Panel';

const accountMethods = [
  'validateUserOp',
  'execute',
  'executeBatch',
  'isValidSignature',
  'installModule',
  'uninstallModule',
  'startRecovery',
  'cancelRecovery',
  'executeRecovery',
  'freeze',
  'unfreeze',
];

const modules = {
  Validators: ['DeviceP256Validator', 'SocialValidator', 'ArbiterECDSAValidator', 'RecoveryValidator', 'SessionKeyValidator'],
  Policies: [
    'SpendingLimitPolicy',
    'AllowedTargetsPolicy',
    'AllowedMethodsPolicy',
    'RecipientPolicy',
    'TimelockPolicy',
    'RiskPolicy',
  ],
  Hooks: ['SecurityHook', 'AuditHook'],
  Infrastructure: ['DSFAccountFactory', 'EntryPoint', 'Bundler', 'DSFPaymaster'],
};

const pseudocode = `function validateOperation(operation, signatures) {
  const risk = policyEngine.calculateRisk(operation)
  const requiredMode = policyEngine.requiredValidationMode(risk, operation)
  const signaturesValid = validators.validate(requiredMode, signatures)
  const policiesValid = policies.validate(operation)

  return signaturesValid && policiesValid
}`;

export function TechnicalModelPage() {
  return (
    <div className="space-y-6">
      <Panel title="DSFSmartAccount" eyebrow="Contract surface">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {accountMethods.map((method) => (
            <code key={method} className="rounded-md border border-white/10 bg-black/20 px-3 py-3 text-sm">
              {method}
            </code>
          ))}
        </div>
      </Panel>

      <Panel title="Модули" eyebrow="Validators, policies, hooks">
        <div className="grid gap-4 xl:grid-cols-4">
          {Object.entries(modules).map(([group, items]) => (
            <div key={group} className="soft-panel p-4">
              <h3 className="mb-3 text-sm font-semibold">{group}</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Validation flow" eyebrow="Pseudocode">
        <div className="mb-4 flex items-center gap-3 text-accent-500">
          <Code2 className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-semibold">Локальная иллюстрация контрактной логики</span>
        </div>
        <JsonBlock value={pseudocode} label="Псевдокод" />
      </Panel>

      <Panel title="Критическое предупреждение" eyebrow="Client input is not trusted">
        <div className="flex gap-3 rounded-lg border border-signal-red/40 bg-signal-red/10 p-4">
          <AlertOctagon className="mt-1 h-5 w-5 shrink-0 text-signal-red" aria-hidden="true" />
          <p className="leading-7">
            Поле validationMode, переданное клиентом, не является доверенным. Контракт самостоятельно вычисляет минимально допустимый режим
            авторизации.
          </p>
        </div>
      </Panel>
    </div>
  );
}
