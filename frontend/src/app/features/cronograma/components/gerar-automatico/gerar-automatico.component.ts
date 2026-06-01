import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CronogramaService, HorarioCronograma, CriarAulaRequest } from '../../services/cronograma.service';

interface Turma {
  idTurma: number;
  codTurma: string;
  nomeTurma: string;
  serie_nome: string;
  periodo_nome: string;
  hora_inicio: string;
  hora_fim: string;
  ano_letivo: number;
  status: string;
  idSala?: number;
  nomeSala?: string;
}

interface Disciplina {
  id: number;
  codigo: string;
  nome: string;
  cargaHoraria?: number;
}

interface Educador {
  id: string;
  matricula: string;
  nome: string;
  especialidade?: string;
}

interface SlotHorario {
  label: string;
  start: string;
  end: string;
}

interface MatrizItem {
  idDisciplina: number;
  nomeDisciplina: string;
  cargaSemanal: number;
  aulasCadastradas: number;
  faltam: number;
  completo: boolean;
}

const DIAS: { key: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta'; label: string }[] = [
  { key: 'segunda', label: 'Segunda' },
  { key: 'terca',   label: 'Terça'   },
  { key: 'quarta',  label: 'Quarta'  },
  { key: 'quinta',  label: 'Quinta'  },
  { key: 'sexta',   label: 'Sexta'   },
];

const SLOTS_MANHA: SlotHorario[] = [
  { label: '07:00', start: '07:00:00', end: '08:00:00' },
  { label: '08:00', start: '08:00:00', end: '09:00:00' },
  { label: '09:00', start: '09:00:00', end: '10:00:00' },
  { label: '10:00', start: '10:00:00', end: '11:00:00' },
  { label: '11:00', start: '11:00:00', end: '12:00:00' },
];
const SLOTS_TARDE: SlotHorario[] = [
  { label: '13:00', start: '13:00:00', end: '14:00:00' },
  { label: '14:00', start: '14:00:00', end: '15:00:00' },
  { label: '15:00', start: '15:00:00', end: '16:00:00' },
  { label: '16:00', start: '16:00:00', end: '17:00:00' },
  { label: '17:00', start: '17:00:00', end: '18:00:00' },
];
const SLOTS_NOITE: SlotHorario[] = [
  { label: '19:00', start: '19:00:00', end: '20:00:00' },
  { label: '20:00', start: '20:00:00', end: '21:00:00' },
  { label: '21:00', start: '21:00:00', end: '22:00:00' },
  { label: '22:00', start: '22:00:00', end: '23:00:00' },
];

@Component({
  selector: 'app-gerar-automatico',
  templateUrl: './gerar-automatico.component.html',
  styleUrls: ['./gerar-automatico.component.scss']
})
export class GerarAutomaticoComponent implements OnInit {

  // ── Estado geral ────────────────────────────────────────────
  isLoading    = false;
  isSaving     = false;
  message      = '';
  messageType: 'success' | 'error' = 'success';

  // ── Filtros de seleção ──────────────────────────────────────
  anoLetivoSel  = '';
  serieSel      = '';
  turnoSel      = '';
  turmaSel: Turma | null = null;

  // ── Dados carregados ────────────────────────────────────────
  anosLetivos: number[]     = [];
  seriesDisponiveis: string[] = [];
  turnosDisponiveis: string[] = [];
  turmasDisponiveis: Turma[]  = [];
  todasTurmas: Turma[]        = [];
  disciplinas: Disciplina[]   = [];
  educadores: Educador[]      = [];
  educadoresModal: Educador[] = [];
  carregandoEducadores        = false;
  horarios: HorarioCronograma[] = [];

  // ── Cobertura curricular ────────────────────────────────────
  matrizCurricular: MatrizItem[] = [];
  carregandoMatriz = false;

  // ── Grade semanal ───────────────────────────────────────────
  readonly DIAS = DIAS;
  slots: SlotHorario[] = [];

  // ── Modal adicionar aula ────────────────────────────────────
  modalAberto      = false;
  modalDia: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' = 'segunda';
  modalSlot: SlotHorario | null = null;
  modalDisciplinaId = '';
  modalEducadorId   = '';
  modalErro         = '';
  salvandoAula      = false;

  constructor(
    private http: HttpClient,
    private cronogramaService: CronogramaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarDadosIniciais();
  }

  // ── Carregamento de dados ──────────────────────────────────

