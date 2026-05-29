import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Serviço de autenticação e gerenciamento de sessão.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:3000/api';
  
  // Estado do usuário logado
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(private http: HttpClient) {
    // Restaurar usuário do storage ao iniciar
    this.restoreUser();
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════
     AUTENTICAÇÃO
     ═══════════════════════════════════════════════════════════════════════════ */
  
  /**
   * Login com email/ID e senha.
   * @param emailOuId Email ou matrícula (ex: COL-77331)
   * @param senha Senha do usuário
   * @param captchaToken Token do reCAPTCHA
   * @param lembrar Salvar token no localStorage (30 dias)
   */
  login(
    emailOuId: string, 
    senha: string, 
    captchaToken: string,
    lembrar: boolean = false
  ): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/login`, {
      email: emailOuId,  // Backend aceita email ou ID
      senha,
      captchaToken
    }).pipe(
      tap((response: any) => {
        if (response.token) {
          // Salvar token
          const storage = lembrar ? localStorage : sessionStorage;
          storage.setItem('token', response.token);
          storage.setItem('user', JSON.stringify(response.usuario));
          
          // Atualizar subject
          this.currentUserSubject.next(response.usuario);
        }
      })
    );
  }
  
  /**
   * Logout (encerra sessão no backend).
   */
  logout(): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/logout`, {}).pipe(
      tap(() => {
        this.clearSession();
      })
    );
  }
  
  /**
   * Limpa sessão local.
   */
  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }
  
  /**
   * Restaura usuário do storage.
   */
  private restoreUser() {
    const token = this.getToken();
    const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch (e) {
        this.clearSession();
      }
    }
  }
  
  /**
   * Retorna o token JWT salvo.
   */
  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
  
  /**
   * Retorna o usuário atual.
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }
  
  /**
   * Verifica se usuário está autenticado.
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════
     GERENCIAMENTO DE SESSÕES
     ═══════════════════════════════════════════════════════════════════════════ */
  
  /**
   * Lista sessões ativas do usuário.
   */
  listarSessoes(): Observable<any> {
    return this.http.get(`${this.API_URL}/auth/sessoes`);
  }
  
  /**
   * Encerra uma sessão específica (logout remoto).
   * @param idSessao ID da sessão a encerrar
   */
  encerrarSessao(idSessao: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/auth/sessoes/${idSessao}`);
  }
  
  /**
   * Encerra todas as sessões exceto a atual.
   */
  encerrarTodasSessoes(): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/sessoes/encerrar-todas`, {});
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════
     OAUTH (Google/Microsoft)
     ═══════════════════════════════════════════════════════════════════════════ */
  
  /**
   * Obtém URL para iniciar OAuth Google.
   */
  getGoogleAuthUrl(): Observable<any> {
    return this.http.get(`${this.API_URL}/auth/oauth/google/url`);
  }
  
  /**
   * Processa callback do Google OAuth.
   */
  processGoogleCallback(code: string, state: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/oauth/google/callback`, {
      code,
      state
    }).pipe(
      tap((response: any) => {
        if (response.token) {
          sessionStorage.setItem('token', response.token);
          sessionStorage.setItem('user', JSON.stringify(response.usuario));
          this.currentUserSubject.next(response.usuario);
        }
      })
    );
  }
  
  /**
   * Obtém URL para iniciar OAuth Microsoft.
   */
  getMicrosoftAuthUrl(): Observable<any> {
    return this.http.get(`${this.API_URL}/auth/oauth/microsoft/url`);
  }
  
  /**
   * Processa callback do Microsoft OAuth.
   */
  processMicrosoftCallback(code: string, state: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/oauth/microsoft/callback`, {
      code,
      state
    }).pipe(
      tap((response: any) => {
        if (response.token) {
          sessionStorage.setItem('token', response.token);
          sessionStorage.setItem('user', JSON.stringify(response.usuario));
          this.currentUserSubject.next(response.usuario);
        }
      })
    );
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════
     RECUPERAÇÃO DE SENHA
     ═══════════════════════════════════════════════════════════════════════════ */
  
  /**
   * Solicita reset de senha (envia email).
   * @param emailOuId Email ou matrícula
   */
  solicitarResetSenha(emailOuId: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/esqueci-senha`, {
      email: emailOuId
    });
  }
  
  /**
   * Valida token de reset de senha.
   * @param token Token recebido por email
   * @param id ID da matrícula
   */
  validarResetToken(token: string, id: string): Observable<any> {
    return this.http.get(`${this.API_URL}/auth/validar-reset-token`, {
      params: { token, id }
    });
  }
  
  /**
   * Redefine senha usando token.
   * @param token Token recebido por email
   * @param id ID da matrícula
   * @param senha Nova senha
   */
  resetarSenha(token: string, id: string, senha: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/resetar-senha`, {
      token,
      id,
      senha
    });
  }
  
  /* ═══════════════════════════════════════════════════════════════════════════
     CSRF TOKEN
     ═══════════════════════════════════════════════════════════════════════════ */
  
  /**
   * Obtém token CSRF do backend.
   */
  getCsrfToken(): Observable<any> {
    return this.http.get(`${this.API_URL}/auth/csrf-token`);
  }
}
