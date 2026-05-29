import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserType } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'EducaAnalytics';
  menuAberto: boolean = false;
  menuExpandido: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Limpa tokens ao iniciar se estiver em /login ou /
    const currentPath = window.location.pathname;
    if (currentPath === '/login' || currentPath === '/' || currentPath === '') {
      this.authService.logout();
    }
  }

  get usuarioLogado(): boolean {
    return this.authService.isAuthenticated();
  }

  get tipoUsuario(): UserType | null {
    return this.authService.getUserType();
  }

  get mostrarMenu(): boolean {
    const rotasSemMenu = ['/login', '/criar-senha'];
    const rotaAtual = this.router.url.split('?')[0]; // Remove query params
    return this.usuarioLogado && !rotasSemMenu.includes(rotaAtual);
  }

  /**
   * Verifica se o item de menu deve ser exibido para o tipo de usuário atual
   */
  mostrarItem(tiposPermitidos: UserType[]): boolean {
    const tipo = this.tipoUsuario;
    return tipo !== null && tiposPermitidos.includes(tipo);
  }

  logout(): void {
    if (confirm('Deseja realmente fazer logout?')) {
      // Limpa a autenticação
      this.authService.logout();
      // Navega para login
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
