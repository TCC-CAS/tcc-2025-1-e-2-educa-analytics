import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MatrizCurricularService,
  MatrizCurricular,
  SalvarSerieRequest,
  ItemSerie
} from '../../services/matriz-curricular.service';
import { DisciplinasService, Disciplina } from '../../../disciplinas/services/disciplinas.service';

/** Linha da tabela de disciplinas no formulário */
interface DisciplinaRow {
  idDisciplina: number;
  nome: string;
  codigo: string;
  areaConhecimento: string;

  /** Está incluída na grade desta série? */
  ativa: boolean;
  qas: number;
  observacoes: string;
}

@Component({
  selector: 'app-matriz-curricular-form',
  templateUrl: './matriz-curricular-form.component.html',
  styleUrls: ['./matriz-curricular-form.component.scss']
})
export class MatrizCurricularFormComponent implements OnInit {

  // ── Estado da tela ──────────────────────────────────────────

  isLoadingDisciplinas = true;
  isSaving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  confirmVisible = false;

  // ── Configuração da série ───────────────────────────────────

  serie = '';
  anoLetivo = new Date().getFullYear();
  motivoAlteracao = '';

  readonly seriesDisponiveis = [
    '1º Ano EF', '2º Ano EF', '3º Ano EF', '4º Ano EF', '5º Ano EF',
    '6º Ano EF', '7º Ano EF', '8º Ano EF', '9º Ano EF'
  ];

  anosLetivos: number[] = [];

  // ── Linhas da grade ─────────────────────────────────────────

  rows: DisciplinaRow[] = [];

  // ── Computed ────────────────────────────────────────────────

  get isEditMode(): boolean {
    return !!this.serie;
  }

  get pageTitle(): string {
    if (this.serie) return `Grade Curricular — ${this.serie} (${this.anoLetivo})`;
    return 'Configurar Nova Grade Curricular';
  }

  get ativasCount(): number {
    return this.rows.filter(r => r.ativa).length;
  }

  get totalQAS(): number {
    return this.rows.filter(r => r.ativa).reduce((t, r) => t + (r.qas || 0), 0);
  }

  get totalCH(): number {
    return this.totalQAS * 40;
  }

  ch(row: DisciplinaRow): number {
    return (row.qas || 0) * 40;
  }

  get podeSalvar(): boolean {
    return !!this.serie && !!this.anoLetivo && this.rows.some(r => r.ativa && r.qas > 0);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private matrizService: MatrizCurricularService,
    private disciplinasService: DisciplinasService
  ) {
    const anoAtual = new Date().getFullYear();
    for (let y = anoAtual - 1; y <= anoAtual + 3; y++) this.anosLetivos.push(y);
  }

  ngOnInit(): void {
    // Ler query params: ?serie=X&anoLetivo=Y
    const params = this.route.snapshot.queryParamMap;
    const serieParam = params.get('serie');
    const anoParam   = params.get('anoLetivo');

    if (serieParam) this.serie    = serieParam;
    if (anoParam)   this.anoLetivo = parseInt(anoParam, 10);

    this.carregarDisciplinas();
  }

  // ── Carregamento ─────────────────────────────────────────────

  carregarDisciplinas(): void {
    this.isLoadingDisciplinas = true;
    this.disciplinasService.listar('ativa').subscribe({
      next: (disciplinas) => {
        this.buildRows(disciplinas);
        if (this.serie && this.anoLetivo) {
          this.carregarExistentes();
        } else {
          this.isLoadingDisciplinas = false;
        }
      },
      error: () => {
        this.showMessage('Erro ao carregar lista de disciplinas', 'error');
        this.isLoadingDisciplinas = false;
      }
    });
  }

  /** Cria uma linha vazia para cada disciplina ativa. */
  private buildRows(disciplinas: Disciplina[]): void {
    this.rows = disciplinas.map(d => {
      // areaConhecimento pode vir como objeto {nome, sigla} ou como string
      const area = d.areaConhecimento;
      const areaNome = typeof area === 'object' && area !== null
        ? (area as any).nome || ''
        : (area as any) || '';

      return {
        idDisciplina: d.id!,
        nome: d.nome,
        codigo: d.codigo,
        areaConhecimento: areaNome,
        ativa: false,
        qas: 2,
        observacoes: ''
      };
    });
  }

