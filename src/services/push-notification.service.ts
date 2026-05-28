import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ApiService } from './api.service';

export class PushNotificationService {
  private static registered = false;

  static async init(onNavigate: (path: string) => void): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.registered) return;

    console.log('PUSH: Iniciando registro de push notifications...');

    const permission = await PushNotifications.requestPermissions();
    console.log('PUSH: Permiso:', permission.receive);
    if (permission.receive !== 'granted') return;

    // Registrar listeners ANTES de register() para no perder el evento
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('PUSH: FCM Token recibido:', token.value);
      try {
        await ApiService.post('/usuarios/fcm-token', { token: token.value });
        console.log('PUSH: Token enviado al backend OK');
      } catch (e) {
        console.warn('PUSH: Error enviando FCM token al backend:', e);
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('PUSH: Error registrando push:', JSON.stringify(error));
    });

    // Notificación recibida con app abierta → mostrar local notification
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: notification.title || 'ManteniApp',
          body: notification.body || '',
          extra: notification.data,
        }]
      });
    });

    // Usuario toca la notificación push
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      const data = action.notification.data;
      if (data?.solicitud_id) {
        onNavigate(`/solicitudes/${data.solicitud_id}`);
      } else {
        onNavigate('/solicitudes');
      }
    });

    // Usuario toca la notificación local (foreground)
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const data = action.notification.extra;
      if (data?.solicitud_id) {
        onNavigate(`/solicitudes/${data.solicitud_id}`);
      } else {
        onNavigate('/solicitudes');
      }
    });

    // Ahora sí registrar para obtener el token
    await PushNotifications.register();
    this.registered = true;
  }

  static async unregister(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    await PushNotifications.removeAllListeners();
    await LocalNotifications.removeAllListeners();
    this.registered = false;
  }
}
