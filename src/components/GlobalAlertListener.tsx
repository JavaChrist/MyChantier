import { useEffect } from 'react';
import { useAlertModal } from './AlertModal';
import { GLOBAL_ALERT_EVENT, type GlobalAlertPayload } from '../utils/alertBus';

export function GlobalAlertListener() {
  const { showAlert, AlertModalComponent } = useAlertModal();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<GlobalAlertPayload>;
      if (!customEvent.detail) return;

      const { title, message, type = 'info' } = customEvent.detail;
      showAlert(title, message, type);
    };

    window.addEventListener(GLOBAL_ALERT_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(GLOBAL_ALERT_EVENT, handler as EventListener);
    };
  }, [showAlert]);

  return <AlertModalComponent />;
}

