import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isLoading = false;
  data: any[] = [];

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    // Exemplo de chamada à API
    // this.apiService.get('/dashboard').subscribe(
    //   (response) => {
    //     this.data = response;
    //     this.isLoading = false;
    //   },
    //   (error) => {
    //     this.isLoading = false;
    //     this.notificationService.error('Erro ao carregar dados do dashboard');
    //   }
    // );
    
    // Simulando carregamento
    setTimeout(() => {
      this.isLoading = false;
      this.notificationService.success('Dashboard carregado com sucesso!');
    }, 1000);
  }
}
