import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService, UserType, User } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

interface StatCard {
  label: string;
  valor: number | string;
  cor: string;
  icone: string;
  sufixo: string;
}

interface UserPresentation {
  saudacao: string;
  icone: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  usuarioAtual: User | null = null;
  tipoUsuario: UserType | null = null;
  apresentacao: UserPresentation = { saudacao: '', icone: '' };

  nomeReal: string | null = null;
  stats: StatCard[] = [];
  infoExtra: any = {};
  carregandoPerfil = true;

  private apresentacaoPorTipo: { [key in UserType]: UserPresentation } = {
    educador:      { saudacao: 'Olá, Educador(a)!',     icone: 'educator'  },
    educando:      { saudacao: 'Olá, Educando(a)!',     icone: 'student'   },
    responsavel:   { saudacao: 'Olá, Responsável!',     icone: 'family'    },
    colaborador:   { saudacao: 'Olá, Colaborador(a)!',  icone: 'briefcase' },
    gestor:        { saudacao: 'Olá, Gestor(a)!',       icone: 'director'  },
    administrativo:{ saudacao: 'Olá, Administrador(a)!',icone: 'admin'     },
  };

  constructor(private authService: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    this.usuarioAtual = this.authService.getCurrentUser();
    this.tipoUsuario  = this.authService.getUserType();
    const tipo = this.tipoUsuario || 'gestor';

    this.apresentacao = this.apresentacaoPorTipo[tipo];

    const matricula = this.usuarioAtual?.matricula || '';
    this.http.get<any>(`${environment.apiUrl}/home/perfil?tipo=${tipo}&matricula=${matricula}`)
      .subscribe({
        next: (res) => {
          this.nomeReal  = res.nome  || null;
          this.stats     = res.stats || [];
          this.infoExtra = res.info  || {};
          this.carregandoPerfil = false;
        },
        error: () => {
          this.carregandoPerfil = false;
        }
      });
  }

  get saudacaoPersonalizada(): string {
    if (this.nomeReal) {
      const primeiroNome = this.nomeReal.split(' ')[0];
      return `Bem-vindo(a), ${primeiroNome}!`;
    }
    return this.apresentacao.saudacao;
  }

  statCorClass(cor: string): string {
    const mapa: Record<string, string> = {
      azul: 'stat-azul', verde: 'stat-verde', roxo: 'stat-roxo', laranja: 'stat-laranja'
    };
    return mapa[cor] || 'stat-azul';
  }
}
