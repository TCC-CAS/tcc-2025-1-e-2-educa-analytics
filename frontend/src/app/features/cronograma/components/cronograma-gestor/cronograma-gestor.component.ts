import { Component, OnInit } from '@angular/core';
import { CronogramaService, HorarioCronograma, Conflito } from '../../services/cronograma.service';
import { TurmasService } from '../../services/turmas.service';

interface FiltrosCronograma {
  idTurma?: number;
  idEducador?: string;
  idSala?: number;
}

@Component({
  selector: 'app-cronograma-gestor',
  templateUrl: './cronograma-gestor.component.html',
  styleUrls: ['./cronograma-gestor.component.scss']
})
export class CronogramaGestorComponent implements OnInit {
  // ─── DADOS ───────────────────────────────────────────────────────────────
  horarios: HorarioCronograma[] = [];
  conflitos: Conflito[] = [];
  turmas: any[] = [];
  
  // ─── FILTROS ─────────────────────────────────────────────────────────────
  filtros: FiltrosCronograma = {};
  
  // ─── CONTROLE DE VISUALIZAÇÃO ───────────────────────────────────────────
  visualizacao: 'semanal' | 'lista' | 'conflitos' = 'semanal';
  loading: boolean = false;
  
  // ─── GRADE SEMANAL ───────────────────────────────────────────────────────
  diasSemana = [
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' }
  ];
  
  horariosFixos = [
    '07:00', '07:50', '08:40', '09:30', '10:20', '11:10',
    '12:00', '13:00', '13:50', '14:40', '15:30', '16:20', '17:10'
  ];
  
  gradeSemanal: { [dia: string]: { [hora: string]: HorarioCronograma | null } } = {};
  
  // ─── ESTATÍSTICAS ────────────────────────────────────────────────────────
  estatisticas = {
    totalAulas: 0,
    totalConflitos: 0,
    conflitosAlta: 0,
    aulasHoje: 0
  };

  constructor(
    private cronogramaService: CronogramaService,
    private turmasService: TurmasService
  ) { }

  ngOnInit(): void {
    this.carregarDados();
    this.carregarTurmas();
    this.carregarConflitos();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CARREGAMENTO DE DADOS
  // ══════════════════════════════════════════════════════════════════════════

  carregarDados(): void {
    this.loading = true;
    this.cronogramaService.listarCronogramaGestor(this.filtros).subscribe({
      next: (response) => {
        this.horarios = response.horarios;
        this.construirGradeSemanal();
        this.calcularEstatisticas();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar cronograma:', err);
        alert('Erro ao carregar cronograma');
        this.loading = false;
      }
    });
  }

  carregarTurmas(): void {
    this.turmasService.listarTurmas().subscribe({
      next: (turmas) => {
        this.turmas = turmas;
      },
      error: (err) => console.error('Erro ao carregar turmas', err)
    });
  }

  carregarConflitos(): void {
    this.cronogramaService.listarConflitos().subscribe({
      next: (response) => {
        this.conflitos = response.conflitos || [];
        this.calcularEstatisticas();
      },
      error: (err) => console.error('Erro ao carregar conflitos', err)
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONSTRUÇÃO DA GRADE SEMANAL
  // ══════════════════════════════════════════════════════════════════════════

  construirGradeSemanal(): void {
    // Inicializar grade vazia
    this.gradeSemanal = {};
    this.diasSemana.forEach(dia => {
      this.gradeSemanal[dia.key] = {};
      this.horariosFixos.forEach(hora => {
        this.gradeSemanal[dia.key][hora] = null;
      });
    });

    // Preencher com horários
    this.horarios.forEach(horario => {
      const dia = horario.diaSemana;
      const hora = horario.horaInicio.substring(0, 5); // "07:00:00" -> "07:00"
      
      if (this.gradeSemanal[dia] && this.gradeSemanal[dia][hora] !== undefined) {
        this.gradeSemanal[dia][hora] = horario;
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS
  // ══════════════════════════════════════════════════════════════════════════

  calcularEstatisticas(): void {
    this.estatisticas.totalAulas = this.horarios.length;
    this.estatisticas.totalConflitos = this.conflitos.length;
    this.estatisticas.conflitosAlta = this.conflitos.filter(
      c => c.severidade === 'alta' || c.severidade === 'critica'
    ).length;
    
    // Aulas hoje (baseado no dia da semana atual)
    const hoje = new Date().getDay(); // 0=domingo, 1=segunda, ...
    const diasMap: { [key: number]: string } = {
      1: 'segunda', 2: 'terca', 3: 'quarta',
      4: 'quinta', 5: 'sexta', 6: 'sabado'
    };
    const diaHoje = diasMap[hoje];
    
    if (diaHoje) {
      this.estatisticas.aulasHoje = this.horarios.filter(
        h => h.diaSemana === diaHoje
      ).length;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FILTROS
  // ══════════════════════════════════════════════════════════════════════════

  aplicarFiltros(): void {
    this.carregarDados();
  }

  limparFiltros(): void {
    this.filtros = {};
    this.carregarDados();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AÇÕES
  // ══════════════════════════════════════════════════════════════════════════

  editarHorario(horario: HorarioCronograma): void {
    // Implementar modal de edição
    console.log('Editar horário:', horario);
  }

  excluirHorario(horario: HorarioCronograma): void {
    if (confirm(`Deseja realmente excluir esta aula de ${horario.disciplina?.nomeDisciplina}?`)) {
      const id = horario.idCronograma || horario.id;
      if (!id) return;
      
      this.cronogramaService.deletarAula(id).subscribe({
        next: () => {
          console.log('Horário excluído com sucesso');
          alert('Horário excluído com sucesso');
          this.carregarDados();
        },
        error: (err) => {
          console.error('Erro ao excluir horário:', err);
          alert('Erro ao excluir horário');
        }
      });
    }
  }

  novaAula(): void {
    // Implementar modal de criação
    console.log('Nova aula');
  }

  gerarGradeAutomatica(): void {
    if (!this.filtros.idTurma) {
      alert('Selecione uma turma primeiro');
      return;
    }

    // Implementar modal para selecionar período letivo
    const idPeriodo = 1; // TODO: Pegar do modal
    
    this.loading = true;
    this.cronogramaService.gerarGradeAutomatica(this.filtros.idTurma, idPeriodo).subscribe({
      next: (response) => {
        console.log('Grade gerada:', response);
        alert(`Grade gerada: ${response.criados} horários`);
        this.carregarDados();
      },
      error: (err) => {
        console.error('Erro ao gerar grade automática:', err);
        alert('Erro ao gerar grade automática');
        this.loading = false;
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UTILITÁRIOS
  // ══════════════════════════════════════════════════════════════════════════

  getCorAula(horario: HorarioCronograma | null): string {
    if (!horario) return 'transparent';
    return horario.cor || '#3788d8';
  }

  getSeveridadeBadge(severidade: string): string {
    const map: { [key: string]: string } = {
      baixa: 'info',
      media: 'warning',
      alta: 'danger',
      critica: 'danger'
    };
    return map[severidade] || 'info';
  }

  formatarHorario(hora: string): string {
    return hora.substring(0, 5); // "07:00:00" -> "07:00"
  }
}
