import { Injectable } from '@angular/core';
import { 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpInterceptor,
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor HTTP para adicionar token JWT nas requisições
 * e tratar erros de autenticação.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Adicionar token JWT se existir
    const token = this.authService.getToken();
    
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    // Processar requisição e tratar erros
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Token expirado ou inválido - Logout automático
        if (error.status === 401) {
          console.warn('[AuthInterceptor] Token inválido ou expirado. Redirecionando para login.');
          this.authService.clearSession();
          this.router.navigate(['/login'], {
            queryParams: { expired: true }
          });
        }
        
        // Sem permissão
        if (error.status === 403) {
          console.warn('[AuthInterceptor] Acesso negado.');
          // Você pode redirecionar para página de "Sem Permissão"
          // this.router.navigate(['/sem-permissao']);
        }
        
        // Rate limit
        if (error.status === 429) {
          console.warn('[AuthInterceptor] Muitas tentativas. Aguarde.');
        }
        
        return throwError(() => error);
      })
    );
  }
}
