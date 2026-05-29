import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { CronogramaService, GerarGradeResponse } from '../../services/cronograma.service';

interface DadosGeracaoAutomatica {
  anoLetivo: number;
  serie: string;
  turno: string;
  turmas: string[];
}

interface Turma {
  idTurma: number;
  codTurma: string;
  nomeTurma: string;
  serie: string;
  turno: string;
  anoLetivo: string;
  qldVagas: number;
  vagasOcupadas: number[];
  vagasDisponiveis: number;
}

interface Periodo {
  idPeriodo: number;
  nomePeriodo: string;
  anoLetivo: string;
  dataInicio: string;
  dataFim: string;
}

@Component({
  selector: 'app-gerar-automatico',
  templateUrl: './gerar-automatico.component.html',
  styleUrls: ['./gerar-automatico.component.scss']
})
export class GerarAutomaticoComponent implements OnInit {
  loading = false;
  resultado: any = null;
  erro: string | null = null;
  message = '';
  messageType: 'success' | 'error' = 'success';

  // Filtros
  anoLetivo: number = new Date().getFullYear();
  serie: string = '';
  turno: string = '';
  turmasSelecionadas: string[] = [];

  // Dados carregados
  anosLetivos: number[] = [];
  seriesDisponiveis: string[] = [];
  turmasDisponiveis: Turma[] = [];
  periodosDisponiveis: Periodo[] = [];

  readonly SERIES = [
    '1º Ano EF', '2º Ano EF', '3º Ano EF', '4º Ano EF', '5º Ano EF',
    '6º Ano EF', '7º Ano EF', '8º Ano EF', '9º Ano EF'
  ];

  readonly TURNOS = ['Manhã', 'Tarde', 'Noite'];

  constructor(
    private cronogramaService: CronogramaService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarAnosLetivos();
  }

  carregarAnosLetivos(): void {
    const anoAtual = new Date().getFullYear();
    this.anosLetivos = [];
    for (let i = -2; i <= 2; i++) {
      this.anosLetivos.push(anoAtual + i);
    }
    this.anoLetivo = anoAtual;
    this.carregarSeries();
  }

  carregarSeries(): void {
    if (!this.anoLetivo) {
      this.seriesDisponiveis = [];
      return;
    }
    this.http.get<string[]>(`${environment.apiUrl}/matricula/series?anoLetivo=${this.anoLetivo}`)
      .subscribe({
        next: (series) => {
          this.seriesDisponiveis = series;
        },
        error: (err) => {
          console.error('Erro ao carregar séries:', err);
          this.seriesDisponiveis = this.SERIES;
        }
      });
  }

  onAnoLetivoChange(): void {
    this.serie = '';
    this.turno = '';
    this.turmasSelecionadas = [];
    this.carregarSeries();
  }

  onSerieChange(): void {
    this.turno = '';
    this.turmasSelecionadas = [];
  }

  onTurnoChange(): void {
    this.turmasSelecionadas = [];
    this.carregarTurmas();
  }

