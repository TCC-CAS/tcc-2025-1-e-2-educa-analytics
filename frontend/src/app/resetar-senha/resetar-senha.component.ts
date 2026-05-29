import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Componente para redefinir senha usando token recebido por email.
 */
@Component({
  selector: 'app-resetar-senha',
  templateUrl: './resetar-senha.component.html',
  styleUrls: ['./resetar-senha.component.scss']
})
export class ResetarSenhaComponent implements OnInit {
  token = '';
  idMatricula = '';
  novaSenha = '';
  confirmarSenha = '';
  
  mostrarSenha = false;
  mostrarConfirmar = false;
  
  validando = true;
  tokenValido = false;
  tokenExpirado = false;
  
  salvando = false;
  sucesso = false;
  erro = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}
  
  ngOnInit() {
    // Obter token e ID da URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.idMatricula = params['id'] || '';
      
      if (this.token && this.idMatricula) {
        this.validarToken();
      } else {
        this.validando = false;
        this.erro = 'Link inválido. Verifique o link recebido por email.';
      }
    });
  }
  
  validarToken() {
    this.authService.validarResetToken(this.token, this.idMatricula).subscribe({
      next: (response: any) => {
        this.validando = false;
        this.tokenValido = true;
      },
      error: (err: any) => {
        this.validando = false;
        this.tokenValido = false;
        
        if (err.error?.code === 'EXPIRED') {
          this.tokenExpirado = true;
          this.erro = 'Link expirado. Solicite um novo link de recuperação.';
        } else {
          this.erro = err.error?.erro || 'Link inválido.';
        }
      }
    });
  }
  
  toggleMostrarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }
  
  toggleMostrarConfirmar() {
    this.mostrarConfirmar = !this.mostrarConfirmar;
  }
  
  validarSenhas(): boolean {
    if (!this.novaSenha || this.novaSenha.length < 8) {
      this.erro = 'A senha deve ter no mínimo 8 caracteres.';
      return false;
    }
    
    if (this.novaSenha !== this.confirmarSenha) {
      this.erro = 'As senhas não coincidem.';
      return false;
    }
    
    return true;
  }
  
  onSubmit() {
    this.erro = '';
    
    if (!this.validarSenhas()) {
      return;
    }
    
    this.salvando = true;
    
    this.authService.resetarSenha(this.token, this.idMatricula, this.novaSenha).subscribe({
      next: (response: any) => {
        this.salvando = false;
        this.sucesso = true;
        
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err: any) => {
        this.salvando = false;
        this.erro = err.error?.erro || 'Erro ao redefinir senha. Tente novamente.';
      }
    });
  }
  
  solicitarNovoLink() {
    this.router.navigate(['/esqueci-senha']);
  }
}
