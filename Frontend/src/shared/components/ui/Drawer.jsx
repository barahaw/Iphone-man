import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useUiStore } from '../../stores/useUiStore';
import { useTranslation } from '../../i18n/useTranslation';

export function Drawer({ isOpen, onClose, title, children }) {
  const dir = useUiStore((state) => state.dir);
  const { t } = useTranslation();
  const drawerRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
          onClose();
        }

        if (event.key === 'Tab' && drawerRef.current) {
          const focusableElements = drawerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              event.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              event.preventDefault();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      // Focus first focusable element inside drawer
      setTimeout(() => {
        if (drawerRef.current) {
          const firstFocusable = drawerRef.current.querySelector('button, [href], input, select, textarea');
          if (firstFocusable) firstFocusable.focus();
        }
      }, 50);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1300] overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-backdrop-fade transition-opacity duration-fast"
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 max-w-full flex ${
          dir === 'rtl' ? 'left-0 right-auto' : 'right-0 left-auto'
        }`}
      >
        <div
          ref={drawerRef}
          className={`w-screen max-w-md bg-background-primary border-s border-border-default shadow-xl flex flex-col transition-transform duration-normal ease-emphasized ${
            dir === 'rtl' ? 'animate-in slide-in-from-left' : 'animate-in slide-in-from-right'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
            <h2 id="drawer-title" className="text-lg font-bold text-text-primary">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-background-secondary active:scale-95 transition-all duration-fast"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 text-start">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Drawer;
