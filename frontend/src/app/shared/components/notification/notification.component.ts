import { Component, OnInit } from '@angular/core';
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  notification: Notification | null = null;

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.notificationService.notification$.subscribe((notification: Notification | null) => {
      this.notification = notification;
    });
  }

  close(): void {
    this.notificationService.clear();
  }
}
