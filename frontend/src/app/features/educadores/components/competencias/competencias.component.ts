import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';
import { getAvaliacaoBNCC, AvaliacaoBNCC, Secao, Criterio, NivelDesempenho } from './competencias-bncc.data';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface TurmaDisciplina {
  idDisciplina: number;
  disciplina: string;
  codDisciplina?: string;
  area?: string;
}

interface TurmaItem {
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
  disciplinas: TurmaDisciplina[];
}

interface Educando {
  id: string;
  nome: string;
  serie: string;
  status: string;
}

interface DistribuicaoNivel {
  nivel: string;
  label: string;
  count: number;
  cor: string;
}

interface EstatisticasSecao {
  secaoId: string;
  secaoTitulo: string;
  icone: string;
  distribuicao: DistribuicaoNivel[];
  mediaScore: number;
  totalRespostas: number;
}

interface EstatisticasTurma {
  totalAvaliados: number;
  secoes: EstatisticasSecao[];
  mediaGeral: number;
}

interface EstatisticasEducando {
  idMatricula: string;
  nome: string;
  secoes: { secaoId: string; secaoTitulo: string; icone: string; mediaScore: number; nivelLabel: string; nivelCor: string }[];
  mediaGeral: number;
}

// Disciplinas BNCC com formulário disponível (fallback quando API não retorna disciplinas)
const DISCIPLINAS_BNCC_DISPONIVEIS: TurmaDisciplina[] = [
  { idDisciplina: 1,  disciplina: 'Língua Portuguesa', codDisciplina: 'LP'  },
  { idDisciplina: 2,  disciplina: 'Arte',              codDisciplina: 'ART' },
  { idDisciplina: 3,  disciplina: 'Educação Física',   codDisciplina: 'EF'  },
];

@Component({
  selector: 'app-competencias',
  templateUrl: './competencias.component.html',
  styleUrls: ['./competencias.component.scss'],
  host: {
    style: 'display:block;width:100%;'
  }
})
export class CompetenciasComponent implements OnInit {

  // ── Estado geral ──────────────────────────────────────────────────────────
  matriculaEducador = '';
  carregando = false;
  erro = '';

  // ── Turmas ────────────────────────────────────────────────────────────────
  turmas: TurmaItem[] = [];
  turmaSelecionada: TurmaItem | null = null;

  // ── Disciplina ────────────────────────────────────────────────────────────
  disciplinaSelecionada: TurmaDisciplina | null = null;

  // ── Série manual (quando turma não tem série) ─────────────────────────────
  serieManual = '';
  seriesDisponiveis = [
    '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano',
    '6º Ano', '7º Ano', '8º Ano', '9º Ano',
  ];

  // ── Educandos ─────────────────────────────────────────────────────────────
  educandos: Educando[] = [];
  carregandoEducandos = false;
  educandoSelecionadoId = '';
  nomeEducandoSelecionado = '';

  // ── Formulário BNCC ───────────────────────────────────────────────────────
  avaliacao: AvaliacaoBNCC | null = null;
  mensagem = '';
  mensagemErro = '';

  // ── Por seção independente ────────────────────────────────────────────────
  /** Data de avaliação por secaoId */
  datasSecao: Record<string, string> = {};
  /** Estado de salvamento por secaoId */
  salvandoSecao: Record<string, boolean> = {};
  /** Seções já salvas nesta sessão — Record para change detection funcionar */
  secoesConcluidas: Record<string, boolean> = {};
  /** Seção expandida no accordion */
  secaoExpandida: Record<string, boolean> = {};
  /** Erros por seção */
  errosSecao: Record<string, string> = {};

  // ── Tabs principais ───────────────────────────────────────────────────────
  abaAtiva: 'avaliar' | 'estatisticas' = 'avaliar';

  // ── Estatísticas da turma ─────────────────────────────────────────────────
  estatisticasTurma: EstatisticasTurma | null = null;
  estatisticasEducandos: EstatisticasEducando[] = [];
  carregandoEstatisticas = false;
  dataFiltroEstatisticas = '';
  statsSubAba: 'geral' | 'educandos' = 'geral';

