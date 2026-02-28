import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'EducaAnalytics';
  menuAberto: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get usuarioLogado(): boolean {
    return this.authService.isAuthenticated();
  }

  logout(): void {
    if (confirm('Deseja realmente fazer logout?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  toggleMenuUsuario(): void {
    this.menuAberto = !this.menuAberto;
  }

  fecharMenuUsuario(): void {
    this.menuAberto = false;
  }
}
