import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function SurfaceCard({
  as: Component = 'div',
  interactive = false,
  elevated = false,
  className = '',
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        'surface-card',
        interactive && 'surface-card-interactive',
        elevated && 'surface-card-elevated',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export default SurfaceCard;