  /** Pré-preenche as linhas com dados existentes do banco para a série selecionada. */
  carregarExistentes(): void {
    this.matrizService.listar({ anoLetivo: this.anoLetivo, serie: this.serie }).subscribe({
      next: (existentes) => {
        const map = new Map<number, MatrizCurricular>();
        existentes.forEach(e => {
          if (e.status === 'ativa') map.set(e.idDisciplina, e);
        });

        this.rows.forEach(row => {
          const entry = map.get(row.idDisciplina);
          if (entry) {
            row.ativa = true;
            row.qas   = entry.cargaHorariaSemanal;
            row.observacoes = entry.observacoes || '';
          }
        });

        this.isLoadingDisciplinas = false;
      },
      error: () => {
        this.isLoadingDisciplinas = false;
      }
    });
  }

  // ── Reação a mudança de série/ano ────────────────────────────

  onSerieOuAnoChange(): void {
    if (!this.serie || !this.anoLetivo) return;
    // Reset all rows to inactive
    this.rows.forEach(r => { r.ativa = false; r.qas = 2; r.observacoes = ''; });
    // Reload existing for new selection
    this.isLoadingDisciplinas = true;
    this.carregarExistentes();
  }

  // ── Toggle individual ────────────────────────────────────────

  toggleRow(row: DisciplinaRow): void {
    row.ativa = !row.ativa;
    if (row.ativa && row.qas < 1) row.qas = 2;
  }

  toggleAll(ativo: boolean): void {
    this.rows.forEach(r => {
      r.ativa = ativo;
      if (ativo && r.qas < 1) r.qas = 2;
    });
  }

  get allActive(): boolean {
    return this.rows.length > 0 && this.rows.every(r => r.ativa);
  }

  // ── Salvar ───────────────────────────────────────────────────

  submit(): void {
    if (!this.serie) {
      this.showMessage('Selecione uma série.', 'error');
      return;
    }
    if (!this.anoLetivo) {
      this.showMessage('Selecione o ano letivo.', 'error');
      return;
    }
    const ativas = this.rows.filter(r => r.ativa);
    if (ativas.length === 0) {
      this.showMessage('Inclua pelo menos uma disciplina na grade.', 'error');
      return;
    }
    const invalidas = ativas.filter(r => !r.qas || r.qas < 1);
    if (invalidas.length > 0) {
      this.showMessage(`QAS inválido em: ${invalidas.map(r => r.nome).join(', ')}`, 'error');
      return;
    }
    if (this.isEditMode) {
      this.confirmVisible = true;
    } else {
      this.salvar();
    }
  }

  confirmarEdicao(): void {
    this.confirmVisible = false;
    this.salvar();
  }

  cancelarConfirmacao(): void {
    this.confirmVisible = false;
  }

  private salvar(): void {
    this.isSaving = true;

    const payload: SalvarSerieRequest = {
      serie: this.serie,
      anoLetivo: this.anoLetivo,
      disciplinas: this.rows
        .filter(r => r.ativa)
        .map(r => ({
          idDisciplina: r.idDisciplina,
          cargaHorariaSemanal: r.qas,
          observacoes: r.observacoes || undefined
        } as ItemSerie)),
      motivoAlteracao: this.motivoAlteracao || undefined
    };

    this.matrizService.salvarSerie(payload).subscribe({
      next: () => {
        this.showMessage(`Grade da ${this.serie} salva com sucesso!`, 'success');
        this.isSaving = false;
        setTimeout(() => this.router.navigate(['/matriz-curricular']), 1500);
      },
      error: (err) => {
        const msg = err?.error?.error || err?.error?.message || 'Erro ao salvar grade';
        this.showMessage(msg, 'error');
        this.isSaving = false;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/matriz-curricular']);
  }

  // ── Utils ────────────────────────────────────────────────────

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => (this.message = ''), 5000);
  }
}
