export type ToastType = 'success' | 'error' | 'info';

export interface ToastEventDetail {
  id: string;
  message: string;
  type: ToastType;
}

export function showToast(message: string, type: ToastType = 'success') {
  if (typeof window !== 'undefined') {
    const detail: ToastEventDetail = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      message,
      type,
    };
    window.dispatchEvent(new CustomEvent('app-toast', { detail }));
  }
}

export const toast = {
  success: (msg: string) => showToast(msg, 'success'),
  error: (msg: string) => showToast(msg, 'error'),
  info: (msg: string) => showToast(msg, 'info'),
};

