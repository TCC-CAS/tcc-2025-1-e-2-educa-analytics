import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export type UserType = 'educador' | 'educando' | 'tutor' | 'administrativo';

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: UserType;
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
    educador: { id: '1', nome: 'Maria Santos', email: 'maria@educa.com', tipo: 'educador' },
    educando: { id: '2', nome: 'João Silva', email: 'joao@educa.com', tipo: 'educando' },
    tutor: { id: '3', nome: 'Ana Costa', email: 'ana@educa.com', tipo: 'tutor' },
    administrativo: { id: '4', nome: 'Pedro Oliveira', email: 'pedro@educa.com', tipo: 'administrativo' }
  };

  constructor(private http: HttpClient) {
    this.checkAuthentication();
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
    return this.http.post('/api/auth/login', credentials);
  }

  loginMock(tipo: UserType): void {
    const user = this.mockUsers[tipo];
    localStorage.setItem('token', 'mock-token-' + tipo);
    localStorage.setItem('usuarioAtual', JSON.stringify(user));
    this.userSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioAtual');
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

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.userSubject.getValue();
  }

  getUserType(): UserType | null {
    const user = this.getCurrentUser();
    return user ? user.tipo : null;
  }

  getMockUser(tipo: UserType): User {
    return this.mockUsers[tipo];
  }
}
