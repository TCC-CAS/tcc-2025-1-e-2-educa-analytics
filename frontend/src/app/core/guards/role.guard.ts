import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService, UserType } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const allowedRoles = route.data['roles'] as UserType[];
    
    if (!allowedRoles || allowedRoles.length === 0) {
      // Se não há roles especificadas, permite acesso
      return true;
    }

    if (allowedRoles.includes(user.tipo)) {
      return true;
    }

    // Usuário não tem permissão, redireciona para home
    this.router.navigate(['/home']);
    return false;
  }
}
