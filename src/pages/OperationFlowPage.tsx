import { ArrowRight, Code2, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Tooltip } from '../components/ui/Tooltip';

const blocks = [
  {
    title: 'Пользователь',
    simple: 'Выбирает действие в кошельке: перевод, deposit, recovery или создание session key.',
    technical: 'Инициирует intent, который ещё не является blockchain-транзакцией.',
  },
  {
    title: 'Wallet UI',
    simple: 'Показывает детали операции и кодирует callData.',
    technical: 'Готовит target, value, callData и параметры validUntil для UserOperation.',
  },
  {
    title: 'Policy Engine',
    simple: 'Оценивает риск и выбирает требуемый набор подписантов.',
    technical: 'Вычисляет risk, required validation mode, лимиты, allowlist и timelock.',
  },
  {
    title: 'Signer Modules',
    simple: 'Собирают подтверждения Device, Social, Arbiter или Session Key.',
    technical: 'Подписывается userOpHash, привязанный к account, chainId, EntryPoint, nonce и signerEpoch.',
  },
  {
    title: 'Bundler',
    simple: 'Принимает UserOperation, симулирует и отправляет в EntryPoint.',
    technical: 'Вызывает eth_sendUserOperation после локальной проверки validateUserOp.',
  },
  {
    title: 'EntryPoint',
    simple: 'Единая точка ERC-4337, которая вызывает проверку и исполнение.',
    technical: 'handleOps вызывает validateUserOp, затем execute на Smart Account.',
  },
  {
    title: 'DSF Smart Account',
    simple: 'Проверяет подписи, политики и выполняет разрешённый вызов.',
    technical: 'Самостоятельно вычисляет минимально допустимый validationMode и проверяет modules/policies.',
  },
  {
    title: 'Target Contract',
    simple: 'Получает вызов: token transfer, DSF deposit, swap или другое действие.',
    technical: 'Исполняется только после успешной validation-фазы EntryPoint.',
  },
];

const steps = [
  'Пользователь выбирает действие.',
  'Wallet кодирует callData.',
  'Policy Engine определяет риск.',
  'Определяется required validation mode.',
  'Формируется UserOperation.',
  'Подписанты подписывают userOpHash.',
  'Paymaster решает, спонсировать ли газ.',
  'Bundler симулирует операцию.',
  'EntryPoint вызывает validateUserOp.',
  'Smart Account проверяет подписи и политики.',
  'Account выполняет вызовы.',
  'Газ компенсируется Bundler.',
];

const technicalFields = [
  'sender',
  'nonce',
  'factory',
  'factoryData',
  'callData',
  'callGasLimit',
  'verificationGasLimit',
  'preVerificationGas',
  'maxFeePerGas',
  'maxPriorityFeePerGas',
  'paymaster',
  'paymasterData',
  'signature',
];

export function OperationFlowPage() {
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState<'simple' | 'technical'>('simple');
  const selectedBlock = blocks[selected] ?? blocks[0]!;

  return (
    <div className="space-y-6">
      <Panel title="Путь операции через ERC-4337" eyebrow="Interactive flow">
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Режим объяснения">
          <Button
            type="button"
            variant={mode === 'simple' ? 'primary' : 'secondary'}
            onClick={() => setMode('simple')}
            icon={<UserRound className="h-4 w-4" />}
          >
            Показать простое объяснение
          </Button>
          <Button
            type="button"
            variant={mode === 'technical' ? 'primary' : 'secondary'}
            onClick={() => setMode('technical')}
            icon={<Code2 className="h-4 w-4" />}
          >
            Показать техническое объяснение
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {blocks.map((block, index) => (
            <button
              key={block.title}
              type="button"
              onClick={() => setSelected(index)}
              className={`min-h-24 rounded-lg border p-4 text-left transition ${
                selected === index
                  ? 'border-accent-500 bg-accent-500/12'
                  : 'border-white/10 bg-white/[0.04] hover:border-accent-500/50'
              }`}
            >
              <span className="mb-2 flex items-center justify-between gap-2">
                <span className="font-semibold">{block.title}</span>
                {index < blocks.length - 1 && <ArrowRight className="h-4 w-4 text-muted" aria-hidden="true" />}
              </span>
              <span className="text-sm text-muted">{mode === 'simple' ? block.simple : block.technical}</span>
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title={selectedBlock.title} eyebrow={mode === 'simple' ? 'Простое объяснение' : 'Техническое объяснение'}>
          <p className="text-slate-200">{mode === 'simple' ? selectedBlock.simple : selectedBlock.technical}</p>
          {mode === 'technical' && (
            <div className="mt-5">
              <Tooltip label="UserOperation — объект ERC-4337, который Bundler доставляет в EntryPoint вместо обычной транзакции.">
                <span className="text-sm font-semibold">Поля UserOperation</span>
              </Tooltip>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {technicalFields.map((field) => (
                  <code key={field} className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200">
                    {field}
                  </code>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Этапы" eyebrow="12 steps">
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-500/15 text-xs font-semibold text-accent-500">
                  {index + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
