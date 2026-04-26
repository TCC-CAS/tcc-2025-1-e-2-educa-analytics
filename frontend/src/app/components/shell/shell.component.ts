import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent {
  title = 'EducaAnalytics';
  menuRecolhido = false;
  submenusAbertos: { [key: string]: boolean } = {};

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get usuarioLogado(): boolean {
    return this.authService.isAuthenticated();
  }

  toggleSidebar(): void {
    this.menuRecolhido = !this.menuRecolhido;
    if (this.menuRecolhido) {
      this.submenusAbertos = {};
    }
  }

  toggleSubmenu(key: string): void {
    this.submenusAbertos[key] = !this.submenusAbertos[key];
  }

  isSubmenuAberto(key: string): boolean {
    return !!this.submenusAbertos[key];
  }

  logout(): void {
    if (confirm('Deseja realmente fazer logout?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}
