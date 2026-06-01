import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-resetar-senha',
  templateUrl: './resetar-senha.component.html',
  styleUrls: ['./resetar-senha.component.scss']
})
export class ResetarSenhaComponent implements OnInit {

  token       = '';
  idMatricula = '';

  /** 'validating' | 'invalid' | 'expired' | 'ready' | 'success' */
  state: 'validating' | 'invalid' | 'expired' | 'ready' | 'success' = 'validating';

  form!: FormGroup;
  loading     = false;
  errorMsg    = '';
  showPassword = false;
  showConfirm  = false;

  readonly year = new Date().getFullYear();

  constructor(
    private fb:          FormBuilder,
    private route:       ActivatedRoute,
    private router:      Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        senha:    ['', [Validators.required, Validators.minLength(8)]],
        confirmar:['', [Validators.required]]
      },
      { validators: this.senhasIguaisValidator }
    );

    this.route.queryParams.subscribe(params => {
      this.token       = params['token'] || '';
      this.idMatricula = params['id']    || '';

      if (this.token && this.idMatricula) {
        this.validarToken();
      } else {
        this.state = 'invalid';
      }
    });
  }

  /* ── helpers de getter ─────────────────────────────────────── */

  get senha()    { return this.form.get('senha')!; }
  get confirmar(){ return this.form.get('confirmar')!; }

  get passwordStrength(): string {
    const v = this.senha.value as string || '';
    if (v.length < 6)  return 'weak';
    const score = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(v)).length;
    if (score <= 1) return 'weak';
    if (score === 2) return 'fair';
    if (score === 3) return 'good';
    return 'strong';
  }

  get passwordStrengthLabel(): string {
    return ({ weak: 'Fraca', fair: 'Razoável', good: 'Boa', strong: 'Forte' } as Record<string, string>)[this.passwordStrength] || '';
  }

  showSenhaError(): boolean {
    return this.senha.invalid && (this.senha.dirty || this.senha.touched);
  }

  getSenhaError(): string {
    if (this.senha.hasError('required'))   return 'A senha é obrigatória.';
    if (this.senha.hasError('minlength'))  return 'A senha deve ter no mínimo 8 caracteres.';
    return '';
  }

  showConfirmarError(): boolean {
    return (this.confirmar.invalid || this.form.hasError('senhasMismatch'))
        && (this.confirmar.dirty  || this.confirmar.touched);
  }

  getConfirmarError(): string {
    if (this.confirmar.hasError('required'))       return 'Confirme a senha.';
    if (this.form.hasError('senhasMismatch'))       return 'As senhas não coincidem.';
    return '';
  }

  /* ── validador customizado ─────────────────────────────────── */

  private senhasIguaisValidator(group: AbstractControl): ValidationErrors | null {
    const a = group.get('senha')?.value;
    const b = group.get('confirmar')?.value;
    return a && b && a !== b ? { senhasMismatch: true } : null;
  }

  /* ── actions ───────────────────────────────────────────────── */

  validarToken(): void {
    this.state = 'validating';
    this.authService.validarResetToken(this.token, this.idMatricula).subscribe({
      next: () => { this.state = 'ready'; },
      error: (err: any) => {
        if (err?.error?.code === 'EXPIRED' || err?.status === 400) {
          this.state = 'expired';
        } else {
          this.state = 'invalid';
        }
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading  = true;
    this.errorMsg = '';

    this.authService.resetarSenha(this.token, this.idMatricula, this.senha.value).subscribe({
      next: () => {
        this.loading = false;
        this.state   = 'success';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err: any) => {
        this.loading  = false;
        this.errorMsg = err?.error?.mensagem || err?.error?.error || 'Erro ao redefinir a senha. Tente novamente.';
      }
    });
  }

  goToLogin(): void { this.router.navigate(['/login']); }

  requestNewLink(): void { this.router.navigate(['/login']); }
}