  carregarTurmas(): void {
    if (!this.anoLetivo || !this.serie || !this.turno) {
      this.turmasDisponiveis = [];
      return;
    }
    
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/turmas`).subscribe({
      next: (response) => {
        const todasTurmas = (response.data || response || []);
        this.turmasDisponiveis = todasTurmas
          .filter((t: any) => 
            t.status === 'ativa' && 
            t.anoLetivo === this.anoLetivo.toString() &&
            t.serie === this.serie &&
            t.turno === this.turno
          )
          .map((t: any) => ({
            idTurma: t.idTurma,
            codTurma: t.codTurma || '',
            nomeTurma: t.nomeTurma || '',
            serie: t.serie || '',
            turno: t.turno || '',
            anoLetivo: t.anoLetivo || '',
            qldVagas: t.qldVagas || 0,
            vagasOcupadas: [],
            vagasDisponiveis: t.qldVagas || 0
          }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar turmas:', err);
        this.showMessage('Erro ao carregar turmas', 'error');
        this.loading = false;
      }
    });
  }

  carregarPeriodos(): void {
    // Carregar períodos (criar endpoint se não existir, ou usar valores fixos)
    this.periodosDisponiveis = [
      {
        idPeriodo: 3,
        nomePeriodo: 'Ano Letivo 2025',
        anoLetivo: '2025',
        dataInicio: '2025-02-01',
        dataFim: '2025-12-15'
      },
      {
        idPeriodo: 4,
        nomePeriodo: 'Ano Letivo 2026',
        anoLetivo: '2026',
        dataInicio: '2026-02-01',
        dataFim: '2026-12-15'
      },
      {
        idPeriodo: 5,
        nomePeriodo: 'Ano Letivo 2027',
        anoLetivo: '2027',
        dataInicio: '2027-02-01',
        dataFim: '2027-12-15'
      }
    ];
    
    this.loading = false;
  }

  toggleTurma(codTurma: string): void {
    const index = this.turmasSelecionadas.indexOf(codTurma);
    if (index === -1) {
      this.turmasSelecionadas.push(codTurma);
    } else {
      this.turmasSelecionadas.splice(index, 1);
    }
  }

  selecionarTodasTurmas(): void {
    this.turmasSelecionadas = this.turmasDisponiveis.map(t => t.codTurma);
  }

  limparSelecao(): void {
    this.turmasSelecionadas = [];
  }

  gerarGrade(): void {
    if (!this.validarFormulario()) return;

    this.loading = true;
    this.erro = null;
    this.resultado = null;

    // Encontra o período correspondente ao ano letivo
    const periodo = this.periodosDisponiveis.find(p => p.anoLetivo === this.anoLetivo.toString());
    if (!periodo) {
      this.showMessage('Período letivo não encontrado', 'error');
      this.loading = false;
      return;
    }

    // Para cada turma selecionada, gera o cronograma
    const requests = this.turmasSelecionadas.map(codTurma => {
      const turma = this.turmasDisponiveis.find(t => t.codTurma === codTurma);
      if (!turma) return null;

      return this.cronogramaService.gerarGradeAutomatica({
        idTurma: turma.idTurma,
        idPeriodo: periodo.idPeriodo
      });
    }).filter(r => r !== null);

    // Executa todas as requisições
    let aulasTotal = 0;
    let conflitosTotal = 0;
    let errosTotal = 0;

    const processarResultado = (response: any, index: number) => {
      if (response.success) {
        aulasTotal += response.aulas_criadas || 0;
        conflitosTotal += (response.conflitos || []).length;
      } else {
        errosTotal++;
      }

      if (index === requests.length - 1) {
        // Última requisição
        this.loading = false;
        if (errosTotal > 0) {
          this.showMessage(
            `Concluído com problemas: ${aulasTotal} aulas criadas, ${errosTotal} turma(s) com erro`, 
            'error'
          );
        } else {
          this.resultado = {
            aulas_criadas: aulasTotal,
            conflitos: [],
            avisos: [],
            message: `${aulasTotal} aulas criadas com sucesso para ${this.turmasSelecionadas.length} turma(s)`
          };
          this.showMessage('Cronograma gerado com sucesso!', 'success');
        }
      }
    };

    requests.forEach((request, index) => {
      request!.subscribe({
        next: (response: any) => processarResultado(response, index),
        error: (err: any) => {
          errosTotal++;
          console.error('Erro ao gerar grade:', err);
          if (index === requests.length - 1) {
            this.loading = false;
            this.showMessage('Erro ao gerar cronograma', 'error');
          }
        }
      });
    });
  }

  validarFormulario(): boolean {
    if (!this.anoLetivo) {
      this.showMessage('Selecione um ano letivo', 'error');
      return false;
    }
    if (!this.serie) {
      this.showMessage('Selecione uma série', 'error');
      return false;
    }
    if (!this.turno) {
      this.showMessage('Selecione um turno', 'error');
      return false;
    }
    if (this.turmasSelecionadas.length === 0) {
      this.showMessage('Selecione pelo menos uma turma', 'error');
      return false;
    }
    return true;
  }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 4000);
  }

  voltarParaCronograma(): void {
    this.router.navigate(['/cronograma']);
  }
}
