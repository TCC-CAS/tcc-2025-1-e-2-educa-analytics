import { Component, OnInit } from '@angular/core';
import { SalasService } from '../../../salas/services/salas.service';
import { Sala } from '../../../salas/services/salas.service';
import { TurmasService, AnoLetivo } from '../../services/turmas.service';
import { DisciplinasService, Disciplina } from '../../services/disciplinas.service';
import { EducadoresService, Educador } from '../../services/educadores.service';
import { CronogramaService, HorarioCronograma, CriarAulaRequest } from '../../services/cronograma.service';
import { forkJoin } from 'rxjs';

export type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';

export interface AulaSlot {
  id: string;
  turmaId: string;
  disciplinaId: string;
  disciplina: string;
  educadorId: string;
  educador: string;
  salaId: string;
  sala: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  corBg: string;
  corText: string;
  corBorder: string;
}

const CORES = [
  { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  { bg: '#fef9c3', text: '#a16207', border: '#fde047' },
  { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' },
  { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
  { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
  { bg: '#cffafe', text: '#0e7490', border: '#67e8f9' },
  { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
];

// Interfaces para turmas (backend retorna diferente)
interface TurmaBackend {
  idTurma: number;
  codTurma: string;
  nomeTurma: string;
  serie_nome: string;
  periodo_codigo: string;
  periodo_nome: string;
  ano_letivo: number;
  qldVagas: number;
  status: string;
}

interface TurmaLocal {
  id: string;
  nome: string;
  serie: string;
  turno: 'Manhã' | 'Tarde' | 'Noite';
  periodo: 'matutino' | 'vespertino' | 'noturno' | 'integral';
  anoLetivo: number;
  vagas: number;
}

interface DisciplinaLocal {
  id: string;
  nome: string;
}

interface EducadorLocal {
  id: string;
  nome: string;
}

// Mock salas removido - agora usa dados do backend
interface SalaSimples {
  id: number;
  nome: string;
  codigo?: string;
  tipo?: string;
  capacidade?: number;
  status?: string;
}

@Component({
  selector: 'app-cronograma-view',
  templateUrl: './cronograma-view.component.html',
  styleUrls: ['./cronograma-view.component.scss']
})
export class CronogramaViewComponent implements OnInit {

  turmas: TurmaLocal[] = [];
  todasTurmas: TurmaLocal[] = [];
  disciplinas: DisciplinaLocal[] = [];
  educadores: EducadorLocal[] = [];
  salas: SalaSimples[] = [];
  salasCarregando = false;
  dadosCarregando = false;
  anosLetivos: AnoLetivo[] = [];
  salaConflito: { dia: DiaSemana; hora: string; salaId: number } | null = null;

  turmaSelecionadaId: string = '';
  anoLetivo: number = 0;         // idAnoLetivo do banco (ex: 2)
  anoLetivoExibicao: number = 0; // ano civil para exibição (ex: 2026)
  periodoSelecionado: string = '';
  disciplinaSelecionadaId: string = '';
  educadoresDisponiveis: EducadorLocal[] = [];

  periodos = [
    { value: '', label: 'Todos os períodos' },
    { value: 'matutino', label: 'Matutino' },
    { value: 'vespertino', label: 'Vespertino' },
    { value: 'noturno', label: 'Noturno' },
    { value: 'integral', label: 'Integral' }
  ];

  dias: { key: DiaSemana; label: string; abrev: string }[] = [
    { key: 'segunda', label: 'Segunda-feira', abrev: 'Seg' },
    { key: 'terca',   label: 'Terça-feira',   abrev: 'Ter' },
    { key: 'quarta',  label: 'Quarta-feira',   abrev: 'Qua' },
    { key: 'quinta',  label: 'Quinta-feira',   abrev: 'Qui' },
    { key: 'sexta',   label: 'Sexta-feira',    abrev: 'Sex' },
    { key: 'sabado',  label: 'Sábado',         abrev: 'Sáb' },
  ];

  horas: string[] = [];
  slots: AulaSlot[] = [];

  // Modal
  modalVisible = false;
  modalDia: DiaSemana | null = null;
  modalHora: string = '';
  editingSlot: AulaSlot | null = null;
  confirmDeleteVisible = false;

  novoSlot = {
    disciplinaId: '',
    educadorId: '',
    salaId: '',
    horaInicio: '',
    horaFim: '',
  };

  // Confirm clear
  confirmLimpar = false;

  // Message
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private salasService: SalasService,
    private turmasService: TurmasService,
    private disciplinasService: DisciplinasService,
    private educadoresService: EducadoresService,
    private cronogramaService: CronogramaService
  ) {}

  private corMap: Record<string, { bg: string; text: string; border: string }> = {};
  private corIndex = 0;

  get slotsDaTurma(): AulaSlot[] {
    if (!this.turmaSelecionadaId) return [];
    return this.slots.filter(s => s.turmaId === this.turmaSelecionadaId);
  }

  get turmaSelecionada() {
    return this.turmas.find(t => t.id === this.turmaSelecionadaId);
  }

  get legenda(): { disciplina: string; cor: { bg: string; text: string; border: string } }[] {
    const seen = new Set<string>();
    return this.slotsDaTurma
      .filter(s => { if (seen.has(s.disciplinaId)) return false; seen.add(s.disciplinaId); return true; })
      .map(s => ({ disciplina: s.disciplina, cor: this.getCorDisciplina(s.disciplinaId) }));
  }

  get totalAulas(): number { return this.slotsDaTurma.length; }

  get horasFiltradas(): string[] {
    const turno = this.turmaSelecionada?.turno;
    if (turno === 'Tarde') {
      return this.horas.filter(h => parseInt(h) >= 12 && parseInt(h) <= 18);
    }
    if (turno === 'Noite') {
      return this.horas.filter(h => parseInt(h) >= 18);
    }
    return this.horas.filter(h => parseInt(h) >= 7 && parseInt(h) <= 12);
  }

  getSalasEmUso(): number {
    const salasUnicas = new Set(
      this.slotsDaTurma
        .filter(s => s.salaId)
        .map(s => s.salaId)
    );
    return salasUnicas.size;
  }

  ngOnInit(): void {
    for (let h = 7; h <= 22; h++) {
      this.horas.push(`${h.toString().padStart(2, '0')}:00`);
    }

    // Carregar todos os dados do backend
    this.carregarDadosIniciais();
  }

  carregarDadosIniciais(): void {
    this.dadosCarregando = true;
    
    forkJoin({
      anosLetivos: this.turmasService.listarAnosLetivos(),
      disciplinas: this.disciplinasService.listarDisciplinas('ativa'),
      educadores: this.educadoresService.listarEducadores('ativo'),
      salas: this.salasService.listarSalas()
    }).subscribe({
      next: (dados) => {
        // Anos letivos
        this.anosLetivos = dados.anosLetivos || [];
        if (this.anosLetivos.length === 0) {
          // Fallback: criar entrada fake com o ano atual
          const anoAtual = new Date().getFullYear();
          this.anosLetivos = [{ id: anoAtual, ano: anoAtual }];
        }
        // Não selecionar automaticamente - deixar o usuário escolher
        this.anoLetivo = 0;
        this.anoLetivoExibicao = 0;

        // Disciplinas
        this.disciplinas = (dados.disciplinas || []).map((d: Disciplina) => ({
          id: d.id.toString(),
          nome: d.nome
        }));

        // Educadores
        this.educadores = (dados.educadores || []).map((e: Educador) => ({
          id: e.id.toString(),
          nome: e.nome
        }));
        this.educadoresDisponiveis = [...this.educadores];

        // Salas
        const salasAtivas = dados.salas?.data?.filter((sala: Sala) => sala.status === 'ativa') || [];
        this.salas = salasAtivas.map((sala: Sala) => ({
          id: sala.id,
          nome: sala.nome,
          codigo: sala.codigo,
          tipo: sala.tipo,
          capacidade: sala.capacidade,
          status: sala.status
        }));
        
        console.log('[Cronograma] Dados iniciais carregados:', {
          anosLetivos: this.anosLetivos.length,
          disciplinas: this.disciplinas.length,
          educadores: this.educadores.length,
          salas: this.salas.length
        });

        // NÃO carregar turmas automaticamente - aguardar seleção do ano
        this.dadosCarregando = false;
      },
      error: (err) => {
        console.error('[Cronograma] Erro ao carregar dados:', err);
        this.showMsg('Erro ao carregar dados. Verifique a conexão.', 'error');
        this.dadosCarregando = false;
      }
    });
  }

  carregarTurmas(): void {
    if (!this.anoLetivo || this.anoLetivo === 0) {
      console.error('[Cronograma] Ano letivo não definido');
      this.turmas = [];
      this.todasTurmas = [];
      return;
    }

    console.log('[Cronograma] Carregando turmas para o ano:', this.anoLetivo);
    
    // O backend espera ano_letivo_id, não anoLetivo
    this.cronogramaService.listarTurmasPorAno(this.anoLetivo).subscribe({
      next: (turmasBackend: TurmaBackend[]) => {
        console.log('[Cronograma] Resposta do backend:', turmasBackend);
        console.log('[Cronograma] Turmas recebidas do backend:', turmasBackend?.length || 0);
        
        if (!turmasBackend || turmasBackend.length === 0) {
          this.todasTurmas = [];
          this.turmas = [];
          console.log('[Cronograma] Nenhuma turma encontrada para o ano:', this.anoLetivo);
          this.showMsg(`Nenhuma turma encontrada para o ano ${this.anoLetivo}`, 'error');
          return;
        }
        
        console.log('[Cronograma] Primeira turma (raw):', turmasBackend[0]);
        
        this.todasTurmas = turmasBackend.map(t => ({
          id: t.idTurma.toString(),
          nome: t.nomeTurma,
          serie: t.serie_nome,
          turno: this.periodoParaTurno(t.periodo_codigo),
          periodo: this.codigoPeriodoParaPeriodo(t.periodo_codigo),
          anoLetivo: t.ano_letivo,
          vagas: t.qldVagas
        }));

        this.filtrarTurmasPorPeriodo();
        
        console.log('[Cronograma] Turmas processadas:', this.todasTurmas.length, 'Filtradas:', this.turmas.length);
      },
      error: (err) => {
        console.error('[Cronograma] Erro ao carregar turmas:', err);
        this.showMsg('Erro ao carregar turmas.', 'error');
        this.turmas = [];
        this.todasTurmas = [];
      }
    });
  }

  filtrarTurmasPorPeriodo(): void {
    console.log('[Cronograma] Filtrando turmas. Período selecionado:', this.periodoSelecionado || 'Todos');
    console.log('[Cronograma] Total de turmas antes do filtro:', this.todasTurmas.length);
    
    if (!this.periodoSelecionado) {
      this.turmas = [...this.todasTurmas];
    } else {
      this.turmas = this.todasTurmas.filter(t => {
        console.log('[Cronograma] Comparando turma:', t.nome, 'periodo:', t.periodo, 'com filtro:', this.periodoSelecionado);
        return t.periodo === this.periodoSelecionado;
      });
    }

    console.log('[Cronograma] Turmas após filtro:', this.turmas.length);

    // Selecionar a primeira turma se houver turmas disponíveis
    if (this.turmas.length > 0) {
      // Se a turma atualmente selecionada não está na lista filtrada, selecionar a primeira
      const turmaSelecionadaExiste = this.turmas.find(t => t.id === this.turmaSelecionadaId);
      if (!turmaSelecionadaExiste) {
        this.turmaSelecionadaId = this.turmas[0].id;
        console.log('[Cronograma] Turma selecionada:', this.turmas[0].nome);
        this.carregarCronogramaTurma();
      }
    } else {
      this.turmaSelecionadaId = '';
      this.slots = [];
      console.log('[Cronograma] Nenhuma turma disponível após filtro');
    }
  }

  onPeriodoChange(): void {
    console.log('[Cronograma] onPeriodoChange chamado. Período:', this.periodoSelecionado);
    console.log('[Cronograma] Ano letivo atual:', this.anoLetivo);
    
    // Só filtrar se já tiver um ano selecionado
    if (this.anoLetivo && this.anoLetivo !== 0) {
      this.filtrarTurmasPorPeriodo();
    }
  }

  periodoParaTurno(periodo: string): 'Manhã' | 'Tarde' | 'Noite' {
    const mapa: Record<string, 'Manhã' | 'Tarde' | 'Noite'> = {
      'matutino': 'Manhã',
      'MAT': 'Manhã',
      'vespertino': 'Tarde',
      'VES': 'Tarde',
      'noturno': 'Noite',
      'NOT': 'Noite',
      'integral': 'Manhã',
      'INT': 'Manhã'
    };
    return mapa[periodo] || 'Manhã';
  }

  codigoPeriodoParaPeriodo(codigo: string): 'matutino' | 'vespertino' | 'noturno' | 'integral' {
    const mapa: Record<string, 'matutino' | 'vespertino' | 'noturno' | 'integral'> = {
      'MAT': 'matutino',
      'VES': 'vespertino',
      'NOT': 'noturno',
      'INT': 'integral',
      'matutino': 'matutino',
      'vespertino': 'vespertino',
      'noturno': 'noturno',
      'integral': 'integral'
    };
    return mapa[codigo] || 'matutino';
  }

  onTurmaSelecionada(): void {
    this.carregarCronogramaTurma();
  }

  onAnoLetivoChange(): void {
    // anoLetivo agora contém o idAnoLetivo (ex: 2), não o ano civil
    const idSelecionado = Number(this.anoLetivo);

    if (!idSelecionado || idSelecionado === 0) {
      this.turmaSelecionadaId = '';
      this.periodoSelecionado = '';
      this.slots = [];
      this.turmas = [];
      this.todasTurmas = [];
      this.anoLetivo = 0;
      this.anoLetivoExibicao = 0;
      return;
    }

    // Atualiza o id e o ano civil correspondente
    this.anoLetivo = idSelecionado;
    const anoObj = this.anosLetivos.find(a => a.id === idSelecionado);
    this.anoLetivoExibicao = anoObj?.ano || idSelecionado;

    // Resetar seleções
    this.turmaSelecionadaId = '';
    this.periodoSelecionado = '';
    this.slots = [];

    this.carregarTurmas();
  }

  carregarCronogramaTurma(): void {
    if (!this.turmaSelecionadaId) return;

    const turmaId = parseInt(this.turmaSelecionadaId);
    this.cronogramaService.listarCronogramaTurma(turmaId).subscribe({
      next: (horarios: HorarioCronograma[]) => {
        // Converter horários do backend para AulaSlot
        this.slots = horarios.map(h => {
          const cor = this.getCorDisciplina(h.idDisciplina.toString());
          return {
            id: h.id?.toString() || Date.now().toString(),
            turmaId: h.idTurma.toString(),
            disciplinaId: h.idDisciplina.toString(),
            disciplina: h.disciplina?.nome || '',
            educadorId: h.idEducador.toString(),
            educador: h.educador?.nome || '',
            salaId: h.idSala?.toString() || '',
            sala: h.sala?.nome || '',
            diaSemana: h.diaSemana,
            horaInicio: h.horaInicio,
            horaFim: h.horaFim,
            corBg: cor.bg,
            corText: cor.text,
            corBorder: cor.border
          };
        });
        
        console.log('[Cronograma] Horários carregados:', this.slots.length);
      },
      error: (err) => {
        console.error('[Cronograma] Erro ao carregar cronograma:', err);
        this.showMsg('Erro ao carregar cronograma da turma.', 'error');
      }
    });
  }

  onDisciplinaSelecionada(): void {
    if (!this.novoSlot.disciplinaId) {
      this.educadoresDisponiveis = [...this.educadores];
      return;
    }

    const disciplinaId = parseInt(this.novoSlot.disciplinaId);
    this.educadoresService.listarEducadoresPorDisciplina(disciplinaId, 'ativo').subscribe({
      next: (educadores: Educador[]) => {
        this.educadoresDisponiveis = educadores.map(e => ({
          id: e.id.toString(),
          nome: e.nome
        }));
        console.log('[Cronograma] Educadores disponíveis para disciplina:', this.educadoresDisponiveis.length);
      },
      error: (err) => {
        console.error('[Cronograma] Erro ao buscar educadores:', err);
        this.educadoresDisponiveis = [...this.educadores];
      }
    });
  }

  carregarSalas(): void {
    // Função mantida para compatibilidade (salas já carregadas em carregarDadosIniciais)
  }

  getCorDisciplina(disciplinaId: string): { bg: string; text: string; border: string } {
    if (!this.corMap[disciplinaId]) {
      this.corMap[disciplinaId] = CORES[this.corIndex % CORES.length];
      this.corIndex++;
    }
    return this.corMap[disciplinaId];
  }

  getSlot(dia: DiaSemana, hora: string): AulaSlot | undefined {
    return this.slotsDaTurma.find(s => s.diaSemana === dia && s.horaInicio === hora);
  }

  abrirModalNovo(dia: DiaSemana, hora: string): void {
    if (this.getSlot(dia, hora)) return;
    if (!this.turmaSelecionadaId) { this.showMsg('Selecione uma turma primeiro.', 'error'); return; }

    const h = parseInt(hora);
    const fimH = Math.min(h + 1, 23);

    this.modalDia = dia;
    this.modalHora = hora;
    this.editingSlot = null;
    this.confirmDeleteVisible = false;
    this.novoSlot = {
      disciplinaId: '',
      educadorId: '',
      salaId: '',
      horaInicio: hora,
      horaFim: `${fimH.toString().padStart(2, '0')}:00`,
    };
    this.modalVisible = true;
  }

  editarSlot(event: Event, slot: AulaSlot): void {
    event.stopPropagation();
    this.editingSlot = { ...slot };
    this.modalDia = slot.diaSemana;
    this.modalHora = slot.horaInicio;
    this.confirmDeleteVisible = false;
    this.novoSlot = {
      disciplinaId: slot.disciplinaId,
      educadorId: slot.educadorId,
      salaId: slot.salaId,
      horaInicio: slot.horaInicio,
      horaFim: slot.horaFim,
    };
    this.modalVisible = true;
  }

  fecharModal(): void {
    this.modalVisible = false;
    this.editingSlot = null;
    this.confirmDeleteVisible = false;
  }

  verificarConflitoSala(dia: DiaSemana, horaInicio: string, horaFim: string, salaId: string, slotAtualId?: string): boolean {
    if (!salaId) return false;
    
    const salaIdNum = typeof salaId === 'string' ? parseInt(salaId) : salaId;
    
    return this.slots.some(slot => {
      // Ignorar o próprio slot se estiver editando
      if (slotAtualId && slot.id === slotAtualId) return false;
      
      // Verificar se é a mesma sala e mesmo dia
      const slotSalaId = typeof slot.salaId === 'string' ? parseInt(slot.salaId) : slot.salaId;
      if (slotSalaId !== salaIdNum || slot.diaSemana !== dia) return false;
      
      // Verificar sobreposição de horários
      const slotInicio = this.horaParaMinutos(slot.horaInicio);
      const slotFim = this.horaParaMinutos(slot.horaFim);
      const novoInicio = this.horaParaMinutos(horaInicio);
      const novoFim = this.horaParaMinutos(horaFim);
      
      return (novoInicio < slotFim && novoFim > slotInicio);
    });
  }

  private horaParaMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  salvarSlot(): void {
    if (!this.novoSlot.disciplinaId || !this.novoSlot.educadorId) {
      this.showMsg('Preencha disciplina e educador!', 'error');
      return;
    }

    // Verificar conflito de sala
    if (this.novoSlot.salaId) {
      const temConflito = this.verificarConflitoSala(
        this.modalDia!,
        this.novoSlot.horaInicio,
        this.novoSlot.horaFim,
        this.novoSlot.salaId,
        this.editingSlot?.id
      );

      if (temConflito) {
        const sala = this.salas.find(s => s.id.toString() === this.novoSlot.salaId.toString());
        this.showMsg(`A sala "${sala?.nome || 'selecionada'}" já está ocupada neste horário!`, 'error');
        return;
      }
    }

    const aulaRequest: CriarAulaRequest = {
      idTurma: parseInt(this.turmaSelecionadaId),
      idDisciplina: parseInt(this.novoSlot.disciplinaId),
      idEducador: this.novoSlot.educadorId,
      idSala: this.novoSlot.salaId ? parseInt(this.novoSlot.salaId) : undefined,
      diaSemana: this.modalDia!,
      horaInicio: this.novoSlot.horaInicio,
      horaFim: this.novoSlot.horaFim,
      observacoes: ''
    };

    if (this.editingSlot && this.editingSlot.id) {
      // Atualizar aula existente
      this.cronogramaService.atualizarAula(parseInt(this.editingSlot.id), aulaRequest).subscribe({
        next: () => {
          this.showMsg('Aula atualizada com sucesso!', 'success');
          this.carregarCronogramaTurma();
          this.fecharModal();
        },
        error: (err) => {
          console.error('[Cronograma] Erro ao atualizar aula:', err);
          this.showMsg('Erro ao atualizar aula. Verifique conflitos.', 'error');
        }
      });
    } else {
      // Criar nova aula
      this.cronogramaService.criarAula(aulaRequest).subscribe({
        next: () => {
          this.showMsg('Aula adicionada com sucesso!', 'success');
          this.carregarCronogramaTurma();
          this.fecharModal();
        },
        error: (err) => {
          console.error('[Cronograma] Erro ao criar aula:', err);
          this.showMsg('Erro ao adicionar aula. Verifique conflitos.', 'error');
        }
      });
    }
  }

  excluirSlot(): void {
    if (!this.editingSlot || !this.editingSlot.id) return;
    
    this.cronogramaService.deletarAula(parseInt(this.editingSlot.id)).subscribe({
      next: () => {
        this.showMsg('Aula removida com sucesso!', 'success');
        this.carregarCronogramaTurma();
        this.fecharModal();
      },
      error: (err) => {
        console.error('[Cronograma] Erro ao excluir aula:', err);
        this.showMsg('Erro ao remover aula.', 'error');
      }
    });
  }

  limparCronograma(): void {
    if (!this.turmaSelecionadaId) return;

    const slotsParaExcluir = this.slotsDaTurma.filter(s => s.id);
    
    if (slotsParaExcluir.length === 0) {
      this.showMsg('Não há aulas para limpar.', 'error');
      this.confirmLimpar = false;
      return;
    }

    // Excluir todas as aulas da turma
    const exclusoes = slotsParaExcluir.map(slot => 
      this.cronogramaService.deletarAula(parseInt(slot.id!))
    );

    forkJoin(exclusoes).subscribe({
      next: () => {
        this.showMsg(`${slotsParaExcluir.length} aula(s) removida(s).`, 'success');
        this.carregarCronogramaTurma();
        this.confirmLimpar = false;
      },
      error: (err) => {
        console.error('[Cronograma] Erro ao limpar cronograma:', err);
        this.showMsg('Erro ao limpar cronograma.', 'error');
        this.confirmLimpar = false;
      }
    });
  }

  private persist(): void {
    // localStorage removido - dados salvos no backend
  }

  private showMsg(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3000);
  }

  getDiaLabel(dia: DiaSemana): string {
    return this.dias.find(d => d.key === dia)?.label ?? dia;
  }

  getTipoSalaLabel(tipo?: string): string {
    if (!tipo) return '';
    const tipoMap: Record<string, string> = {
      'sala-de-aula': 'Sala de Aula',
      'laboratorio': 'Laboratório',
      'auditorio': 'Auditório',
      'biblioteca': 'Biblioteca',
      'quadra': 'Quadra',
      'sala-de-reuniao': 'Sala de Reunião',
      'outro': 'Outro'
    };
    return tipoMap[tipo] || tipo;
  }

  trackByHora(_: number, h: string) { return h; }
  trackByDia(_: number, d: any)     { return d.key; }
}
