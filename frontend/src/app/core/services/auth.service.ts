import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export type UserType = 'educador' | 'educando' | 'responsavel' | 'colaborador' | 'gestor' | 'administrativo';

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: UserType;
  matricula?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<User | null>(null);
  
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public user$ = this.userSubject.asObservable();

  private mockUsers: { [key: string]: User } = {
    educador: {
      id: '670718951',
      matricula: '670718951',
      nome: 'Maria Santos',
      email: 'maria.santos@educa.com',
      tipo: 'educador'
    },
    educando: {
      id: '661900001',
      matricula: '661900001',
      nome: 'João Silva',
      email: 'joao.silva@educa.com',
      tipo: 'educando'
    },
    responsavel: {
      id: '651800001',
      matricula: '651800001',
      nome: 'Maria Ferreira',
      email: 'maria.ferreira@educa.com',
      tipo: 'responsavel'
    },
    colaborador: {
      id: '641700001',
      matricula: '641700001',
      nome: 'Carlos Mendes',
      email: 'carlos.mendes@educa.com',
      tipo: 'colaborador'
    },
    gestor: {
      id: '631600001',
      matricula: '631600001',
      nome: 'Patricia Lima',
      email: 'patricia.lima@educa.com',
      tipo: 'gestor'
    },
    administrativo: {
      id: '621500001',
      matricula: '621500001',
      nome: 'Pedro Oliveira',
      email: 'pedro.oliveira@educa.com',
      tipo: 'administrativo'
    }
  };

  constructor(private http: HttpClient) {
    // Não faz checkAuthentication automático
    // O usuário deve fazer login explicitamente
  }

  private checkAuthentication(): void {
    const token = localStorage.getItem('token');
    const usuarioAtual = localStorage.getItem('usuarioAtual');
    
    if (token && usuarioAtual) {
      const user = JSON.parse(usuarioAtual) as User;
      this.userSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    } else {
      this.isAuthenticatedSubject.next(false);
    }
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login`, credentials);
  }

  loginMock(tipo: UserType): void {
    const user = this.mockUsers[tipo];
    localStorage.setItem('token', 'mock-token-' + tipo);
    localStorage.setItem('usuarioAtual', JSON.stringify(user));
    this.userSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  logout(): void {
    // Remove do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioAtual');
    localStorage.clear(); // Limpa tudo para garantir
    
    // Atualiza subjects
    this.userSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
    this.isAuthenticatedSubject.next(true);
  }

  setUser(usuario: any): void {
    // Mapear resposta do backend para formato User
    const user: User = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
      matricula: usuario.id
    };
    
    localStorage.setItem('usuarioAtual', JSON.stringify(user));
    this.userSubject.next(user);
  }

  isAuthenticated(): boolean {
    // Primeiro verifica o subject (fonte da verdade)
    const isAuth = this.isAuthenticatedSubject.getValue();
    
    // Se o subject diz que está autenticado, verifica se realmente tem token
    if (isAuth) {
      const token = this.getToken();
      if (!token) {
        // Inconsistência: subject diz autenticado mas não tem token
        // Corrige o estado
        this.isAuthenticatedSubject.next(false);
        this.userSubject.next(null);
        return false;
      }
      return true;
    }
    
    // Se o subject diz que não está autenticado, mas tem token
    const token = this.getToken();
    if (token) {
      const usuarioAtual = localStorage.getItem('usuarioAtual');
      if (usuarioAtual) {
        const user = JSON.parse(usuarioAtual) as User;
        this.userSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        return true;
      }
    }
    
    return false;
  }

  getCurrentUser(): User | null {
    // Primeiro verifica o subject
    let user = this.userSubject.getValue();
    
    // Se não tem no subject, tenta buscar do localStorage
    if (!user) {
      const usuarioAtual = localStorage.getItem('usuarioAtual');
      const token = localStorage.getItem('token');
      if (usuarioAtual && token) {
        user = JSON.parse(usuarioAtual) as User;
        this.userSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      }
    }
    
    return user;
  }

  getUserType(): UserType | null {
    const user = this.getCurrentUser();
    return user ? user.tipo : null;
  }

  getMockUser(tipo: UserType): User {
    return this.mockUsers[tipo];
  }

  validarTokenSenha(token: string, id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/auth/validar-token`, { params: { token, id } });
  }

  criarSenha(token: string, id: string, senha: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/criar-senha`, { token, id, senha });
  }

  esqueciSenha(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/esqueci-senha`, { email });
  }

  validarResetToken(token: string, id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/auth/validar-reset-token`, { params: { token, id } });
  }

  resetarSenha(token: string, id: string, senha: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/resetar-senha`, { token, id, senha });
  }

  getGoogleAuthUrl(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/auth/oauth/google/url`);
  }

  getMicrosoftAuthUrl(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/auth/oauth/microsoft/url`);
  }

  processGoogleCallback(code: string, state: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/oauth/google/callback`, { code, state });
  }

  processMicrosoftCallback(code: string, state: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/oauth/microsoft/callback`, { code, state });
  }
}
