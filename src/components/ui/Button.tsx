import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'dsf-btn-primary',
  secondary: 'dsf-btn-secondary',
  ghost: 'dsf-btn-ghost',
  danger: 'dsf-btn-danger',
};

export function Button({ variant = 'secondary', icon, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`dsf-btn inline-flex min-h-10 max-w-full items-center justify-center gap-2 whitespace-normal rounded-md px-4 py-2 text-center text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
