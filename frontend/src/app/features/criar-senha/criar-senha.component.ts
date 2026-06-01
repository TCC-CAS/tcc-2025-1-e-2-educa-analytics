import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type PageState = 'validating' | 'ready' | 'success' | 'invalid-token' | 'expired-token';

@Component({
  selector: 'app-criar-senha',
  templateUrl: './criar-senha.component.html',
  styleUrls: ['./criar-senha.component.scss']
})
export class CriarSenhaComponent implements OnInit {
  form: FormGroup;
  state: PageState = 'validating';
  loading = false;
  submitted = false;
  showPassword = false;
  showConfirm = false;

  readonly year = new Date().getFullYear();
  private token = '';
  private id = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {
    this.form = this.fb.group(
      {
        senha: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
        confirmar: ['', [Validators.required]]
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] ?? '';
    this.id = this.route.snapshot.queryParams['id'] ?? '';

    if (!this.token || !this.id) {
      this.state = 'invalid-token';
      return;
    }

    this.auth.validarTokenSenha(this.token, this.id).subscribe({
      next: () => { this.state = 'ready'; },
      error: (err: any) => {
        const status = err?.status ?? err?.error?.code;
        this.state = status === 'EXPIRED' || err?.error?.expired ? 'expired-token' : 'invalid-token';
      }
    });
  }

  get senha() { return this.form.get('senha')!; }
  get confirmar() { return this.form.get('confirmar')!; }

  get passwordStrength(): 'weak' | 'medium' | 'strong' {
    const v = this.senha.value ?? '';
    const checks = [
      /[A-Z]/.test(v),
      /[a-z]/.test(v),
      /\d/.test(v),
      /[^A-Za-z0-9]/.test(v),
      v.length >= 12
    ];
    const score = checks.filter(Boolean).length;
    if (score <= 2) return 'weak';
    if (score <= 3) return 'medium';
    return 'strong';
  }

  get passwordStrengthLabel(): string {
    const map = { weak: 'Fraca', medium: 'Média', strong: 'Forte' };
    return map[this.passwordStrength];
  }

  showSenhaError(): boolean {
    return this.senha.invalid && (this.senha.dirty || this.senha.touched || this.submitted);
  }

  showConfirmarError(): boolean {
    const mismatch = this.form.hasError('passwordsMismatch') && (this.confirmar.dirty || this.confirmar.touched || this.submitted);
    return (this.confirmar.hasError('required') && (this.confirmar.dirty || this.confirmar.touched || this.submitted)) || mismatch;
  }

  getSenhaError(): string {
    if (this.senha.hasError('required')) return 'A senha é obrigatória';
    if (this.senha.hasError('minlength')) return 'A senha deve ter ao menos 8 caracteres';
    if (this.senha.hasError('passwordStrength')) return 'Inclua letras maiúsculas, minúsculas e números';
    return '';
  }

  getConfirmarError(): string {
    if (this.confirmar.hasError('required')) return 'Confirme sua senha';
    if (this.form.hasError('passwordsMismatch')) return 'As senhas não coincidem';
    return '';
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading = true;
    this.auth.criarSenha(this.token, this.id, this.senha.value).subscribe({
      next: () => {
        this.loading = false;
        this.state = 'success';
      },
      error: (err: any) => {
        this.loading = false;
        this.submitted = false;
        const msg = err?.error?.message || 'Não foi possível definir a senha. Tente novamente.';
        alert(msg);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const v: string = control.value ?? '';
    if (!v) return null;
    const hasUpper = /[A-Z]/.test(v);
    const hasLower = /[a-z]/.test(v);
    const hasDigit = /\d/.test(v);
    if (!hasUpper || !hasLower || !hasDigit) return { passwordStrength: true };
    return null;
  }

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const senha = group.get('senha')?.value;
    const confirmar = group.get('confirmar')?.value;
    if (confirmar && senha !== confirmar) return { passwordsMismatch: true };
    return null;
  }
}
