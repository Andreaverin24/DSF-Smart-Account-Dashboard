import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';

export function JsonBlock({ value, label = 'JSON' }: { value: unknown; label?: string }) {
  const [copied, setCopied] = useState(false);
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-200">{label}</span>
        <Button
          type="button"
          variant="ghost"
          onClick={copy}
          aria-label="Скопировать JSON"
          icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        >
          {copied ? 'Скопировано' : 'Копировать'}
        </Button>
      </div>
      <pre className="code-block">
        <code>{text}</code>
      </pre>
    </div>
  );
}
