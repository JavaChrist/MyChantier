export type GlobalAlertPayload = {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
};

export const GLOBAL_ALERT_EVENT = 'global-app-alert';

export function emitGlobalAlert(payload: GlobalAlertPayload) {
  if (typeof window === 'undefined') {
    return;
  }

  const event = new CustomEvent<GlobalAlertPayload>(GLOBAL_ALERT_EVENT, {
    detail: payload
  });

  window.dispatchEvent(event);
}

