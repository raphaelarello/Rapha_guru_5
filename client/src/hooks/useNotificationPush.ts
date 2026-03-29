import { useEffect, useState } from 'react';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  sound?: string;
}

export function useNotificationPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      // Registrar service worker
      navigator.serviceWorker.register('/service-worker.js').catch((err) => {
        console.error('Erro ao registrar service worker:', err);
      });

      // Verificar permissão
      setIsSubscribed(Notification.permission === 'granted');
    }

    // Carregar preferência de som
    const saved = localStorage.getItem('notificationSoundEnabled');
    if (saved !== null) {
      setSoundEnabled(JSON.parse(saved));
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return false;

    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setIsSubscribed(granted);
    return granted;
  };

  const playSound = () => {
    if (!soundEnabled) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Som de alerta: 800Hz por 200ms
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const notify = async (options: NotificationOptions) => {
    if (!isSupported || !isSubscribed) return;

    try {
      // Tocar som se habilitado
      if (soundEnabled && options.sound !== 'off') {
        playSound();
      }

      // Enviar notificação via service worker
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag || 'notification',
        requireInteraction: true,
      });
    } catch (err) {
      console.error('Erro ao enviar notificação:', err);
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notificationSoundEnabled', JSON.stringify(newValue));
  };

  return {
    isSupported,
    isSubscribed,
    soundEnabled,
    requestPermission,
    notify,
    toggleSound,
  };
}
