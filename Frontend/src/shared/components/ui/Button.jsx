import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  disabled = false,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-fast ease-standard focus:outline-none focus:ring-2 focus:ring-interactive-focus disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] cursor-pointer select-none';

  const variants = {
    primary: 'bg-interactive-primary text-text-inverse hover:bg-interactive-primary-hover active:bg-interactive-primary-active shadow-sm',
    secondary: 'bg-interactive-secondary text-text-primary hover:bg-interactive-secondary-hover active:bg-interactive-secondary-active border border-border-default',
    ghost: 'text-text-brand hover:bg-background-secondary active:scale-[0.97]',
    destructive: 'bg-error-500 text-white hover:bg-error-600 shadow-sm',
    outline: 'border border-border-default text-text-primary hover:bg-background-secondary',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base rounded-2xl',
  };

  return (
    <button
      disabled={disabled}
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
