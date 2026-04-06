import { Injectable, inject, signal, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { 
  PushNotifications, 
  Token, 
  PushNotificationSchema, 
  ActionPerformed 
} from '@capacitor/push-notifications';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = environment.apiUrl;

  // State using Signals
  public registrationToken = signal<string | null>(null);
  public lastNotification = signal<PushNotificationSchema | null>(null);
  public pendingOrdenId = signal<number | null>(null);

  async initialize() {
    if (!isPlatformBrowser(this.platformId)) return;

    let perm = await PushNotifications.checkPermissions();

    if (perm.receive === 'prompt') {
      perm = await PushNotifications.requestPermissions();
    }

    if (perm.receive !== 'granted') {
      console.warn('Permisos de notificación push denegados.');
      return;
    }

    await PushNotifications.register();
    this.setupListeners();
  }

  private setupListeners() {
    PushNotifications.addListener('registration', (token: Token) => {
      this.registrationToken.set(token.value);
      this.sendTokenToBackend(token.value);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Error en el registro de FCM:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      this.lastNotification.set(notification);
      this.processPayload(notification.data);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      this.processPayload(action.notification.data);
    });
  }

  private processPayload(data: any) {
    if (data?.orden_id) {
      this.pendingOrdenId.set(Number(data.orden_id));
    }
  }

  private async sendTokenToBackend(fcmToken: string) {
    if (!this.authService.isAuthenticated()) return;
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/usuarios/fcm-token`, { fcm_token: fcmToken }));
    } catch (error) {
      console.error('No se pudo guardar el token en el servidor:', error);
    }
  }
}