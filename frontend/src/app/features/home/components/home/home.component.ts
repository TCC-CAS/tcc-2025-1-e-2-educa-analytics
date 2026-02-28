import { Component, OnInit } from '@angular/core';
import { AuthService, UserType, User } from '../../../../core/services/auth.service';

interface QuickAccessItem {
  titulo: string;
  icone: string;
  rota: string;
  cor: string;
  descricao: string;
}

interface Estatistica {
  titulo: string;
  valor: number;
  icone: string;
  cor: 'verde' | 'azul' | 'amarelo' | 'vermelho' | 'roxo' | 'laranja';
}

interface UserHome {
  titulo: string;
  subtitulo: string;
  icone: string;
  stats: Estatistica[];
  atalhos: QuickAccessItem[];
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  usuarioAtual: User | null = null;
  tipoUsuario: UserType | null = null;
  configs: UserHome = {} as UserHome;

  private configsPorTipo: { [key in UserType]: UserHome } = {
    educador: {
      titulo: 'Bem-vindo, Educador!',
      subtitulo: 'Gerencie suas turmas e acompanhe o desempenho dos educandos',
      icone: '👨‍🏫',
      stats: [
        { titulo: 'Minhas Turmas', valor: 5, icone: '👥', cor: 'azul' },
        { titulo: 'Total de Educandos', valor: 157, icone: '📚', cor: 'verde' },
        { titulo: 'Atividades Pendentes', valor: 8, icone: '✏️', cor: 'amarelo' },
        { titulo: 'Avaliações para Gravar', valor: 23, icone: '📝', cor: 'laranja' }
      ],
      atalhos: [
        { titulo: 'Minhas Turmas', icone: '👥', rota: '/turmas', cor: 'azul', descricao: 'Gerenciar turmas' },
        { titulo: 'Frequência', icone: '✅', rota: '/frequencia', cor: 'verde', descricao: 'Registrar presença' },
        { titulo: 'Notas', icone: '📊', rota: '/notas', cor: 'laranja', descricao: 'Lançar avaliações' },
        { titulo: 'Avaliações', icone: '📋', rota: '/avaliacoes', cor: 'roxo', descricao: 'Responder feedback' },
        { titulo: 'Meu Desempenho', icone: '📈', rota: '/dashboard-escolar', cor: 'azul', descricao: 'Ver indicadores' },
        { titulo: 'Eventos', icone: '📅', rota: '/eventos', cor: 'amarelo', descricao: 'Calendário escolar' }
      ]
    },
    educando: {
      titulo: 'Bem-vindo, Educando!',
      subtitulo: 'Acompanhe suas notas, frequência e progresso escolar',
      icone: '👨‍🎓',
      stats: [
        { titulo: 'Média Geral', valor: 8, icone: '⭐', cor: 'verde' },
        { titulo: 'Frequência', valor: 94, icone: '✅', cor: 'azul' },
        { titulo: 'Tarefas Pendentes', valor: 3, icone: '📝', cor: 'vermelho' },
        { titulo: 'Avaliações Respondidas', valor: 2, icone: '✔️', cor: 'roxo' }
      ],
      atalhos: [
        { titulo: 'Meu Boletim', icone: '📄', rota: '/notas', cor: 'azul', descricao: 'Ver minhas notas' },
        { titulo: 'Minha Frequência', icone: '✅', rota: '/frequencia', cor: 'verde', descricao: 'Acompanhar presença' },
        { titulo: 'Minhas Disciplinas', icone: '📚', rota: '/disciplinas', cor: 'laranja', descricao: 'Ver disciplinas' },
        { titulo: 'Responder Avaliações', icone: '📋', rota: '/avaliacoes', cor: 'roxo', descricao: 'Feedback institucional' },
        { titulo: 'Calendário', icone: '📅', rota: '/eventos', cor: 'amarelo', descricao: 'Eventos importantes' },
        { titulo: 'Dashboard', icone: '📊', rota: '/dashboard-escolar', cor: 'azul', descricao: 'Indicadores gerais' }
      ]
    },
    tutor: {
      titulo: 'Bem-vindo, Responsável!',
      subtitulo: 'Acompanhe o desenvolvimento e desempenho do seu educando',
      icone: '👨‍👩‍👧',
      stats: [
        { titulo: 'Educandos Associados', valor: 2, icone: '👶', cor: 'roxo' },
        { titulo: 'Frequência Média', valor: 92, icone: '✅', cor: 'verde' },
        { titulo: 'Média de Notas', valor: 7, icone: '📊', cor: 'azul' },
        { titulo: 'Comunicados Pendentes', valor: 1, icone: '📢', cor: 'amarelo' }
      ],
      atalhos: [
        { titulo: 'Acompanhar Notas', icone: '📋', rota: '/notas', cor: 'azul', descricao: 'Ver boletim' },
        { titulo: 'Frequência Educandos', icone: '✅', rota: '/frequencia', cor: 'verde', descricao: 'Presença registrada' },
        { titulo: 'Dados Matrículas', icone: '📝', rota: '/matricula', cor: 'laranja', descricao: 'Informações escolares' },
        { titulo: 'Comunicados', icone: '📬', rota: '/eventos', cor: 'vermelho', descricao: 'Mensagens da escola' },
        { titulo: 'Dashboard Educandos', icone: '📊', rota: '/dashboard-escolar', cor: 'azul', descricao: 'Desempenho escolar' },
        { titulo: 'Responder Avaliações', icone: '📋', rota: '/avaliacoes', cor: 'roxo', descricao: 'Feedback institucional' }
      ]
    },
    administrativo: {
      titulo: 'Bem-vindo, Administrador!',
      subtitulo: 'Gerencie todas as operações da instituição com dados em tempo real',
      icone: '⚙️',
      stats: [
        { titulo: 'Total de Matrículas', valor: 1250, icone: '📚', cor: 'azul' },
        { titulo: 'Turmas Ativas', valor: 45, icone: '👥', cor: 'verde' },
        { titulo: 'Colaboradores', valor: 98, icone: '🧑‍💼', cor: 'laranja' },
        { titulo: 'Fornecedores Ativos', valor: 12, icone: '🏢', cor: 'roxo' }
      ],
      atalhos: [
        { titulo: 'Dashboard Financeiro', icone: '💰', rota: '/dashboard-financeiro', cor: 'verde', descricao: 'Análise financeira' },
        { titulo: 'Dashboard Escolar', icone: '📊', rota: '/dashboard-escolar', cor: 'azul', descricao: 'Indicadores educacionais' },
        { titulo: 'Gerenciar Matrículas', icone: '📝', rota: '/matricula', cor: 'laranja', descricao: 'Matrícula de educandos' },
        { titulo: 'Gestão de Caixa', icone: '🏦', rota: '/caixa', cor: 'verde', descricao: 'Movimentação financeira' },
        { titulo: 'Fornecedores', icone: '🏭', rota: '/fornecedores', cor: 'vermelho', descricao: 'Gerenciar fornecedores' },
        { titulo: 'Colaboradores', icone: '👨‍💼', rota: '/colaboradores', cor: 'amarelo', descricao: 'Equipe institucional' }
      ]
    }
  };