  carregarDadosIniciais(): void {
    this.isLoading = true;
    forkJoin({
      turmas:     this.http.get<any>(`${environment.apiUrl}/turmas`),
      disciplinas: this.http.get<any>(`${environment.apiUrl}/cronograma/disciplinas`),
      educadores:  this.http.get<any>(`${environment.apiUrl}/cronograma/educadores`),
    }).subscribe({
      next: ({ turmas, disciplinas, educadores }) => {
        const lista: any[] = turmas?.turmas || turmas?.data || turmas || [];
        this.todasTurmas = lista
          .filter((t: any) => t.status === 'ativa')
          .map((t: any) => ({
            idTurma:     t.idTurma,
            codTurma:    t.codTurma,
            nomeTurma:   t.nomeTurma,
            serie_nome:  t.serie_nome || '',
            periodo_nome: t.periodo_nome || t.turno || '',
            hora_inicio: t.hora_inicio || '07:00:00',
            hora_fim:    t.hora_fim    || '12:00:00',
            ano_letivo:  t.ano_letivo  || 0,
            status:      t.status,
            idSala:      t.idSala,
            nomeSala:    t.nomeSala,
          }));

        const anos = [...new Set(this.todasTurmas.map(t => t.ano_letivo).filter(Boolean))].sort((a, b) => b - a);
        this.anosLetivos = anos;

        const discList: any[] = disciplinas?.data || disciplinas || [];
        this.disciplinas = discList.map((d: any) => ({
          id:   d.id,
          codigo: d.codigo,
          nome:   d.nome,
          cargaHoraria: d.cargaHoraria,
        }));

        const eduList: any[] = educadores?.data || educadores || [];
        this.educadores = eduList.map((e: any) => ({
          id:          e.id || e.matricula,
          matricula:   e.matricula,
          nome:        e.nome,
          especialidade: e.especialidade,
        }));

        this.isLoading = false;
      },
      error: () => {
        this.showMessage('Erro ao carregar dados iniciais.', 'error');
        this.isLoading = false;
      }
    });
  }

  // ── Cascata de filtros ────────────────────────────────────

  onAnoLetivoChange(): void {
    this.serieSel  = '';
    this.turnoSel  = '';
    this.turmaSel  = null;
    this.horarios  = [];
    this.matrizCurricular = [];
    const turmasAno = this.todasTurmas.filter(t => String(t.ano_letivo) === String(this.anoLetivoSel));
    this.seriesDisponiveis = [...new Set(turmasAno.map(t => t.serie_nome).filter(Boolean))].sort();
    this.turnosDisponiveis = [];
    this.turmasDisponiveis = [];
  }

  onSerieChange(): void {
    this.turnoSel  = '';
    this.turmaSel  = null;
    this.horarios  = [];
    this.matrizCurricular = [];
    const turmasFiltradas = this.todasTurmas.filter(
      t => String(t.ano_letivo) === String(this.anoLetivoSel) && t.serie_nome === this.serieSel
    );
    this.turnosDisponiveis = [...new Set(turmasFiltradas.map(t => t.periodo_nome).filter(Boolean))].sort();
    this.turmasDisponiveis = [];
  }

  onTurnoChange(): void {
    this.turmaSel = null;
    this.horarios = [];
    this.matrizCurricular = [];
    this.turmasDisponiveis = this.todasTurmas.filter(
      t => String(t.ano_letivo) === String(this.anoLetivoSel) &&
           t.serie_nome === this.serieSel &&
           t.periodo_nome === this.turnoSel
    );
    this.gerarSlots();
  }

  onTurmaChange(): void {
    if (!this.turmaSel) { this.horarios = []; this.matrizCurricular = []; return; }
    this.gerarSlots(); // recalcula com hora_inicio/hora_fim reais da turma
    this.carregarHorariosTurma();
    this.carregarMatrizCurricular();
  }

  // ── Slots de horário por turno ─────────────────────────────

  gerarSlots(): void {
    // Se há uma turma selecionada com hora_inicio/hora_fim reais, usa elas.
    // Caso contrário usa os arrays estáticos como fallback.
    const turma = this.turmaSel
      ?? this.turmasDisponiveis[0]
      ?? null;

    if (turma?.hora_inicio && turma?.hora_fim) {
      this.slots = this.gerarSlotsDeHorario(turma.hora_inicio, turma.hora_fim);
      return;
    }

    // Fallback por nome do período
    const p = this.turnoSel.toLowerCase();
    if (p.includes('manhã') || p.includes('manha') || p === 'm') {
      this.slots = [...SLOTS_MANHA];
    } else if (p.includes('tarde') || p === 't') {
      this.slots = [...SLOTS_TARDE];
    } else if (p.includes('noite') || p === 'n') {
      this.slots = [...SLOTS_NOITE];
    } else if (p.includes('integral') || p === 'i') {
      this.slots = [...SLOTS_MANHA, ...SLOTS_TARDE];
    } else {
      this.slots = [...SLOTS_MANHA];
    }
  }

