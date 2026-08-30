import { useToastStore } from '../stores/useToastStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const STYLES = {
  success: 'bg-background-dark text-text-inverse border border-neutral-800',
  error: 'bg-error-500 text-white',
  info: 'bg-background-dark text-text-inverse border border-neutral-800',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 start-1/2 -translate-x-1/2 z-[1500] flex flex-col gap-2 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-full shadow-lg text-[13px] font-semibold animate-toast-in ${STYLES[toast.type]}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ms-2 p-0.5 rounded-full hover:bg-white/20 active:scale-90 transition-all duration-fast"
              aria-label="إغلاق"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;
