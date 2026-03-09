import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  public notification$ = this.notificationSubject.asObservable();

  constructor() { }

  show(notification: Notification): void {
    const id = notification.id || `notification-${Date.now()}`;
    this.notificationSubject.next({ ...notification, id });

    if (notification.duration) {
      setTimeout(() => {
        this.clear();
      }, notification.duration);
    }
  }

  success(message: string, duration: number = 3000): void {
    this.show({ message, type: 'success', duration });
  }

  error(message: string, duration: number = 5000): void {
    this.show({ message, type: 'error', duration });
  }

  info(message: string, duration: number = 3000): void {
    this.show({ message, type: 'info', duration });
  }

  warning(message: string, duration: number = 4000): void {
    this.show({ message, type: 'warning', duration });
  }

  clear(): void {
    this.notificationSubject.next(null);
  }
}
