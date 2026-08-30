import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className="space-y-1.5 text-start w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-text-secondary uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={twMerge(
          clsx(
            'w-full rounded-xl border border-border-default bg-background-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-fast ease-standard',
            'focus:border-interactive-focus focus:outline-none focus:ring-2 focus:ring-interactive-focus/20',
            error && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
            className
          )
        )}
        {...props}
      />
      {error && <p className="text-xs text-error-500 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-text-secondary">{helperText}</p>
      )}
    </div>
  );
}

export default Input;
