import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TurmasService, Sala, Serie, Periodo, AnoLetivo } from '../../services/turmas.service';

type StatusTurma = 'planejada' | 'ativa' | 'encerrada' | 'cancelada' | 'suspensa';

interface TurmaFormModel {
  codigo?: string;
  codTurma?: string;
  codigo_automatico?: string;
  nome?: string;
  nome_completo?: string;
  idSerie: number | null;
  idPeriodo: number | null;
  anoLetivo: number | null;
  idAnoLetivo?: number | null;
  idSala: number | null;
  capacidade_maxima: number | null;
  idCoordenador?: string;
  observacoes?: string;
  status: StatusTurma | '';
  dataInicio?: string;
  dataFim?: string;
}

@Component({
  selector: 'app-turma-form',
  templateUrl: './turma-form.component.html',
  styleUrls: ['./turma-form.component.scss']
})
export class TurmaFormComponent implements OnInit {
  turmaId: string | null = null;
  message = '';
  messageType: 'success' | 'error' = 'success';
  confirmVisible = false;
  carregando = false;
  salvando = false;
  
  // Dados para dropdowns
  salas: Sala[] = [];
  series: Serie[] = [];
  periodos: Periodo[] = [];
  anosLetivos: AnoLetivo[] = [];
  
  // Preview do código automático
  codigoPreview: string = '';
  alertaSala: string = '';
  alertaAnoLetivo: string = '';

  model: TurmaFormModel = {
    idSerie: null,
    idPeriodo: null,
    anoLetivo: 2026,
    idSala: null,
    capacidade_maxima: 30,
    observacoes: '',
    status: 'planejada'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private turmasService: TurmasService,
  ) {}

  ngOnInit(): void {
    this.turmaId = this.route.snapshot.paramMap.get('id');
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando = true;
    
    // Carregar séries
    this.turmasService.listarSeries().subscribe({
      next: (resp) => {
        this.series = resp.series || [];
      },
      error: () => this.showMessage('Erro ao carregar séries', 'error')
    });
    
    // Carregar períodos
    this.turmasService.listarPeriodos().subscribe({
      next: (resp) => {
        this.periodos = resp.periodos || [];
      },
      error: () => this.showMessage('Erro ao carregar períodos', 'error')
    });
    
    // Carregar anos letivos (necessário para mapeamento do ano digitado para idAnoLetivo)
    this.turmasService.listarAnosLetivos().subscribe({
      next: (resp) => {
        this.anosLetivos = resp.anos_letivos || [];
      },
      error: () => this.showMessage('Erro ao carregar anos letivos', 'error')
    });
    
    // Carregar salas
    this.turmasService.listarSalas().subscribe({
      next: (data) => { 
        this.salas = data
          .filter(s => s.status === 'ativa')
          .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
      },
      error: () => this.showMessage('Erro ao carregar salas', 'error')
    });
    
    // Se está editando, carregar dados da turma
    if (this.turmaId) {
      this.turmasService.buscar(+this.turmaId).subscribe({
        next: (response: any) => {
          // A API retorna {sucesso: true, turma: {...}}
          const t = response.turma || response;
          
          this.model = {
            codTurma: t.codTurma,
            codigo_automatico: t.codigo_automatico,
            nome_completo: t.nome_completo,
            idSerie: t.idSerie || null,
            idPeriodo: t.idPeriodo || t['p.idPeriodo'] || null,
            anoLetivo: t.ano_letivo || (typeof t.anoLetivo === 'number' ? t.anoLetivo : (t.anoLetivo ? parseInt(t.anoLetivo as string, 10) : 2026)),
            idAnoLetivo: t.idAnoLetivo || t['al.idAnoLetivo'] || null,
            idSala: t.idSala ?? null,
            capacidade_maxima: t.capacidade_maxima || 30,
            idCoordenador: t.idCoordenador,
            observacoes: t.observacoes,
            status: (t.status || 'planejada') as StatusTurma,
            dataInicio: t.dataInicio,
            dataFim: t.dataFim
          };
          this.codigoPreview = t.codTurma || t.codigo_automatico || '';
          this.carregando = false;
        },
        error: () => {
          this.showMessage('Erro ao carregar dados da turma.', 'error');
          this.carregando = false;
        },
      });
    } else {
      this.carregando = false;
    }
  }

