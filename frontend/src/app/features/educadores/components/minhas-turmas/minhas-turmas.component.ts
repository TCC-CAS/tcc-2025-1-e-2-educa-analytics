import { Component, AfterViewInit, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

type FrequenciaStatus = 'presente' | 'ausente' | 'justificado';

interface FrequenciaAluno {
  alunoId: string;
  nome: string;
  status: FrequenciaStatus;
}

interface TurmaDisciplina {
  idDisciplina: number;
  disciplina: string;
  codDisciplina?: string;
  area?: string;
  diasSemana?: string[];  // dias da semana em que o educador leciona
}

interface MinhasTurmasItem {
  id: number;
  codigo: string;
  nome: string;
  serie: string;
  turno: string;
  anoLetivo: string;
  sala: string;
  vagas: number;
  vagasOcupadas: number;
  status: 'ativa' | 'inativa' | 'concluida';
  horaInicio: string;
  horaFim: string;
  disciplinas: TurmaDisciplina[];
}

interface Educando {
  id: string;
  nome: string;
  serie: string;
  status: string;
}

type TipoAtividade = 'Prova' | 'Trabalho' | 'Apresentação';

interface DistFaixa { faixa: string; lo: number; hi: number; count: number; }
interface AtividadeDash {
  idAtividade: number; nome: string; tipo: string; dataAtividade: string;
  notaMaxima: number; notaMinima: number; totalAlunos: number; avaliados: number;
  media: number | null; mediana: number | null; moda: number[];
  aprovados: number; reprovados: number; taxaAprovacao: number;
  distribuicao: DistFaixa[];
}
interface AlunoDash {
  idMatricula: string; nome: string; mediaGeral: number | null;
  notas: (number | null)[]; aprovado: boolean;
}
interface GeralDash {
  totalAlunos: number; avaliados: number;
  media: number | null; mediana: number | null; moda: number[];
  aprovados: number; reprovados: number; taxaAprovacao: number | null;
}
interface DashboardData {
  atividades: AtividadeDash[];
  geral: GeralDash | null;
  alunos: AlunoDash[];
}

interface Atividade {
  id: number;
  turmaId: number;
  idDisciplina: number;
  nome: string;
  tipo: TipoAtividade;
  _notaCache?: Record<string, number | null>;
  data: string;
  notaMaxima: number;
}

interface LancamentoNota {
  alunoId: string;
  nome: string;
  nota: number | null;
}

interface ItemRelatorioFreq {
  alunoId: string;
  nome: string;
  total: number;
  presentes: number;
  ausentes: number;
  justificados: number;
  pct: number;
}

// Metadata de aula salva em localStorage
interface AulaMetadata {
  observacoesAula: string;
  aulaNaoDada: boolean;
  motivoNaoDada: string;
}

@Component({
  selector: 'app-minhas-turmas',
  templateUrl: './minhas-turmas.component.html',
  styleUrls: ['./minhas-turmas.component.scss'],
  host: { style: 'display:block;width:100%;' }
})
export class MinhasTurmasComponent implements OnInit, AfterViewInit {

  // ── Estado geral ────────────────────────────────────────────────────────────
  carregando = false;
  erro = '';
  matriculaEducador = '';

  // ── Turmas ──────────────────────────────────────────────────────────────────
  turmas: MinhasTurmasItem[] = [];
  opcoesAnoLetivo: string[] = [];
  opcoesPeriodo: string[] = [];
  opcoesTurmas: string[] = [];
  filtroAno    = '';
  filtroTurno  = '';
  filtroTurma  = '';

  get turmasFiltradas(): MinhasTurmasItem[] {
    return this.turmas.filter(t =>
      (!this.filtroAno   || t.anoLetivo === this.filtroAno) &&
      (!this.filtroTurno || t.turno     === this.filtroTurno) &&
      (!this.filtroTurma || t.nome      === this.filtroTurma)
    );
  }

  // ── Mapa de dias da semana por turma+disciplina ──────────────────────────────
  // Chave: "turmaId_disciplinaId" → lista ordenada de dias
  private diasMap: Map<string, string[]> = new Map();

  // ── Painel lateral ──────────────────────────────────────────────────────────
  turmaModal: MinhasTurmasItem | null = null;
  abaAtiva: 'educandos' | 'frequencia' | 'relatorio' | 'notas' | 'dashboard' | null = null;
  disciplinaSelecionada: TurmaDisciplina | null = null;

  // ── Educandos ───────────────────────────────────────────────────────────────
  educandos: Educando[] = [];
  carregandoEducandos = false;

  // ── Frequência ──────────────────────────────────────────────────────────────
  frequenciaData: string = new Date().toISOString().split('T')[0];
  frequenciaRegistros: FrequenciaAluno[] = [];
  frequenciaMensagem = '';
  frequenciaErro = '';
  carregandoFrequencia = false;
  salvandoFrequencia = false;

  // Metadata por aula (localStorage)
  observacoesAula = '';
  aulaNaoDada = false;
  motivoNaoDada = '';

  // ── Relatório ───────────────────────────────────────────────────────────────
  relEditData: string | null = null;
  relEditRegistros: FrequenciaAluno[] = [];
  relEditMensagem = '';
  datasComFrequencia: string[] = [];
  carregandoDatas = false;
  carregandoRelatorio = false;
  // dados vindos da API para o relatório
  relatorioData: ItemRelatorioFreq[] = [];
  relDatasDetalhes: { data: string; presentes: number; ausentes: number; justificados: number }[] = [];
  // detalhe por aluno
  alunoDetalhado: { item: ItemRelatorioFreq; registros: { data: string; presenca: string }[] } | null = null;
  carregandoDetalheAluno = false;
  // cache de registros por data para relatório
  private cacheFrequencia: Record<string, FrequenciaAluno[]> = {};

  // ── Notas ───────────────────────────────────────────────────────────────────
  atividadesTurma: Atividade[] = [];
  atividadeSelecionada: Atividade | null = null;
  notasLancamento: LancamentoNota[] = [];
  notasMensagem = '';
  notasErro = '';
  salvandoNotas = false;
  carregandoNotas = false;
  modoNovaAtividade = false;
  salvandoAtividade = false;
  novaAtividade: { nome: string; tipo: TipoAtividade; data: string; notaMaxima: number } =
    { nome: '', tipo: 'Prova', data: '', notaMaxima: 10 };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ── Ciclo de vida ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idRota = params.get('id');
      if (idRota) {
        this.matriculaEducador = idRota;
      } else {
        // Sem ID na rota → usa o educador logado
        const user = this.authService.getCurrentUser();
        this.matriculaEducador = (user as any)?.matricula || user?.id || '';
      }
      if (this.matriculaEducador) {
        this.carregarTurmas();
      } else {
        this.erro = 'Nenhum educador identificado. Faça login novamente.';
      }
    });
  }

  // ── Carregar turmas do cronograma ────────────────────────────────────────────

  carregarTurmas(): void {
    this.carregando = true;
    this.erro = '';

    // Busca turmas onde este educador tem aulas AGENDADAS no cronograma
    this.http.get<any[]>(
      `${environment.apiUrl}/cronograma/turmas-educador/${this.matriculaEducador}`
    ).subscribe({
      next: (data) => {
        const lista = Array.isArray(data) ? data : [];
        if (lista.length > 0) {
          this.turmas = lista.map(t => this.mapearTurma(t));
        } else {
          // fallback: disciplinas cadastradas (sem aulas agendadas ainda)
          this.carregarTurmasFallback();
          return;
        }
        this.preencherFiltros();
        this.carregarDiasCronograma();
        this.carregando = false;
      },
      error: () => this.carregarTurmasFallback()
    });
  }

  private carregarTurmasFallback(): void {
    this.http.get<any[]>(
      `${environment.apiUrl}/educador/${this.matriculaEducador}/turmas`
    ).subscribe({
      next: (data) => {
        const lista = Array.isArray(data) ? data : [];
        this.turmas = lista.map(t => this.mapearTurma(t));
        if (this.turmas.length === 0) {
          this.erro = 'Nenhuma turma encontrada para este educador.';
        }
        this.preencherFiltros();
        this.carregarDiasCronograma();
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Erro ao carregar turmas.';
        this.carregando = false;
      }
    });
  }

  private mapearTurma(t: any): MinhasTurmasItem {
    const disciplinas: TurmaDisciplina[] = (t.disciplinas || []).map((d: any) => ({
      idDisciplina: d.idDisciplina || d.id,
      disciplina: d.nomeDisciplina || d.disciplina || d.nome || '',
      codDisciplina: d.codDisciplina || '',
      area: d.area || '',
    }));
    return {
      id:         t.idTurma ?? t.id ?? 0,
      codigo:     t.codTurma || t.codigo_automatico || t.codigo || '',
      nome:       t.nomeTurma || t.nome_completo || t.nome || '',
      serie:      t.serie_nome || t.nomeSerie || t.serie || '',
      turno:      t.periodo_nome || t.nomePeriodo || t.periodo || t.turno || '',
      anoLetivo:  String(t.ano_letivo || t.anoLetivo || ''),
      sala:       t.nomeSala || t.sala || '',
      vagas:      t.qldVagas || t.capacidade_maxima || t.vagas || 0,
      vagasOcupadas: t.capacidade_atual || t.vagasOcupadas || 0,
      status:     (t.status || 'ativa') as any,
      horaInicio: t.hora_inicio || '',
      horaFim:    t.hora_fim    || '',
      disciplinas,
    };
  }

  // ── Cronograma: carrega dias da semana por turma+disciplina ─────────────────

  private carregarDiasCronograma(): void {
    this.http.get<any>(`${environment.apiUrl}/cronograma/educador/${this.matriculaEducador}`)
      .subscribe({
        next: (res) => {
          const lista: any[] = res?.data || (Array.isArray(res) ? res : []);
          const ORDEM: Record<string, number> = {
            segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5
          };
          const ABREV: Record<string, string> = {
            segunda: 'Seg', terca: 'Ter', quarta: 'Qua', quinta: 'Qui', sexta: 'Sex'
          };

          // Monta mapa "turmaId_disciplinaId" → Set<diaSemana>
          const tempMap = new Map<string, Set<string>>();
          for (const r of lista) {
            if (!r.idTurma || !r.idDisciplina || !r.diaSemana) continue;
            const chave = `${r.idTurma}_${r.idDisciplina}`;
            if (!tempMap.has(chave)) tempMap.set(chave, new Set());
            tempMap.get(chave)!.add(r.diaSemana);
          }

          // Converte para arrays ordenados com abreviações
          this.diasMap = new Map(
            [...tempMap.entries()].map(([chave, diasSet]) => [
              chave,
              [...diasSet]
                .sort((a, b) => (ORDEM[a] ?? 9) - (ORDEM[b] ?? 9))
                .map(d => ABREV[d] ?? d)
            ])
          );

          // Enriquece disciplinas das turmas já carregadas
          this.turmas.forEach(turma => {
            turma.disciplinas.forEach(disc => {
              const chave = `${turma.id}_${disc.idDisciplina}`;
              disc.diasSemana = this.diasMap.get(chave) ?? [];
            });
          });
        },
        error: () => {} // silencioso — dias são informação extra
      });
  }

  private preencherFiltros(): void {
    const anos = new Set<string>();
    const turnos = new Set<string>();
    const nomes = new Set<string>();
    this.turmas.forEach(t => {
      if (t.anoLetivo) anos.add(t.anoLetivo);
      if (t.turno)     turnos.add(t.turno);
      if (t.nome)      nomes.add(t.nome);
    });
    this.opcoesAnoLetivo = [...anos].sort((a, b) => b.localeCompare(a));
    this.opcoesPeriodo   = [...turnos].sort();
    this.opcoesTurmas    = [...nomes].sort();
  }

  resetFiltros(): void {
    this.filtroAno = '';
    this.filtroTurno = '';
    this.filtroTurma = '';
  }

  // ── Seleção de turma e disciplina ────────────────────────────────────────────

  selecionarTurma(turma: MinhasTurmasItem): void {
    this.turmaModal            = turma;
    this.disciplinaSelecionada = null;
    this.abaAtiva              = null;
    this.educandos             = [];
    this.cacheFrequencia       = {};
    this.datasComFrequencia    = [];
    this.resetEstadoAba();
  }

  selecionarDisciplina(d: TurmaDisciplina): void {
    this.disciplinaSelecionada = d;
    this.abaAtiva              = 'educandos';
    this.cacheFrequencia       = {};
    this.datasComFrequencia    = [];
    this.resetEstadoAba();
    this.carregarEducandos();
  }

  mudarAba(aba: 'educandos' | 'frequencia' | 'relatorio' | 'notas' | 'dashboard'): void {
    this.abaAtiva = aba;
    if (aba === 'educandos' && this.educandos.length === 0) {
      this.carregarEducandos();
    }
    if (aba === 'frequencia') {
      this.frequenciaData     = new Date().toISOString().split('T')[0];
      this.frequenciaMensagem = '';
      this.frequenciaErro     = '';
      this.carregarFrequenciaDoDia();
    }
    if (aba === 'relatorio') {
      this.relEditData       = null;
      this.relEditRegistros  = [];
      this.relEditMensagem   = '';
      this.alunoDetalhado    = null;
      this.carregarRelatorioCompleto();
    }
    if (aba === 'notas' && this.turmaModal && this.disciplinaSelecionada) {
      this.atividadeSelecionada = null;
      this.notasLancamento      = [];
      this.notasMensagem        = '';
      this.notasErro            = '';
      this.modoNovaAtividade    = false;
      this.carregarAtividades();
    }
    if (aba === 'dashboard' && this.turmaModal && this.disciplinaSelecionada) {
      this.carregarDashboard();
    }
  }

  private resetEstadoAba(): void {
    this.frequenciaRegistros  = [];
    this.frequenciaMensagem   = '';
    this.frequenciaErro       = '';
    this.observacoesAula      = '';
    this.aulaNaoDada          = false;
    this.motivoNaoDada        = '';
    this.atividadeSelecionada = null;
    this.notasLancamento      = [];
    this.notasMensagem        = '';
    this.notasErro            = '';
    this.modoNovaAtividade    = false;
    this.relEditData          = null;
    this.relEditRegistros     = [];
    this.relEditMensagem      = '';
    this.alunoDetalhado       = null;
    this.relatorioData        = [];
    this.relDatasDetalhes     = [];
  }

  private discKey(): string {
    return `${this.turmaModal?.id}_${this.disciplinaSelecionada?.idDisciplina}`;
  }

  // ── Educandos (API real) ─────────────────────────────────────────────────────

  carregarEducandos(): void {
    if (!this.turmaModal) return;
    this.carregandoEducandos = true;
    this.http.get<any>(
      `${environment.apiUrl}/turma/${this.turmaModal.id}/educandos`
    ).subscribe({
      next: (res) => {
        const lista: any[] = Array.isArray(res) ? res : res?.data || [];
        this.educandos = lista.map(e => ({
          id:     String(e.idMatricula || e.id || ''),
          nome:   e.nomeCompleto || e.nome || '',
          serie:  e.serie || '',
          status: e.status || 'Cursando',
        }));
        // Atualiza vagas ocupadas com o total real de matriculados
        if (this.turmaModal) {
          this.turmaModal.vagasOcupadas = this.educandos.length;
        }
        this.carregandoEducandos = false;
      },
      error: () => { this.carregandoEducandos = false; }
    });
  }

  // ── Frequência (API real) ────────────────────────────────────────────────────

  onFrequenciaDataChange(): void {
    this.carregarFrequenciaDoDia();
  }

  carregarFrequenciaDoDia(): void {
    if (!this.turmaModal || !this.disciplinaSelecionada) return;

    this.carregandoFrequencia = true;
    this.frequenciaErro = '';

    const url = `${environment.apiUrl}/frequencia?idTurma=${this.turmaModal.id}`
              + `&idDisciplina=${this.disciplinaSelecionada.idDisciplina}`
              + `&data=${this.frequenciaData}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        const registros: any[] = res?.registros || [];
        if (registros.length > 0) {
          this.frequenciaRegistros = registros.map(r => ({
            alunoId: String(r.idMatricula || r.alunoId || ''),
            nome:    r.nomeEducando || r.nomeCompleto || r.nome || '',
            status:  (r.status || 'presente') as FrequenciaStatus,
          }));
        } else if (this.educandos.length > 0) {
          // Sem registro ainda → padrão "presente" para todos
          this.frequenciaRegistros = this.educandos.map(e => ({
            alunoId: e.id, nome: e.nome, status: 'presente' as FrequenciaStatus,
          }));
        } else {
          // Educandos não carregados ainda — carrega e inicializa
          this.carregarEducandosEIniciarFrequencia();
          return;
        }
        this.carregarMetadataLocal();
        this.carregandoFrequencia = false;
      },
      error: () => {
        this.frequenciaErro = 'Erro ao carregar frequência.';
        this.carregandoFrequencia = false;
      }
    });
  }

  private carregarEducandosEIniciarFrequencia(): void {
    if (!this.turmaModal) return;
    this.http.get<any>(
      `${environment.apiUrl}/turma/${this.turmaModal.id}/educandos`
    ).subscribe({
      next: (res) => {
        const lista: any[] = Array.isArray(res) ? res : res?.data || [];
        this.educandos = lista.map(e => ({
          id:     String(e.idMatricula || e.id || ''),
          nome:   e.nomeCompleto || e.nome || '',
          serie:  e.serie || '',
          status: e.status || 'Cursando',
        }));
        this.frequenciaRegistros = this.educandos.map(e => ({
          alunoId: e.id, nome: e.nome, status: 'presente' as FrequenciaStatus,
        }));
        this.carregarMetadataLocal();
        this.carregandoFrequencia = false;
      },
      error: () => { this.carregandoFrequencia = false; }
    });
  }

  setPresenca(alunoId: string, status: FrequenciaStatus): void {
    const reg = this.frequenciaRegistros.find(r => r.alunoId === alunoId);
    if (reg) reg.status = status;
    if (this.aulaNaoDada && status !== 'ausente') this.aulaNaoDada = false;
  }

  marcarTodos(status: FrequenciaStatus): void {
    this.frequenciaRegistros.forEach(r => r.status = status);
  }

  salvarFrequencia(): void {
    if (!this.turmaModal || !this.disciplinaSelecionada) return;
    if (this.aulaNaoDada && !this.motivoNaoDada.trim()) {
      this.frequenciaErro = 'Informe o motivo pelo qual a aula não foi dada.';
      return;
    }

    this.salvandoFrequencia = true;
    this.frequenciaErro     = '';

    const registros = this.aulaNaoDada
      ? this.frequenciaRegistros.map(r => ({ idMatricula: r.alunoId, status: 'ausente' as FrequenciaStatus }))
      : this.frequenciaRegistros.map(r => ({ idMatricula: r.alunoId, status: r.status }));

    const body = {
      idTurma:       this.turmaModal.id,
      idDisciplina:  this.disciplinaSelecionada.idDisciplina,
      idEducador:    this.matriculaEducador,
      data:          this.frequenciaData,
      registros,
    };

    this.http.post<any>(`${environment.apiUrl}/frequencia`, body).subscribe({
      next: () => {
        this.salvarMetadataLocal();
        this.salvandoFrequencia = false;
        this.frequenciaMensagem = 'Frequência registrada com sucesso!';
        // Adiciona a data ao cache de datas registradas
        if (!this.datasComFrequencia.includes(this.frequenciaData)) {
          this.datasComFrequencia = [...this.datasComFrequencia, this.frequenciaData].sort();
        }
        // Guarda no cache local para o relatório
        this.cacheFrequencia[this.frequenciaData] = [...this.frequenciaRegistros];
        setTimeout(() => this.frequenciaMensagem = '', 3000);
      },
      error: (err) => {
        this.salvandoFrequencia = false;
        this.frequenciaErro = err?.error?.error || err?.error?.message || 'Erro ao salvar frequência.';
      }
    });
  }

  // Metadata local (observações / aulaNaoDada) ─ localStorage
  private metaKey(): string {
    return `freq_meta_${this.turmaModal?.id}_${this.disciplinaSelecionada?.idDisciplina}_${this.frequenciaData}`;
  }

  private carregarMetadataLocal(): void {
    try {
      const raw = localStorage.getItem(this.metaKey());
      if (raw) {
        const meta: AulaMetadata = JSON.parse(raw);
        this.observacoesAula = meta.observacoesAula || '';
        this.aulaNaoDada     = meta.aulaNaoDada     || false;
        this.motivoNaoDada   = meta.motivoNaoDada   || '';
      } else {
        this.observacoesAula = '';
        this.aulaNaoDada     = false;
        this.motivoNaoDada   = '';
      }
    } catch { }
  }

  private salvarMetadataLocal(): void {
    try {
      const meta: AulaMetadata = {
        observacoesAula: this.observacoesAula,
        aulaNaoDada:     this.aulaNaoDada,
        motivoNaoDada:   this.motivoNaoDada,
      };
      localStorage.setItem(this.metaKey(), JSON.stringify(meta));
    } catch { }
  }

  contarPresentes():    number { return this.frequenciaRegistros.filter(r => r.status === 'presente').length; }
  contarAusentes():     number { return this.frequenciaRegistros.filter(r => r.status === 'ausente').length; }
  contarJustificados(): number { return this.frequenciaRegistros.filter(r => r.status === 'justificado').length; }

  // ── Relatório de Frequência ──────────────────────────────────────────────────

  /** Carrega relatório agregado + datas em paralelo */
  carregarRelatorioCompleto(): void {
    if (!this.turmaModal || !this.disciplinaSelecionada) return;
    this.carregandoRelatorio = true;
    this.relatorioData       = [];
    this.relDatasDetalhes    = [];
    this.datasComFrequencia  = [];

    const base = `idTurma=${this.turmaModal.id}&idDisciplina=${this.disciplinaSelecionada.idDisciplina}`;

    // 1) resumo por aluno
    this.http.get<any>(
      `${environment.apiUrl}/frequencia/relatorio/turma/${this.turmaModal.id}?idDisciplina=${this.disciplinaSelecionada.idDisciplina}`
    ).subscribe({
      next: (res) => {
        const lista: any[] = Array.isArray(res) ? res : res?.data || [];
        this.relatorioData = lista.map(r => ({
          alunoId:     String(r.idMatricula || r.alunoId || ''),
          nome:        r.nome || r.nomeCompleto || '',
          total:       r.total || 0,
          presentes:   r.presentes || 0,
          ausentes:    r.ausentes  || 0,
          justificados:r.justificados || 0,
          pct:         r.pct ?? 100,
        }));
      },
      error: () => {}
    });

    // 2) datas com contagens
    this.http.get<any>(
      `${environment.apiUrl}/frequencia/relatorio/datas?${base}`
    ).subscribe({
      next: (res) => {
        const lista: any[] = res?.datas || [];
        this.relDatasDetalhes   = lista;
        this.datasComFrequencia = lista.map((d: any) => d.data);
        this.carregandoRelatorio = false;
      },
      error: () => { this.carregandoRelatorio = false; }
    });
  }

  carregarDatasComFrequencia(): void {
    this.carregarRelatorioCompleto();
  }

  relatorioFrequencia(): ItemRelatorioFreq[] {
    // Prefere dados da API; fallback para cálculo local por cache
    if (this.relatorioData.length > 0) return this.relatorioData;
    if (!this.educandos.length) return [];
    const total = this.datasComFrequencia.length;
    return this.educandos.map(a => {
      const registrosAluno = Object.entries(this.cacheFrequencia)
        .map(([, regs]) => regs.find(r => r.alunoId === a.id));
      const presentes    = registrosAluno.filter(r => r?.status === 'presente').length;
      const justificados = registrosAluno.filter(r => r?.status === 'justificado').length;
      const ausentes     = registrosAluno.filter(r => r?.status === 'ausente').length;
      const totalLocal   = presentes + ausentes + justificados || total;
      const pct = totalLocal > 0 ? Math.round(((presentes + justificados) / totalLocal) * 100) : 100;
      return { alunoId: a.id, nome: a.nome, total: totalLocal, presentes, ausentes, justificados, pct };
    });
  }

  /** Abre o detalhamento dia-a-dia de um aluno */
  verDetalheAluno(item: ItemRelatorioFreq): void {
    if (!this.disciplinaSelecionada) return;
    this.carregandoDetalheAluno = true;
    this.alunoDetalhado = { item, registros: [] };
    this.http.get<any>(
      `${environment.apiUrl}/frequencia/relatorio/educando/${item.alunoId}?idDisciplina=${this.disciplinaSelecionada.idDisciplina}`
    ).subscribe({
      next: (res) => {
        const regs: any[] = res?.registros || [];
        this.alunoDetalhado = {
          item,
          registros: regs.map(r => ({ data: String(r.data), presenca: r.presenca || '' })),
        };
        this.carregandoDetalheAluno = false;
      },
      error: () => { this.carregandoDetalheAluno = false; }
    });
  }

  voltarDetalheAluno(): void {
    this.alunoDetalhado = null;
  }

  abrirEdicaoData(data: string): void {
    if (!this.turmaModal || !this.disciplinaSelecionada) return;
    this.alunoDetalhado   = null;   // fecha detalhe do aluno se estiver aberto
    this.relEditData      = data;
    this.relEditMensagem  = '';
    this.relEditRegistros = [];   // sempre vazio até a API responder

    const url = `${environment.apiUrl}/frequencia?idTurma=${this.turmaModal.id}`
              + `&idDisciplina=${this.disciplinaSelecionada.idDisciplina}&data=${data}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        const registros: any[] = res?.registros || [];
        this.relEditRegistros = registros.map((r: any) => ({
          alunoId: String(r.idMatricula || ''),
          nome:    r.nomeEducando || r.nome || '',
          // status vindo do servidor; null/undefined → 'presente' como padrão editorial
          status: (r.status || 'presente') as FrequenciaStatus,
        }));
      },
      error: () => {
        this.relEditMensagem = 'Erro ao carregar lista de presença.';
      }
    });
  }

  voltarRelatorio(): void {
    this.relEditData = null;
    this.relEditRegistros = [];
    this.relEditMensagem = '';
  }

  setPresencaEdit(alunoId: string, status: FrequenciaStatus): void {
    const reg = this.relEditRegistros.find(r => r.alunoId === alunoId);
    if (reg) reg.status = status;
  }

  salvarEdicaoData(): void {
    if (!this.turmaModal || !this.relEditData || !this.disciplinaSelecionada) return;

    const body = {
      idTurma:      this.turmaModal.id,
      idDisciplina: this.disciplinaSelecionada.idDisciplina,
      idEducador:   this.matriculaEducador,
      data:         this.relEditData,
      registros:    this.relEditRegistros.map(r => ({ idMatricula: r.alunoId, status: r.status })),
    };

    this.http.post<any>(`${environment.apiUrl}/frequencia`, body).subscribe({
      next: () => {
        this.cacheFrequencia[this.relEditData!] = [...this.relEditRegistros];
        this.relEditMensagem = 'Lista de presença atualizada!';
        setTimeout(() => this.voltarRelatorio(), 1200);
      },
      error: () => { this.relEditMensagem = 'Erro ao salvar.'; }
    });
  }

  contarPresentesData(data: string): number {
    const d = this.relDatasDetalhes.find(x => x.data === data);
    if (d) return d.presentes;
    return (this.cacheFrequencia[data] ?? []).filter(r => r.status === 'presente').length;
  }
  contarAusentesData(data: string): number {
    const d = this.relDatasDetalhes.find(x => x.data === data);
    if (d) return d.ausentes;
    return (this.cacheFrequencia[data] ?? []).filter(r => r.status === 'ausente').length;
  }
  contarJustificadosData(data: string): number {
    const d = this.relDatasDetalhes.find(x => x.data === data);
    if (d) return d.justificados;
    return (this.cacheFrequencia[data] ?? []).filter(r => r.status === 'justificado').length;
  }

  pctClass(pct: number): string {
    if (pct >= 75) return 'ok';
    if (pct >= 50) return 'warn';
    return 'danger';
  }

  // ── Notas ────────────────────────────────────────────────────────────────────

  // ── Modal de confirmação ─────────────────────────────────────────────────────
  confirmModal: { visible: boolean; titulo: string; mensagem: string; callback: () => void } = {
    visible: false, titulo: '', mensagem: '', callback: () => {}
  };

  abrirConfirmModal(titulo: string, mensagem: string, callback: () => void): void {
    this.confirmModal = { visible: true, titulo, mensagem, callback };
  }

  confirmarModal(): void {
    this.confirmModal.callback();
    this.confirmModal = { visible: false, titulo: '', mensagem: '', callback: () => {} };
  }

  cancelarModal(): void {
    this.confirmModal = { visible: false, titulo: '', mensagem: '', callback: () => {} };
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  dashboardData: DashboardData | null = null;
  carregandoDashboard = false;
  dashSecaoAberta: Record<string, boolean> = { atividades: true, individual: false };

  toggleDashSecao(key: string): void {
    this.dashSecaoAberta[key] = !this.dashSecaoAberta[key];
  }

  // ── Notas: carregamento ──────────────────────────────────────────────────────

  carregarAtividades(): void {
    if (!this.disciplinaSelecionada) return;
    const url = `${environment.apiUrl}/atividades?idDisciplina=${this.disciplinaSelecionada.idDisciplina}`;
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.atividadesTurma = (data || []).map(a => ({
          id:           a.idAtividade,
          turmaId:      this.turmaModal!.id,
          idDisciplina: a.idDisciplina,
          nome:         a.nome,
          tipo:         a.tipo as TipoAtividade,
          data:         a.dataAtividade,
          notaMaxima:   a.notaMaxima,
        }));
      },
      error: () => { this.atividadesTurma = []; }
    });
  }

  selecionarAtividade(at: Atividade): void {
    if (!this.turmaModal) return;
    this.atividadeSelecionada = at;
    this.notasLancamento = [];
    this.notasMensagem = '';
    this.notasErro = '';
    this.carregandoNotas = true;

    const url = `${environment.apiUrl}/notas/atividade/${at.id}?idTurma=${this.turmaModal.id}`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.notasLancamento = (res?.notas || []).map((n: any) => ({
          alunoId: String(n.idMatricula),
          nome: n.nome,
          nota: n.nota !== undefined && n.nota !== null ? n.nota : null,
        }));
        this.carregandoNotas = false;
      },
      error: () => {
        this.notasErro = 'Erro ao carregar notas.';
        this.carregandoNotas = false;
      }
    });
  }

  voltarAtividades(): void {
    this.atividadeSelecionada = null;
    this.notasLancamento      = [];
    this.modoNovaAtividade    = false;
    this.notasMensagem        = '';
    this.notasErro            = '';
    // Recarrega lista para refletir qualquer alteração
    this.carregarAtividades();
  }

  setNota(alunoId: string, valor: string): void {
    const reg = this.notasLancamento.find(n => n.alunoId === alunoId);
    if (!reg) return;
    const parsed = valor.trim() === '' ? null : parseFloat(valor.replace(',', '.'));
    reg.nota = parsed !== null && !isNaN(parsed) ? parsed : null;
  }

  salvarNotas(): void {
    if (!this.atividadeSelecionada || !this.turmaModal || !this.disciplinaSelecionada) return;
    const max = this.atividadeSelecionada.notaMaxima;
    const invalida = this.notasLancamento.find(n => n.nota !== null && (n.nota < 0 || n.nota > max));
    if (invalida) { this.notasErro = `Nota deve estar entre 0 e ${max}.`; return; }
    this.notasErro = '';
    this.salvandoNotas = true;

    const payload = {
      idAtividade:  this.atividadeSelecionada.id,
      idTurma:      this.turmaModal.id,
      idDisciplina: this.disciplinaSelecionada.idDisciplina,
      notas: this.notasLancamento.map(n => ({ idMatricula: n.alunoId, nota: n.nota })),
    };

    this.http.post<any>(`${environment.apiUrl}/notas`, payload).subscribe({
      next: () => {
        this.salvandoNotas = false;
        this.notasMensagem = 'Notas salvas com sucesso!';
        setTimeout(() => this.notasMensagem = '', 3000);
      },
      error: () => {
        this.salvandoNotas = false;
        this.notasErro = 'Erro ao salvar notas.';
      }
    });
  }

  mostrarNovaAtividade(): void {
    this.modoNovaAtividade = true;
    this.novaAtividade = { nome: '', tipo: 'Prova', data: new Date().toISOString().split('T')[0], notaMaxima: 10 };
    this.notasErro = '';
  }

  cancelarNovaAtividade(): void { this.modoNovaAtividade = false; this.notasErro = ''; }

  salvarNovaAtividade(): void {
    if (!this.turmaModal || !this.disciplinaSelecionada) return;
    if (!this.novaAtividade.nome.trim()) { this.notasErro = 'Informe o nome da atividade.'; return; }
    if (!this.novaAtividade.data)        { this.notasErro = 'Informe a data.'; return; }
    this.salvandoAtividade = true;
    this.notasErro = '';

    const payload = {
      idDisciplina:  this.disciplinaSelecionada.idDisciplina,
      nome:          this.novaAtividade.nome.trim(),
      tipo:          this.novaAtividade.tipo,
      dataAtividade: this.novaAtividade.data,
      notaMaxima:    this.novaAtividade.notaMaxima,
    };

    this.http.post<any>(`${environment.apiUrl}/atividades`, payload).subscribe({
      next: () => {
        this.salvandoAtividade = false;
        this.modoNovaAtividade = false;
        this.carregarAtividades();
      },
      error: () => {
        this.salvandoAtividade = false;
        this.notasErro = 'Erro ao criar atividade.';
      }
    });
  }

  excluirAtividade(at: Atividade): void {
    this.abrirConfirmModal(
      'Excluir atividade',
      `Excluir a atividade "${at.nome}"? As notas lançadas também serão removidas.`,
      () => {
        this.http.delete<any>(`${environment.apiUrl}/atividades/${at.id}`).subscribe({
          next: () => this.carregarAtividades(),
          error: () => {
            this.notasErro = 'Erro ao excluir atividade.';
          }
        });
      }
    );
  }

  mediaTurma(at: Atividade): string {
    const notas = this.notasLancamento.filter(n => n.nota !== null).map(n => n.nota as number);
    if (!notas.length) return '—';
    return (notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1);
  }

  mediaGeralAluno(alunoId: string): string {
    // Calculada a partir das notas já carregadas na tabela (via _notasCache)
    const notas = this.atividadesTurma
      .map(at => at._notaCache?.[alunoId])
      .filter((n): n is number => n !== null && n !== undefined);
    if (!notas.length) return '—';
    return (notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1);
  }

  freqPctAluno(alunoId: string): number {
    return this.relatorioFrequencia().find(r => r.alunoId === alunoId)?.pct ?? 100;
  }

  notaAluno(at: Atividade, alunoId: string): string {
    const v = at._notaCache?.[alunoId];
    return v !== null && v !== undefined ? String(v) : '—';
  }

  datasRegistradas(): string[] {
    return this.datasComFrequencia;
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────

  carregarDashboard(): void {
    if (!this.turmaModal || !this.disciplinaSelecionada) return;
    this.carregandoDashboard = true;
    this.dashboardData = null;
    this.dashSecaoAberta = { atividades: true, individual: false };
    const url = `${environment.apiUrl}/notas/dashboard?idDisciplina=${this.disciplinaSelecionada.idDisciplina}&idTurma=${this.turmaModal.id}`;
    this.http.get<DashboardData>(url).subscribe({
      next: (data) => { this.dashboardData = data; this.carregandoDashboard = false; },
      error: () => { this.carregandoDashboard = false; }
    });
  }

  /** Altura proporcional da barra de distribuição (mín 4%, máx 100%) */
  distBarH(count: number, dist: DistFaixa[]): number {
    const max = Math.max(...dist.map(d => d.count), 1);
    return Math.max(count / max * 100, count > 0 ? 4 : 0);
  }

  /** Cria array de N elementos para *ngFor de preenchimento */
  fillArray(n: number): any[] { return Array(Math.max(0, n)); }

  // ── Utilitários ──────────────────────────────────────────────────────────────

  labelStatus(status: string): string {
    if (status === 'ativa')     return 'Ativa';
    if (status === 'concluida') return 'Concluída';
    return 'Inativa';
  }

  statusEducandoClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'cursando')    return 'edu-status-cursando';
    if (s === 'concluída' || s === 'concluida') return 'edu-status-concluida';
    if (s === 'abandonada' || s === 'abandono') return 'edu-status-abandonada';
    if (s === 'transferida' || s === 'transferido') return 'edu-status-transferida';
    if (s === 'trancado' || s === 'trancada') return 'edu-status-trancado';
    return 'edu-status-outro';
  }

  vagasLivres(t: MinhasTurmasItem): number { return t.vagas - t.vagasOcupadas; }

  disciplinasNomes(t: MinhasTurmasItem): string {
    return t.disciplinas.map(d => d.disciplina).join(', ');
  }

  formatarData(data: string): string {
    if (!data) return '';
    const [y, m, d] = data.split('-');
    return `${d}/${m}/${y}`;
  }

  ngAfterViewInit(): void { this.forceLeft(); }

  private forceLeft(): void {
    const host = document.querySelector('app-minhas-turmas') as HTMLElement;
    if (!host) return;
    const set = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.setProperty('text-align', 'left', 'important');
      el.style.setProperty('align-items', 'flex-start', 'important');
    };
    set(host);
    host.querySelectorAll<HTMLElement>('.mt-page, .page-header, .page-header h1, .page-header p, .filters, .field, label').forEach(set);
  }
}
