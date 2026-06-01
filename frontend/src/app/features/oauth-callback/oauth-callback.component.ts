import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  template: `
    <div style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;gap:16px;">
      <div *ngIf="erro" style="color:#c0392b;font-size:1.1rem;">{{ erro }}</div>
      <div *ngIf="!erro" style="color:#2c3e50;font-size:1.1rem;">Autenticando...</div>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  erro = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    const code  = params['code']  || '';
    const state = params['state'] || '';
    const error = params['error'] || '';

    // Provider detectado pelo path atual: /auth/callback/google ou /auth/callback/microsoft
    const url = this.router.url;
    const provider = url.includes('microsoft') ? 'microsoft' : 'google';

    if (error) {
      this.erro = `Erro na autenticação: ${error}`;
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

    if (!code) {
      this.erro = 'Código de autorização não recebido.';
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

    const callback$ = provider === 'microsoft'
      ? this.auth.processMicrosoftCallback(code, state)
      : this.auth.processGoogleCallback(code, state);

    callback$.subscribe({
      next: (response: any) => {
        if (response?.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('usuarioAtual', JSON.stringify(response.usuario));
          this.auth.setToken(response.token);
          if (this.auth.setUser) { this.auth.setUser(response.usuario); }
        }
        this.router.navigate(['/home']);
      },
      error: (err: any) => {
        const msg = err?.error?.error || err?.message || 'Falha na autenticação OAuth';
        this.erro = msg;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      }
    });
  }
}