  onCampoChange(): void {
    // Validar ano letivo
    if (this.model.anoLetivo && this.anosLetivos.length > 0) {
      const anoEncontrado = this.anosLetivos.find(a => a.ano === this.model.anoLetivo);
      if (!anoEncontrado) {
        this.alertaAnoLetivo = `⚠️ Ano letivo ${this.model.anoLetivo} não cadastrado. Anos disponíveis: ${this.anosLetivos.map(a => a.ano).join(', ')}`;
      } else {
        this.alertaAnoLetivo = '';
      }
    }
    
    // Validar ocupação da sala
    if (this.model.idSala && this.model.idPeriodo && this.model.anoLetivo) {
      // Buscar idAnoLetivo baseado no ano digitado
      const anoEncontrado = this.anosLetivos.find(a => a.ano === this.model.anoLetivo);
      if (anoEncontrado) {
        this.turmasService.validarOcupacaoSala(
          this.model.idSala,
          this.model.idPeriodo,
          anoEncontrado.idAnoLetivo,
          this.turmaId ? +this.turmaId : undefined
        ).subscribe({
          next: (resp) => {
            if (!resp.disponivel) {
              this.alertaSala = `⚠️ Sala já ocupada pela turma ${resp.turma_existente?.codigo_automatico || 'outra turma'}`;
            } else {
              this.alertaSala = '';
            }
          },
          error: () => {}
        });
      }
    }
    
    // Auto-preencher capacidade baseado na sala
    if (this.model.idSala && !this.turmaId) {
      const salaEscolhida = this.salas.find(s => s.id === this.model.idSala);
      if (salaEscolhida && salaEscolhida.capacidade) {
        this.model.capacidade_maxima = salaEscolhida.capacidade;
      }
    }
  }

  submit(formValid: boolean): void {
    if (!formValid) {
      this.showMessage('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    if (this.alertaAnoLetivo) {
      this.showMessage('Ano letivo inválido. Verifique os anos disponíveis.', 'error');
      return;
    }

    if (this.alertaSala) {
      this.showMessage('Sala já está ocupada. Escolha outra sala ou período.', 'error');
      return;
    }

    if (this.turmaId) {
      this.confirmVisible = true;
      return;
    }

    this.salvando = true;
    const payload = this.prepararPayload();
    this.turmasService.criar(payload).subscribe({
      next: (resp: any) => {
        this.salvando = false;
        const codigo = resp.codigo_automatico || 'nova turma';
        this.showMessage(`Turma ${codigo} cadastrada com sucesso!`, 'success');
        setTimeout(() => this.router.navigate(['/turmas']), 1500);
      },
      error: (err) => {
        this.salvando = false;
        const msg = err?.error?.erro || err?.error?.error || 'Erro ao cadastrar turma.';
        this.showMessage(msg, 'error');
      },
    });
  }

  confirmEdit(): void {
    this.confirmVisible = false;
    this.salvando = true;
    const payload = this.prepararPayload();
    this.turmasService.atualizar(+this.turmaId!, payload).subscribe({
      next: () => {
        this.salvando = false;
        this.showMessage('Turma editada com sucesso.', 'success');
        setTimeout(() => this.router.navigate(['/turmas']), 1500);
      },
      error: (err) => {
        this.salvando = false;
        const msg = err?.error?.erro || err?.error?.error || 'Erro ao editar turma.';
        this.showMessage(msg, 'error');
      },
    });
  }

  private prepararPayload(): any {
    // Buscar idAnoLetivo baseado no ano digitado ou usar o já carregado (modo edição)
    let idAnoLetivoFinal: number | undefined = this.model.idAnoLetivo ?? undefined;
    
    // Se não temos idAnoLetivo, buscar pelo ano
    if (!idAnoLetivoFinal && this.model.anoLetivo && this.anosLetivos.length > 0) {
      const anoEncontrado = this.anosLetivos.find(a => a.ano === this.model.anoLetivo);
      idAnoLetivoFinal = anoEncontrado?.idAnoLetivo;
    }
    
    return {
      ...this.model,
      idSerie: this.model.idSerie ?? undefined,
      idPeriodo: this.model.idPeriodo ?? undefined,
      idAnoLetivo: idAnoLetivoFinal,
      anoLetivo: this.model.anoLetivo ?? undefined,
      idSala: this.model.idSala ?? undefined,
      capacidade_maxima: this.model.capacidade_maxima ?? undefined,
      idCoordenador: this.model.idCoordenador || undefined,
      observacoes: this.model.observacoes || undefined,
      status: this.model.status || undefined,
      dataInicio: this.model.dataInicio || undefined,
      dataFim: this.model.dataFim || undefined
    };
  }

  cancelConfirm(): void {
    this.confirmVisible = false;
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  cancel(): void {
    this.router.navigate(['/turmas']);
  }
  
  getStatusLabel(status: string): string {
    const labels: {[key: string]: string} = {
      'planejada': 'Planejada',
      'ativa': 'Ativa',
      'encerrada': 'Encerrada',
      'cancelada': 'Cancelada',
      'suspensa': 'Suspensa'
    };
    return labels[status] || status;
  }
}
