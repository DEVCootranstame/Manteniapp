import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { ApiService } from './api.service';

export class PushNotificationService {
  private static registered = false;

  static async init(onNavigate: (path: string) => void): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.registered) return;

    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return;

    await PushNotifications.register();
    this.registered = true;

    // Enviar token FCM al backend
    PushNotifications.addListener('registration', async (token: Token) => {
      try {
        await ApiService.post('/usuarios/fcm-token', { token: token.value });
      } catch {
        // Si el endpoint no existe aún, ignorar silenciosamente
      }
    });

    // Notificación recibida con app abierta (foreground)
    PushNotifications.addListener('pushNotificationReceived', (_notification: PushNotificationSchema) => {
      // Ionic mostrará la notificación, no hacemos nada extra
    });

    // Usuario toca la notificación → navegar a la solicitud
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      const data = action.notification.data;
      if (data?.solicitud_id) {
        onNavigate(`/solicitudes/${data.solicitud_id}`);
      } else {
        onNavigate('/solicitudes');
      }
    });
  }

  static async unregister(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    await PushNotifications.removeAllListeners();
    this.registered = false;
  }
}