  // ── Usabilidade ──────────────────────────────────────────────────────────
  filtroEducando = '';
  educandosAvaliados: Record<string, boolean> = {};
  carregandoAvaliacaoSalva = false;
  sidebarVisivel = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ── Ciclo de vida ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idRota = params.get('id');
      if (idRota) {
        this.matriculaEducador = idRota;
      } else {
        const user = this.authService.getCurrentUser();
        this.matriculaEducador = (user as any)?.matricula || user?.id || '';
      }
      if (this.matriculaEducador) {
        this.carregarTurmas();
      } else {
        this.erro = 'Nenhum educador identificado.';
      }
    });
  }

  // ── Carregar turmas ───────────────────────────────────────────────────────

  carregarTurmas(): void {
    this.carregando = true;
    this.erro = '';

    this.http.get<any[]>(
      `${environment.apiUrl}/cronograma/turmas-educador/${this.matriculaEducador}`
    ).subscribe({
      next: (data) => {
        const lista = Array.isArray(data) ? data : [];
        if (lista.length > 0) {
          this.turmas = lista.map(t => this.mapearTurma(t));
          this.carregando = false;
        } else {
          this.carregarTurmasFallback();
        }
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
        if (!this.turmas.length) {
          this.erro = 'Nenhuma turma encontrada para este educador.';
        }
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Erro ao carregar turmas.';
        this.carregando = false;
      }
    });
  }

  private mapearTurma(t: any): TurmaItem {
    const disciplinas: TurmaDisciplina[] = (t.disciplinas || []).map((d: any) => ({
      idDisciplina: d.idDisciplina || d.id,
      disciplina:   d.nomeDisciplina || d.disciplina || d.nome || '',
      codDisciplina: d.codDisciplina || '',
      area:          d.area || '',
    }));
    return {
      id:           t.idTurma ?? t.id ?? 0,
      codigo:       t.codTurma || t.codigo_automatico || t.codigo || '',
      nome:         t.nomeTurma || t.nome_completo || t.nome || '',
      serie:        t.serie_nome || t.nomeSerie || t.serie || '',
      turno:        t.periodo_nome || t.nomePeriodo || t.periodo || t.turno || '',
      anoLetivo:    String(t.ano_letivo || t.anoLetivo || ''),
      sala:         t.nomeSala || t.sala || '',
      vagas:        t.qldVagas || t.capacidade_maxima || t.vagas || 0,
      vagasOcupadas: t.capacidade_atual || t.vagasOcupadas || 0,
      status:       (t.status || 'ativa') as any,
      disciplinas,
    };
  }

  // ── Carregar educandos ────────────────────────────────────────────────────

  carregarEducandos(): void {
    if (!this.turmaSelecionada) return;
    this.carregandoEducandos = true;
    this.http.get<any>(
      `${environment.apiUrl}/turma/${this.turmaSelecionada.id}/educandos`
    ).subscribe({
      next: (res) => {
        const lista: any[] = Array.isArray(res) ? res : res?.data || [];
        this.educandos = lista.map(e => ({
          id:     String(e.idMatricula || e.id || ''),
          nome:   e.nomeCompleto || e.nome || '',
          serie:  e.serie || '',
          status: e.status || 'Cursando',
        }));
        this.carregandoEducandos = false;
      },
      error: () => { this.carregandoEducandos = false; }
    });
  }

  // ── Disciplinas efetivas ──────────────────────────────────────────────────

  get disciplinasEfetivas(): TurmaDisciplina[] {
    if (!this.turmaSelecionada) return [];
    const d = this.turmaSelecionada.disciplinas?.filter(x => x.disciplina?.trim());
    return d?.length ? d : DISCIPLINAS_BNCC_DISPONIVEIS;
  }

  get usandoFallbackDisciplinas(): boolean {
    if (!this.turmaSelecionada) return false;
    return !this.turmaSelecionada.disciplinas?.filter(x => x.disciplina?.trim()).length;
  }

  get serieEfetiva(): string {
    return this.turmaSelecionada?.serie?.trim() || this.serieManual;
  }

  get precisaSelecionarSerie(): boolean {
    return !!(this.disciplinaSelecionada && !this.turmaSelecionada?.serie?.trim() && !this.serieManual);
  }

  // ── Seleção ───────────────────────────────────────────────────────────────

  selecionarTurma(turma: TurmaItem): void {
    this.turmaSelecionada      = turma;
    this.disciplinaSelecionada = null;
    this.avaliacao             = null;
    this.educandos             = [];
    this.educandoSelecionadoId = '';
    this.nomeEducandoSelecionado = '';
    this.mensagem              = '';
    this.mensagemErro          = '';
    this.serieManual           = '';
    this.abaAtiva              = 'avaliar';
    this.estatisticasTurma     = null;
    this.educandosAvaliados    = {};
    this.filtroEducando        = '';
    this.datasSecao            = {};
    this.salvandoSecao         = {};
    this.secoesConcluidas      = {};
    this.secaoExpandida        = {};
    this.errosSecao            = {};
    this.carregarEducandos();
  }

  selecionarDisciplina(d: TurmaDisciplina): void {
    this.disciplinaSelecionada = d;
    this.avaliacao             = null;
    this.educandoSelecionadoId = '';
    this.nomeEducandoSelecionado = '';
    this.mensagem              = '';
    this.mensagemErro          = '';
    this.abaAtiva              = 'avaliar';
    this.estatisticasTurma     = null;
    this.educandosAvaliados    = {};
    this.filtroEducando        = '';
    this.datasSecao            = {};
    this.salvandoSecao         = {};
    this.secoesConcluidas      = {};
    this.secaoExpandida        = {};
    this.errosSecao            = {};
    this.tentarCarregarAvaliacao();
  }

  onSerieManualChange(): void {
    this.tentarCarregarAvaliacao();
  }

  private tentarCarregarAvaliacao(): void {
    if (!this.disciplinaSelecionada) return;
    const serie = this.serieEfetiva;
    if (!serie) return;
    this.avaliacao = getAvaliacaoBNCC(this.disciplinaSelecionada.disciplina, serie);
    // Inicializa expansão da primeira seção
    if (this.avaliacao) {
      this.secaoExpandida = {};
      if (this.avaliacao.secoes.length > 0) {
        this.secaoExpandida[this.avaliacao.secoes[0].id] = true;
      }
    }
  }

  // ── Seleção de educando (card list) ──────────────────────────────────────

  selecionarEducando(e: Educando): void {
    this.educandoSelecionadoId   = e.id;
    this.nomeEducandoSelecionado = e.nome;
    this.secoesConcluidas        = {};
    this.salvandoSecao           = {};
    this.errosSecao              = {};
    this.mensagemErro            = '';

    // Inicializa datas de hoje para todas as seções
    const hoje = new Date().toISOString().split('T')[0];
    if (this.avaliacao) {
      for (const s of this.avaliacao.secoes) {
        if (!this.datasSecao[s.id]) this.datasSecao[s.id] = hoje;
      }
      if (this.avaliacao.sintese?.length) {
        if (!this.datasSecao['sintese']) this.datasSecao['sintese'] = hoje;
      }
      // Abre primeira seção
      this.secaoExpandida = {};
      if (this.avaliacao.secoes.length > 0) {
        this.secaoExpandida[this.avaliacao.secoes[0].id] = true;
      }
    }

    this.carregarAvaliacaoExistente();
  }

  trocarEducando(): void {
    this.educandoSelecionadoId   = '';
    this.nomeEducandoSelecionado = '';
    this.secoesConcluidas        = {};
    this.salvandoSecao           = {};
    this.errosSecao              = {};
    this.mensagemErro            = '';
    if (this.disciplinaSelecionada) {
      this.avaliacao = getAvaliacaoBNCC(this.disciplinaSelecionada.disciplina, this.serieEfetiva);
      if (this.avaliacao?.secoes.length) {
        this.secaoExpandida = {};
        this.secaoExpandida[this.avaliacao.secoes[0].id] = true;
      }
    }
  }

  toggleSecao(secaoId: string): void {
    this.secaoExpandida[secaoId] = !this.secaoExpandida[secaoId];
  }

  // ── Seções ────────────────────────────────────────────────────────────────

  get secoes(): Secao[] {
    return this.avaliacao?.secoes || [];
  }

  secaoCompleta(s: Secao): boolean {
    return s.criterios.every(c => c.nivel !== '');
  }

  contarPreenchidosSecao(s: Secao): number {
    return s.criterios.filter(c => c.nivel !== '').length;
  }

  get totalPreenchidos(): number {
    if (!this.avaliacao) return 0;
    return this.avaliacao.secoes.reduce(
      (acc, s) => acc + s.criterios.filter(c => c.nivel !== '').length, 0
    );
  }

  get totalCriterios(): number {
    if (!this.avaliacao) return 0;
    return this.avaliacao.secoes.reduce((acc, s) => acc + s.criterios.length, 0);
  }

  setNivel(criterio: Criterio, nivel: NivelDesempenho): void {
    criterio.nivel = criterio.nivel === nivel ? '' : nivel;
  }

  // ── Filtro de educandos ───────────────────────────────────────────────────

  get educandosFiltrados(): Educando[] {
    if (!this.filtroEducando.trim()) return this.educandos;
    const f = this.filtroEducando.toLowerCase().trim();
    return this.educandos.filter(e => e.nome.toLowerCase().includes(f));
  }

  // ── Carregar avaliação existente ──────────────────────────────────────────

  private carregarAvaliacaoExistente(): void {
    if (!this.turmaSelecionada || !this.disciplinaSelecionada || !this.educandoSelecionadoId) return;
    this.carregandoAvaliacaoSalva = true;

    // Usa a data da primeira seção já preenchida, ou a data de hoje, para derivar o bimestre
    const dataRef = Object.values(this.datasSecao).find(d => !!d)
                 || new Date().toISOString().split('T')[0];

    this.http.get<any>(`${environment.apiUrl}/competencias-bncc`, {
      params: {
        idTurma:      String(this.turmaSelecionada.id),
        idDisciplina: String(this.disciplinaSelecionada.idDisciplina),
        idMatricula:  this.educandoSelecionadoId,
        bimestre:     this.bimestreDeData(dataRef),
      }
    }).subscribe({
      next: (res) => {
        if (res?.avaliacao) {
          this.preencherAvaliacaoExistente(res.avaliacao);
          this.educandosAvaliados[this.educandoSelecionadoId] = true;
        } else {
          this.avaliacao = getAvaliacaoBNCC(this.disciplinaSelecionada!.disciplina, this.serieEfetiva);
        }
        this.carregandoAvaliacaoSalva = false;
      },
      error: () => { this.carregandoAvaliacaoSalva = false; }
    });
  }

  private preencherAvaliacaoExistente(savedAv: any): void {
    if (!this.disciplinaSelecionada) return;
    this.avaliacao = getAvaliacaoBNCC(this.disciplinaSelecionada.disciplina, this.serieEfetiva);
    if (!this.avaliacao) return;

    const hoje = new Date().toISOString().split('T')[0];

    for (const savedSecao of savedAv.secoes || []) {
      const secao = this.avaliacao.secoes.find(s => s.id === savedSecao.id);
      if (!secao) continue;

      let temDados = false;
      for (const savedCriterio of savedSecao.criterios || []) {
        const criterio = secao.criterios.find(c => c.id === savedCriterio.id);
        if (criterio && savedCriterio.nivel) {
          criterio.nivel = savedCriterio.nivel;
          temDados = true;
        }
      }

      // Marca como concluída se tem qualquer critério preenchido (independente de dataAvaliacao)
      if (temDados) {
        if (!this.datasSecao[savedSecao.id]) {
          this.datasSecao[savedSecao.id] = savedSecao.dataAvaliacao || hoje;
        }
        this.secoesConcluidas = { ...this.secoesConcluidas, [savedSecao.id]: true };
      }
    }

    // Síntese
    let temSintese = false;
    for (const savedSintese of savedAv.sintese || []) {
      const item = this.avaliacao.sintese?.find((s: any) => s.id === savedSintese.id);
      if (item && savedSintese.observacoes !== undefined) {
        (item as any).observacoes = savedSintese.observacoes;
        if ((savedSintese.observacoes || '').trim()) temSintese = true;
      }
    }
    if (temSintese) {
      if (!this.datasSecao['sintese']) {
        this.datasSecao['sintese'] = savedAv.dataAvaliacaoSintese || hoje;
      }
      this.secoesConcluidas = { ...this.secoesConcluidas, sintese: true };
    }
  }

  get sinteseItens() {
    return this.avaliacao?.sintese || [];
  }

  // ── Salvar seção individual ───────────────────────────────────────────────

  /** Deriva o bimestre (1–4) a partir de uma data ISO (yyyy-MM-dd) */
  private bimestreDeData(dataIso: string): string {
    const mes = new Date(dataIso + 'T00:00:00').getMonth() + 1; // 1–12
    if (mes <= 3)  return '1';
    if (mes <= 6)  return '2';
    if (mes <= 9)  return '3';
    return '4';
  }

  salvarSecao(secaoId: string): void {
    if (!this.educandoSelecionadoId || !this.avaliacao || !this.turmaSelecionada || !this.disciplinaSelecionada) {
      this.mensagemErro = 'Selecione um educando antes de salvar.';
      return;
    }

    const dataAvaliacao = this.datasSecao[secaoId];
    if (!dataAvaliacao) {
      this.errosSecao[secaoId] = 'Informe a data da avaliação.';
      return;
    }
    delete this.errosSecao[secaoId];

    this.salvandoSecao[secaoId] = true;

    // Monta um objeto avaliacao contendo apenas a seção que está sendo salva,
    // mas mantém a estrutura esperada pelo backend
    let avaliacaoPayload: any;
    if (secaoId === 'sintese') {
      avaliacaoPayload = {
        titulo:    this.avaliacao.titulo,
        disciplina: this.avaliacao.disciplina,
        secoes:    [],
        sintese:   this.avaliacao.sintese,
      };
    } else {
      const secao = this.avaliacao.secoes.find(s => s.id === secaoId);
      if (!secao) { this.salvandoSecao[secaoId] = false; return; }
      avaliacaoPayload = {
        titulo:    this.avaliacao.titulo,
        disciplina: this.avaliacao.disciplina,
        secoes:    [secao],
        sintese:   [],
      };
    }

    const payload = {
      idTurma:      this.turmaSelecionada.id,
      idDisciplina: this.disciplinaSelecionada.idDisciplina,
      idMatricula:  this.educandoSelecionadoId,
      bimestre:     this.bimestreDeData(dataAvaliacao),
      dataAvaliacao,
      idEducador:   this.matriculaEducador,
      secaoId,
      avaliacao:    avaliacaoPayload,
    };

    this.http.post<any>(`${environment.apiUrl}/competencias-bncc`, payload).subscribe({
      next: () => {
        this.salvandoSecao = { ...this.salvandoSecao, [secaoId]: false };
        this.secoesConcluidas = { ...this.secoesConcluidas, [secaoId]: true };
        this.educandosAvaliados = { ...this.educandosAvaliados, [this.educandoSelecionadoId]: true };
      },
      error: (err) => {
        this.salvandoSecao[secaoId] = false;
        this.errosSecao[secaoId] = err?.error?.error || 'Erro ao salvar. Tente novamente.';
      }
    });
  }

  irParaEstatisticas(): void {
    this.abaAtiva = 'estatisticas';
    this.statsSubAba = 'geral';
    this.carregarEstatisticasTurma();
  }

  // ── Estatísticas da turma ─────────────────────────────────────────────────

  carregarEstatisticasTurma(): void {
    if (!this.turmaSelecionada || !this.disciplinaSelecionada) return;
    this.carregandoEstatisticas = true;
    this.estatisticasTurma      = null;
    const dataRef = this.dataFiltroEstatisticas || new Date().toISOString().split('T')[0];
    const params: any = {
      idTurma:      String(this.turmaSelecionada.id),
      idDisciplina: String(this.disciplinaSelecionada.idDisciplina),
      bimestre:     this.bimestreDeData(dataRef),
    };
    if (this.dataFiltroEstatisticas) params['dataAvaliacao'] = this.dataFiltroEstatisticas;

    this.http.get<any>(`${environment.apiUrl}/competencias-bncc/turma`, { params }).subscribe({
      next: (res) => {
        // Aceita tanto { avaliacoes: [...] } quanto array direto
        const lista: any[] = Array.isArray(res) ? res : (res?.avaliacoes || res?.data || []);
        this.calcularEstatisticas(lista);
        this.carregandoEstatisticas = false;
      },
      error: () => { this.carregandoEstatisticas = false; }
    });
  }

  /** Extrai a lista de seções de um registro de avaliação (suporta múltiplos formatos de resposta) */
  private extrairSecoes(av: any): any[] {
    // Formato 1: { avaliacao: { secoes: [...] } }
    if (av.avaliacao?.secoes?.length) return av.avaliacao.secoes;
    // Formato 2: { secao: { criterios: [...] } } (salvo por secaoId individualmente)
    if (av.secao?.criterios?.length) return [av.secao];
    // Formato 3: { secoes: [...] }
    if (av.secoes?.length) return av.secoes;
    return [];
  }

  private calcularEstatisticas(avaliacoes: any[]): void {
    if (!this.avaliacao || !avaliacoes.length) {
      this.estatisticasTurma = null;
      this.estatisticasEducandos = [];
      return;
    }

    // Escala 0-10: Excelente=10, Bom=7.5, Regular=5, Precisa de Apoio=2.5
    const nivelScore: Record<string, number>  = { 'excelente': 10, 'bom': 7.5, 'regular': 5, 'precisa-apoio': 2.5 };
    const nivelCores: Record<string, string>  = { 'excelente': '#34a853', 'bom': '#1a73e8', 'regular': '#fbbc04', 'precisa-apoio': '#ea4335' };
    const nivelLabels: Record<string, string> = { 'excelente': 'Excelente', 'bom': 'Bom', 'regular': 'Regular', 'precisa-apoio': 'Precisa de Apoio' };
    const niveis = ['excelente', 'bom', 'regular', 'precisa-apoio'];

    // ── 1. Estatísticas agregadas por seção ───────────────────────────────
    const statsSecoes: EstatisticasSecao[] = this.avaliacao.secoes.map(secao => {
      const contagens: Record<string, number> = { 'excelente': 0, 'bom': 0, 'regular': 0, 'precisa-apoio': 0 };
      let totalScore = 0;
      let countValido = 0;

      for (const av of avaliacoes) {
        const secoesAv = this.extrairSecoes(av);
        const secaoAv = secoesAv.find((s: any) => s.id === secao.id);
        if (!secaoAv) continue;
        for (const criterio of secaoAv.criterios || []) {
          if (criterio.nivel && criterio.nivel !== '') {
            contagens[criterio.nivel] = (contagens[criterio.nivel] || 0) + 1;
            totalScore += nivelScore[criterio.nivel] || 0;
            countValido++;
          }
        }
      }

      const totalRespostas = niveis.reduce((a, n) => a + (contagens[n] || 0), 0);
      return {
        secaoId:       secao.id,
        secaoTitulo:   secao.titulo,
        icone:         secao.icone,
        distribuicao:  niveis.map(n => ({ nivel: n, label: nivelLabels[n], count: contagens[n] || 0, cor: nivelCores[n] })),
        totalRespostas,
        mediaScore:    countValido > 0 ? totalScore / countValido : 0,
      };
    });

    const secoesComDados = statsSecoes.filter(s => s.totalRespostas > 0);
    const mediaGeral = secoesComDados.length
      ? secoesComDados.reduce((a, s) => a + s.mediaScore, 0) / secoesComDados.length
      : 0;

    // Conta educandos únicos
    const idsUnicos = new Set<string>(avaliacoes.map(av => String(av.idMatricula || av.matricula || '')).filter(Boolean));
    this.estatisticasTurma = { totalAvaliados: idsUnicos.size || avaliacoes.length, secoes: statsSecoes, mediaGeral };

    // ── 2. Estatísticas individuais por educando ──────────────────────────
    // Agrupa registros por idMatricula
    const porEducando = new Map<string, any[]>();
    for (const av of avaliacoes) {
      const id = String(av.idMatricula || av.matricula || '');
      if (!id) continue;
      if (!porEducando.has(id)) porEducando.set(id, []);
      porEducando.get(id)!.push(av);
    }

    this.estatisticasEducandos = [...porEducando.entries()].map(([idMatricula, registros]) => {
      // Nome: tenta resolver pelo array de educandos carregados
      const eduLocal = this.educandos.find(e => e.id === idMatricula);
      const nome = eduLocal?.nome || registros[0]?.nomeEducando || registros[0]?.nome || idMatricula;

      const secoesEducando = this.avaliacao!.secoes.map(secao => {
        let totalScore = 0;
        let countValido = 0;

        for (const av of registros) {
          const secoesAv = this.extrairSecoes(av);
          const secaoAv = secoesAv.find((s: any) => s.id === secao.id);
          if (!secaoAv) continue;
          for (const criterio of secaoAv.criterios || []) {
            if (criterio.nivel && criterio.nivel !== '') {
              totalScore += nivelScore[criterio.nivel] || 0;
              countValido++;
            }
          }
        }

        const media = countValido > 0 ? totalScore / countValido : 0;
        return {
          secaoId:    secao.id,
          secaoTitulo: secao.titulo,
          icone:       secao.icone,
          mediaScore:  media,
          nivelLabel:  countValido > 0 ? this.labelNivelMedia(media) : '—',
          nivelCor:    countValido > 0 ? this.corNivelMedia(media) : '#9aa0a6',
        };
      });

      const secoesComMedia = secoesEducando.filter(s => s.mediaScore > 0);
      const mediaGeral = secoesComMedia.length
        ? secoesComMedia.reduce((a, s) => a + s.mediaScore, 0) / secoesComMedia.length
        : 0;

      return { idMatricula, nome, secoes: secoesEducando, mediaGeral };
    }).sort((a, b) => b.mediaGeral - a.mediaGeral); // Ordena por melhor média
  }

  formatarMedia(score: number): string {
    return score.toFixed(1);
  }

  labelNivelMedia(score: number): string {
    if (score >= 8.75) return 'Excelente';
    if (score >= 6.25) return 'Bom';
    if (score >= 3.75) return 'Regular';
    if (score > 0)     return 'Precisa de Apoio';
    return '—';
  }

  corNivelMedia(score: number): string {
    if (score >= 8.75) return '#34a853';
    if (score >= 6.25) return '#1a73e8';
    if (score >= 3.75) return '#fbbc04';
    if (score > 0)     return '#ea4335';
    return '#9aa0a6';
  }

  // ── Utilitários ───────────────────────────────────────────────────────────

  labelStatus(status: string): string {
    if (status === 'ativa')     return 'Ativa';
    if (status === 'concluida') return 'Concluída';
    return 'Inativa';
  }

  /** Filtra seções avaliadas de um educando (exclui as sem dados) */
  secoesAvaliadas(edu: EstatisticasEducando) {
    return edu.secoes.filter(s => s.mediaScore > 0);
  }

  get qtdAvaliados(): number {
    return Object.keys(this.educandosAvaliados).filter(k => this.educandosAvaliados[k]).length;
  }

  get totalSecoesAvaliacao(): number {
    if (!this.avaliacao) return 0;
    return this.avaliacao.secoes.length + (this.avaliacao.sintese?.length ? 1 : 0);
  }

  get totalSecoesConcluidas(): number {
    return Object.keys(this.secoesConcluidas).filter(k => this.secoesConcluidas[k]).length;
  }
}
