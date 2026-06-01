import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AuthService, UserType } from '../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { RecaptchaComponent } from 'ng-recaptcha';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('captcha') captchaRef!: RecaptchaComponent;
  
  form: FormGroup;
  forgotForm: FormGroup;
  loading = false;
  googleLoading = false;
  outlookLoading = false;
  forgotLoading = false;
  forgotSuccess = false;
  forgotError = '';
  captchaToken: string | null = null;
  captchaResolved = false;
  returnUrl: string | null = '/home';
  submitted = false;
  forgotSubmitted = false;
  showForgotPanel = false;
  showPassword = false;
  loginError = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notify: NotificationService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, this.emailOrIdValidator]],
      password: ['', [Validators.required]]
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, this.emailOrIdValidator]]
    });
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParams['returnUrl'];
    if (q) this.returnUrl = q;
  }

  ngAfterViewInit(): void {
    this.forceLoginFormStyles();

    const startTime = performance.now();
    const frameLoop = () => {
      this.forceLoginFormStyles();
      if (performance.now() - startTime < 1200) {
        requestAnimationFrame(frameLoop);
      }
    };
    requestAnimationFrame(frameLoop);

    // Observa mudancas no DOM e reaplica por 2s (UserWay costuma injetar estilos)
    const observer = new MutationObserver(() => {
      this.forceLoginFormStyles();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    setTimeout(() => {
      observer.disconnect();
    }, 2000);
  }

  private forceLoginFormStyles(): void {
    const loginForm = document.querySelector('.login-form') as HTMLElement;
    if (loginForm) {
      loginForm.style.setProperty('display', 'flex', 'important');
      loginForm.style.setProperty('flex-direction', 'column', 'important');
      loginForm.style.setProperty('align-items', 'flex-start', 'important');
      loginForm.style.setProperty('width', '100%', 'important');
    }

    const fields = document.querySelectorAll('.login-form .field') as NodeListOf<HTMLElement>;
    fields.forEach((field) => {
      field.style.setProperty('width', '100%', 'important');
      field.style.setProperty('text-align', 'left', 'important');

      const label = field.querySelector('label') as HTMLElement;
      if (label) {
        label.style.setProperty('display', 'block', 'important');
        label.style.setProperty('text-align', 'left', 'important');
      }

      const inputWrapper = field.querySelector('.input-wrapper') as HTMLElement;
      if (inputWrapper) {
        inputWrapper.style.setProperty('display', 'flex', 'important');
        inputWrapper.style.setProperty('align-items', 'center', 'important');
        inputWrapper.style.setProperty('width', '100%', 'important');

        const input = inputWrapper.querySelector('input') as HTMLElement;
        if (input) {
          input.style.setProperty('width', '100%', 'important');
          input.style.setProperty('display', 'block', 'important');
          input.style.setProperty('text-align', 'left', 'important');
        }
      }

      const errorMessage = field.querySelector('.error-message') as HTMLElement;
      if (errorMessage) {
        errorMessage.style.setProperty('display', 'block', 'important');
        errorMessage.style.setProperty('text-align', 'left', 'important');
      }
    });

    const captchaContainer = document.querySelector('.captcha-container') as HTMLElement;
    if (captchaContainer) {
      captchaContainer.style.setProperty('display', 'flex', 'important');
      captchaContainer.style.setProperty('flex-direction', 'column', 'important');
      captchaContainer.style.setProperty('align-items', 'center', 'important');
      captchaContainer.style.setProperty('width', '100%', 'important');

      const captchaWarning = captchaContainer.querySelector('.captcha-warning') as HTMLElement;
      if (captchaWarning) {
        captchaWarning.style.setProperty('display', 'flex', 'important');
        captchaWarning.style.setProperty('justify-content', 'flex-start', 'important');
        captchaWarning.style.setProperty('text-align', 'left', 'important');
        captchaWarning.style.setProperty('align-self', 'flex-start', 'important');
        captchaWarning.style.setProperty('width', '100%', 'important');
      }
    }

    const primaryBtn = document.querySelector('.primary') as HTMLElement;
    if (primaryBtn) {
      primaryBtn.style.setProperty('display', 'flex', 'important');
      primaryBtn.style.setProperty('width', '100%', 'important');
      primaryBtn.style.setProperty('justify-content', 'center', 'important');
    }
  }

  // Getters para validação de campos
  get email() {
    return this.form.get('email')!;
  }

  get password() {
    return this.form.get('password')!;
  }

  get forgotEmail() {
    return this.forgotForm.get('email')!;
  }

  // Mensagens de erro
  getEmailError(): string {
    if (this.email.hasError('required')) {
      return 'Email ou ID de Matrícula é obrigatório';
    }
    if (this.email.hasError('emailOrId')) {
      return 'Digite um email ou ID de matrícula válido';
    }
    return '';
  }

  getPasswordError(): string {
    if (this.password.hasError('required')) {
      return 'Senha é obrigatória';
    }
    return '';
  }

  getForgotEmailError(): string {
    if (this.forgotEmail.hasError('required')) {
      return 'Email ou ID de matricula e obrigatorio';
    }
    if (this.forgotEmail.hasError('emailOrId')) {
      return 'Digite um email ou ID de matrícula válido';
    }
    return '';
  }

  showEmailError(): boolean {
    return this.email.invalid && (this.email.dirty || this.email.touched || this.submitted);
  }

  showPasswordError(): boolean {
    return this.password.invalid && (this.password.dirty || this.password.touched || this.submitted);
  }

  showForgotEmailError(): boolean {
    return this.forgotEmail.invalid && (this.forgotEmail.dirty || this.forgotEmail.touched || this.forgotSubmitted);
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleForgotPasswordPanel(event?: Event): void {
    if (event) event.preventDefault();
    this.showForgotPanel = !this.showForgotPanel;
    this.forgotSubmitted = false;
    this.forgotSuccess = false;

    if (this.showForgotPanel) {
      const currentEmail = this.form.get('email')?.value || '';
      this.forgotForm.reset({ email: currentEmail });
      setTimeout(() => {
        document.getElementById('forgot-email')?.focus();
      }, 0);
    }
  }

  closeForgotPasswordPanel(): void {
    this.showForgotPanel = false;
    this.forgotLoading = false;
    this.forgotSuccess = false;
    this.forgotError = '';
  }

  submitForgotPassword(): void {
    this.forgotSubmitted = true;

    if (this.forgotForm.invalid) {
      this.notify.error('Informe um email válido ou ID de matrícula para recuperar a senha');
      document.getElementById('forgot-email')?.focus();
      return;
    }

    this.forgotLoading = true;
    const email = this.forgotForm.get('email')?.value;

    this.auth.esqueciSenha(email).subscribe({
      next: (res) => {
        this.forgotLoading = false;

        // Verifica se o backend retornou sucesso=false mesmo com HTTP 200
        if (res && res.sucesso === false) {
          const errorMessage = res.mensagem || 'Erro ao solicitar recuperação de senha. Tente novamente mais tarde.';
          this.forgotSuccess = false;
          this.forgotError = errorMessage;
          this.notify.error(`❌ ${errorMessage}`, 6000);
          setTimeout(() => { document.getElementById('forgot-email')?.focus(); }, 100);
          return;
        }

        this.forgotSuccess = true;
        this.forgotError = '';
        this.notify.success('📧 Instruções de recuperação enviadas! Verifique seu e-mail e a pasta de spam.', 8000);

        setTimeout(() => {
          const successPanel = document.querySelector('.panel-success');
          if (successPanel) {
            successPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotSuccess = false;

        const errorMessage = err?.error?.mensagem || err?.error?.message || err?.error?.error
          || 'Erro ao solicitar recuperação de senha. Tente novamente mais tarde.';

        this.forgotError = errorMessage;
        this.notify.error(`❌ ${errorMessage}`, 6000);

        setTimeout(() => { document.getElementById('forgot-email')?.focus(); }, 100);
      }
    });
  }

  private emailOrIdValidator(control: AbstractControl): ValidationErrors | null {
    const rawValue = `${control.value ?? ''}`.trim();
    if (!rawValue) {
      return null;
    }

    // Aceita formato de email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Aceita IDs numéricos puros (ex: 706363650)
    const numericIdPattern = /^\d+$/;
    
    // Aceita IDs de matrícula do sistema:
    // - COL-77331 ou COL77331 (Colaborador)
    // - EDU004 ou EDU-004 (Educador)
    // - GES-12345 (Gestor)
    // - ADM-98765 (Administrativo)
    // - EST-55555 ou EDN-55555 (Educando)
    // - RES-44444 (Responsável)
    const idPattern = /^(COL|EDU|GES|ADM|EST|EDN|RES)-?\d+$/i;

    if (emailPattern.test(rawValue) || numericIdPattern.test(rawValue) || idPattern.test(rawValue)) {
      return null;
    }

    return { emailOrId: true };
  }

  submit(): void {
    this.submitted = true;
    this.loginError = '';

    if (this.form.invalid) {
      this.notify.error('Por favor, corrija os erros no formulário');
      if (this.email.invalid) {
        document.getElementById('email')?.focus();
      } else if (this.password.invalid) {
        document.getElementById('password')?.focus();
      }
      return;
    }

    if (!this.captchaResolved) {
      this.notify.error('Por favor, verifique o reCAPTCHA');
      return;
    }
    
    this.loading = true;
    
    // Enviar token do CAPTCHA junto com as credenciais
    const loginData = {
      ...this.form.value,
      captchaToken: this.captchaToken
    };
    
    this.auth.login(loginData).subscribe({
      next: (res: any) => {
        if (res && res.token) {
          this.auth.setToken(res.token);

          // Salvar dados do usuário
          if (res.usuario) {
            this.auth.setUser(res.usuario);
          }

          // Redirecionar para o home do usuário
          const destino = (!this.returnUrl || this.returnUrl === '/')
            ? '/home'
            : this.returnUrl;
          this.router.navigateByUrl(destino);
        } else {
          this.notify.error('Resposta de login inválida');
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.submitted = false;
        this.captchaResolved = false;
        this.captchaRef?.reset();
        // Sempre mostrar mensagem genérica por segurança (não revelar se foi email, ID ou senha)
        this.loginError = 'Email, ID ou senha inválidos. Por favor, verifique e tente novamente.';
        this.notify.error(this.loginError);
      }
    });
  }

  onCaptchaResolved(token: string | null): void {
    if (token) {
      this.captchaToken = token;
      this.captchaResolved = true;
    } else {
      this.captchaResolved = false;
      this.captchaToken = null;
    }
  }

  loginWithGoogle(): void {
    this.googleLoading = true;
    this.auth.getGoogleAuthUrl().subscribe({
      next: (res: any) => {
        window.location.href = res.url;
      },
      error: () => {
        this.googleLoading = false;
        this.notify.error('Falha ao iniciar autenticação com Google');
      }
    });
  }

  loginWithOutlook(): void {
    this.outlookLoading = true;
    this.auth.getMicrosoftAuthUrl().subscribe({
      next: (res: any) => {
        window.location.href = res.url;
      },
      error: () => {
        this.outlookLoading = false;
        this.notify.error('Falha ao iniciar autenticação com Microsoft');
      }
    });
  }

  /**
   * Login rápido com usuário de teste (para desenvolvimento)
   */
  quickLogin(tipo: UserType): void {
    this.auth.loginMock(tipo);
    this.notify.success(`Login como ${tipo}`);
    const rotasPorTipo: Record<string, string> = {
      educador:       '/educadores/cronograma',
      educando:       '/educando/notas',
      responsavel:    '/responsavel/acompanhamento',
      colaborador:    '/colaboradores',
      gestor:         '/home',
      administrativo: '/home',
    };
    this.router.navigateByUrl(rotasPorTipo[tipo] || '/home');
  }
}

