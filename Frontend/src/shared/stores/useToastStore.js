import { create } from 'zustand';

let toastId = 0;

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: ({ message, type = 'success', duration = 3000 }) => {
    const id = ++toastId;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  success: (message, duration) => get().addToast({ message, type: 'success', duration }),
  error: (message, duration) => get().addToast({ message, type: 'error', duration }),
  info: (message, duration) => get().addToast({ message, type: 'info', duration }),
}));
