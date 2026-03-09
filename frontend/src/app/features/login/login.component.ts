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
  captchaToken: string | null = null;
  captchaResolved = false;
  returnUrl: string | null = '/home';
  submitted = false;
  forgotSubmitted = false;
  showForgotPanel = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notify: NotificationService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
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
    if (this.email.hasError('email')) {
      return 'Digite um email válido';
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
      return 'Digite um email valido ou um ID de matricula numerico';
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
  }

  submitForgotPassword(): void {
    this.forgotSubmitted = true;

    if (this.forgotForm.invalid) {
      this.notify.error('Informe um email valido ou ID de matricula para recuperar a senha');
      document.getElementById('forgot-email')?.focus();
      return;
    }

    this.forgotLoading = true;
    setTimeout(() => {
      this.forgotLoading = false;
      this.forgotSuccess = true;
    }, 600);
  }

  private emailOrIdValidator(control: AbstractControl): ValidationErrors | null {
    const rawValue = `${control.value ?? ''}`.trim();
    if (!rawValue) {
      return null;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const idPattern = /^\d{4,20}$/;

    if (emailPattern.test(rawValue) || idPattern.test(rawValue)) {
      return null;
    }

    return { emailOrId: true };
  }

  submit(): void {
    this.submitted = true;

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
          this.router.navigateByUrl(this.returnUrl || '/home');
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
        this.notify.error(err?.error?.message || 'Falha ao autenticar. Verifique suas credenciais e tente novamente.');
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
    // Simula o login com Google - em produção, usar biblioteca Google Sign-In
    setTimeout(() => {
      try {
        // Simula seleção aleatória de um tipo de usuário para demonstração
        const userTypes: UserType[] = ['educador', 'educando', 'tutor', 'administrativo'];
        const randomType = userTypes[Math.floor(Math.random() * userTypes.length)];
        
        // Login mock com o tipo selecionado
        this.auth.loginMock(randomType);
        this.auth.setToken('mock-google-token-' + randomType);
        this.notify.success(`Autenticado como ${randomType} via Google`);
        this.router.navigateByUrl(this.returnUrl || '/home');
      } catch (err) {
        this.notify.error('Falha ao autenticar com Google');
      } finally {
        this.googleLoading = false;
      }
    }, 1000);
  }

  loginWithOutlook(): void {
    this.outlookLoading = true;
    // Simula o login com Outlook/Microsoft - em produção, usar MSAL (Microsoft Authentication Library)
    setTimeout(() => {
      try {
        // Simula seleção aleatória de um tipo de usuário para demonstração
        const userTypes: UserType[] = ['educador', 'educando', 'tutor', 'administrativo'];
        const randomType = userTypes[Math.floor(Math.random() * userTypes.length)];
        
        // Login mock com o tipo selecionado
        this.auth.loginMock(randomType);
        this.auth.setToken('mock-outlook-token-' + randomType);
        this.notify.success(`Autenticado como ${randomType} via Outlook`);
        this.router.navigateByUrl(this.returnUrl || '/home');
      } catch (err) {
        this.notify.error('Falha ao autenticar com Outlook');
      } finally {
        this.outlookLoading = false;
      }
    }, 1000);
  }
}