  /** Gera slots de 1h entre inicio e fim (ex: "07:00:00" → "12:00:00"). */
  private gerarSlotsDeHorario(horaInicio: string, horaFim: string): SlotHorario[] {
    const toMin = (h: string): number => {
      const parts = h.split(':');
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    };
    const toHHMM = (min: number): string =>
      `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

    const inicio = toMin(horaInicio);
    const fim    = toMin(horaFim);
    const slots: SlotHorario[] = [];

    for (let cur = inicio; cur < fim; cur += 60) {
      const slotFim = Math.min(cur + 60, fim);
      slots.push({
        label: toHHMM(cur),
        start: `${toHHMM(cur)}:00`,
        end:   `${toHHMM(slotFim)}:00`,
      });
    }

    return slots.length > 0 ? slots : [...SLOTS_MANHA];
  }

  // ── Carregamento de horários da turma ──────────────────────

  carregarHorariosTurma(): void {
    if (!this.turmaSel) return;
    this.isLoading = true;
    this.cronogramaService.listarCronogramaTurma(this.turmaSel.idTurma).subscribe({
      next: (lista) => {
        this.horarios = lista || [];
        this.isLoading = false;
        this.calcularCobertura();
      },
      error: () => {
        this.horarios = [];
        this.isLoading = false;
      }
    });
  }

  // ── Matriz curricular ──────────────────────────────────────

  carregarMatrizCurricular(): void {
    if (!this.turmaSel) return;
    this.carregandoMatriz = true;
    const serie = encodeURIComponent(this.turmaSel.serie_nome);
    const ano   = encodeURIComponent(String(this.turmaSel.ano_letivo));
    this.http.get<any>(`${environment.apiUrl}/matriz-curricular?serie=${serie}&anoLetivo=${ano}`)
      .subscribe({
        next: (res) => {
          const lista: any[] = Array.isArray(res) ? res : res?.data || [];
          this.matrizCurricular = lista.map((item: any) => ({
            idDisciplina:     item.idDisciplina || item.disciplina?.id,
            nomeDisciplina:   item.disciplina?.nome || item.nomeDisciplina || '—',
            cargaSemanal:     item.cargaHorariaSemanal || 0,
            aulasCadastradas: 0,
            faltam:           item.cargaHorariaSemanal || 0,
            completo:         false,
          }));
          this.carregandoMatriz = false;
          this.calcularCobertura();
        },
        error: () => {
          this.matrizCurricular = [];
          this.carregandoMatriz = false;
        }
      });
  }

  calcularCobertura(): void {
    if (!this.matrizCurricular.length) return;
    // Conta aulas únicas por disciplina (dias distintos na semana)
    const contagem: Record<number, number> = {};
    for (const h of this.horarios) {
      const id = h.idDisciplina;
      if (id) contagem[id] = (contagem[id] || 0) + 1;
    }
    this.matrizCurricular = this.matrizCurricular.map(item => {
      const cadastradas = contagem[item.idDisciplina] || 0;
      const faltam      = Math.max(0, item.cargaSemanal - cadastradas);
      return { ...item, aulasCadastradas: cadastradas, faltam, completo: faltam === 0 };
    });
  }

  get coberturaCompleta(): boolean {
    return this.matrizCurricular.length > 0 && this.matrizCurricular.every(i => i.completo);
  }

  get disciplinasPendentes(): MatrizItem[] {
    return this.matrizCurricular.filter(i => !i.completo);
  }

  // ── Grid helpers ─────────────────────────────────────────

  getAula(dia: string, slot: SlotHorario): HorarioCronograma | null {
    return this.horarios.find(h =>
      h.diaSemana === dia &&
      this.normalizaHora(h.horaInicio) === this.normalizaHora(slot.start)
    ) || null;
  }

  private normalizaHora(h: string): string {
    if (!h) return '';
    const parts = h.split(':');
    return parts[0].padStart(2, '0') + ':' + parts[1];
  }

  getNomeDisciplina(aula: HorarioCronograma): string {
    return aula.disciplina?.nome || aula.disciplina?.nomeDisciplina ||
           this.disciplinas.find(d => d.id === aula.idDisciplina)?.nome || '—';
  }

  getNomeEducador(aula: HorarioCronograma): string {
    return aula.educador?.nome || aula.educador?.nomeCompleto ||
           this.educadores.find(e => e.id === aula.idEducador)?.nome || '—';
  }

  get totalAulas(): number { return this.horarios.length; }

  get aulasPorDia(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const d of DIAS) counts[d.key] = 0;
    for (const h of this.horarios) counts[h.diaSemana] = (counts[h.diaSemana] || 0) + 1;
    return counts;
  }

  // ── Modal de adicionar aula ─────────────────────────────

  abrirModal(dia: typeof DIAS[0], slot: SlotHorario): void {
    this.modalDia          = dia.key;
    this.modalSlot         = slot;
    this.modalDisciplinaId = '';
    this.modalEducadorId   = '';
    this.modalErro         = '';
    this.educadoresModal   = [];
    this.modalAberto       = true;
  }

  onDisciplinaChange(): void {
    this.modalEducadorId = '';
    this.educadoresModal = [];
    if (!this.modalDisciplinaId) return;

    this.carregandoEducadores = true;
    const turno = encodeURIComponent(this.turnoSel);
    this.http.get<any>(
      `${environment.apiUrl}/cronograma/educadores?disciplinaId=${this.modalDisciplinaId}&turno=${turno}`
    ).subscribe({
      next: (res) => {
        const lista: any[] = Array.isArray(res) ? res : res?.data || [];
        this.educadoresModal = lista.map((e: any) => ({
          id:           e.id || e.matricula,
          matricula:    e.matricula,
          nome:         e.nome,
          especialidade: e.especialidade,
        }));
        this.carregandoEducadores = false;
      },
      error: () => {
        this.educadoresModal   = [...this.educadores];
        this.carregandoEducadores = false;
      }
    });
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  salvarAula(): void {
    if (!this.turmaSel || !this.modalSlot) return;
    if (!this.modalDisciplinaId) { this.modalErro = 'Selecione uma disciplina.'; return; }
    if (!this.modalEducadorId)   { this.modalErro = 'Selecione um educador.'; return; }

    this.salvandoAula = true;
    this.modalErro    = '';

    const body: CriarAulaRequest = {
      idTurma:     this.turmaSel.idTurma,
      idDisciplina: Number(this.modalDisciplinaId),
      idEducador:   this.modalEducadorId,
      idSala:       this.turmaSel.idSala,
      diaSemana:    this.modalDia,
      horaInicio:   this.modalSlot.start,
      horaFim:      this.modalSlot.end,
      recorrente:   true,
    };

    this.cronogramaService.criarAula(body).subscribe({
      next: (res: any) => {
        this.salvandoAula = false;
        if (res?.success === false) {
          this.modalErro = res.message || 'Erro ao criar aula.';
          return;
        }
        this.fecharModal();
        this.carregarHorariosTurma();
        this.showMessage('Aula adicionada com sucesso!', 'success');
      },
      error: (err: any) => {
        this.salvandoAula = false;
        // O backend retorna { "error": "..." } com HTTP 400
        this.modalErro = err?.error?.error || err?.error?.message || err?.error?.detail || 'Erro ao criar aula.';
      }
    });
  }

  // ── Remover aula ──────────────────────────────────────────

  removerAula(aula: HorarioCronograma, event: Event): void {
    event.stopPropagation();
    const id = aula.id ?? aula.idCronograma;
    if (!id) return;
    if (!confirm('Remover esta aula da grade?')) return;
    this.cronogramaService.deletarAula(id).subscribe({
      next: () => {
        this.horarios = this.horarios.filter(h => (h.id ?? h.idCronograma) !== id);
        this.calcularCobertura();
        this.showMessage('Aula removida com sucesso.', 'success');
      },
      error: () => this.showMessage('Erro ao remover aula.', 'error')
    });
  }

  // ── Utilitários ───────────────────────────────────────────

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message     = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 4000);
  }

  voltar(): void { this.router.navigate(['/cronograma']); }

  trackByKey(i: number, item: any): string { return item.key || item.label || String(i); }

  getDiaLabel(dia: string): string {
    return DIAS.find(d => d.key === dia)?.label || dia;
  }
}