  userTypes: UserType[] = ['educador', 'educando', 'tutor', 'administrativo'];

  infoCards = [
    { icone: '🎯', titulo: 'Gestão Integrada', descricao: 'Toda a informação da instituição em um único lugar' },
    { icone: '📊', titulo: 'Análise de Dados', descricao: 'Visualize dashboards e indicadores em tempo real' },
    { icone: '💬', titulo: 'Feedback Contínuo', descricao: 'Sistema de avaliações para melhoria contínua' }
  ];

  constructor(private authService: AuthService) {
    this.usuarioAtual = this.authService.getCurrentUser();
    this.tipoUsuario = this.authService.getUserType();
    
    // Se não tem usuário logado, usa mock educador
    if (!this.usuarioAtual) {
      this.authService.loginMock('educador');
      this.usuarioAtual = this.authService.getCurrentUser();
      this.tipoUsuario = this.authService.getUserType();
    }
  }

  ngOnInit(): void {
    if (this.tipoUsuario) {
      this.configs = this.configsPorTipo[this.tipoUsuario];
    }
  }

  trocarTipoUsuario(tipo: UserType): void {
    this.authService.loginMock(tipo);
    this.usuarioAtual = this.authService.getCurrentUser();
    this.tipoUsuario = this.authService.getUserType();
    if (this.tipoUsuario) {
      this.configs = this.configsPorTipo[this.tipoUsuario];
    }
  }
}
