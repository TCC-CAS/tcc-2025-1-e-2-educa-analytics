import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  MatrizCurricularService,
  MatrizCurricular,
  MatrizHistorico,
  CopiarMatrizRequest
} from '../../services/matriz-curricular.service';

interface GrupoSerie {
  serie: string;
  entradas: MatrizCurricular[];
  totalQAS: number;
  totalCH: number;
}

interface GrupoAno {
  ano: number;
  series: GrupoSerie[];
  totalEntradas: number;
}

@Component({
  selector: 'app-matriz-curricular-list',
  templateUrl: './matriz-curricular-list.component.html',
  styleUrls: ['./matriz-curricular-list.component.scss']
})
export class MatrizCurricularListComponent implements OnInit {

  matrizes: MatrizCurricular[] = [];
  isLoading = true;

  filtroAnosLetivos: number[] = [new Date().getFullYear()];
  anoParaAdicionar: number = new Date().getFullYear();
  filtroSerie = '';
  filtroDisciplina = '';

  readonly anoAtual = new Date().getFullYear();
  readonly seriesDisponiveis = [
    '1º Ano EF', '2º Ano EF', '3º Ano EF', '4º Ano EF', '5º Ano EF',
    '6º Ano EF', '7º Ano EF', '8º Ano EF', '9º Ano EF'
  ];
  anosLetivos: number[] = [];

  message = '';
  messageType: 'success' | 'error' = 'success';

  // ── Modais ──────────────────────────────────────────────────

  confirm = {
    visible: false,
    title: '',
    message: '',
    callback: () => {}
  };

  // ── Histórico view por série (substitui a grade ao clicar) ───

  /** quais séries estão expandidas */
  serieExpandida:    Record<string, boolean>                                             = {};
  /** quais séries estão no modo histórico */
  historicoView:     Record<string, boolean>                                             = {};
  /** ano selecionado no select de histórico de cada série */
  historicoViewAno:  Record<string, number>                                              = {};
  /** dados de histórico por série */
  historicoViewData: Record<string, { loading: boolean; registros: MatrizHistorico[] }> = {};

  copiarModal = {
    visible: false,
    anoOrigem: 0,
    anoDestino: 0,
    isLoading: false,
    resultado: null as { copiadas: number; ignoradas: number; message: string } | null
  };

  historicoModal = {
    visible: false,
    serieFiltro: '',
    isLoading: false,
    registros: [] as MatrizHistorico[]
  };

  private readonly ORDEM_SERIES = [
    '1º Ano EF', '2º Ano EF', '3º Ano EF', '4º Ano EF', '5º Ano EF',
    '6º Ano EF', '7º Ano EF', '8º Ano EF', '9º Ano EF'
  ];

  constructor(
    private router: Router,
    private matrizService: MatrizCurricularService
  ) {}

  ngOnInit(): void {
    this.carregarAnosLetivos();
  }

  // ── Data Loading ─────────────────────────────────────────────

  carregarAnosLetivos(): void {
    this.matrizService.listarAnosLetivos().subscribe({
      next: (anos) => {
        const anoAtual = new Date().getFullYear();
        const set = new Set([...anos, anoAtual, anoAtual + 1]);
        this.anosLetivos = Array.from(set).sort((a, b) => a - b);
        if (anos.length > 0 && this.filtroAnosLetivos.length === 0) {
          this.filtroAnosLetivos = anos.includes(anoAtual)
            ? [anoAtual]
            : [anos[anos.length - 1]];
        }
        this.anoParaAdicionar = this.anosLetivos[this.anosLetivos.length - 1] || anoAtual;
        this.carregarMatrizes();
      },
      error: () => {
        const anoAtual = new Date().getFullYear();
        this.anosLetivos = [anoAtual - 1, anoAtual, anoAtual + 1];
        this.anoParaAdicionar = anoAtual;
        this.carregarMatrizes();
      }
    });
  }

  carregarMatrizes(): void {
    if (this.filtroAnosLetivos.length === 0) return;
    
    this.isLoading = true;
    // Fecha todas as views de histórico ao trocar ano
    this.historicoView     = {};
    this.historicoViewAno  = {};
    this.historicoViewData = {};
    // Inicia todas as séries recolhidas
    this.serieExpandida = {};
    
    // Carrega dados de todos os anos selecionados
    const requests = this.filtroAnosLetivos.map(ano => 
      this.matrizService.listar({ anoLetivo: ano })
    );
    
    // Aguarda todas as requisições
    Promise.all(requests.map(req => req.toPromise()))
      .then(results => {
        this.matrizes = results.flat().filter(m => m !== undefined) as MatrizCurricular[];
        this.isLoading = false;
      })
      .catch(() => {
        this.showMessage('Erro ao carregar matriz curricular', 'error');
        this.isLoading = false;
      });
  }

  // ── Computed ─────────────────────────────────────────────────

  get gruposAno(): GrupoAno[] {
    const serieF = this.filtroSerie;
    const discF  = this.filtroDisciplina.toLowerCase().trim();

    const filtradas = this.matrizes.filter(m => {
      if (serieF && m.serie !== serieF) return false;
      if (discF) {
        const nome = (m.disciplina?.nome || '').toLowerCase();
        const cod  = (m.disciplina?.codigo || '').toLowerCase();
        if (!nome.includes(discF) && !cod.includes(discF)) return false;
      }
      return true;
    });

    // Agrupa por ano primeiro
    const porAno = new Map<number, MatrizCurricular[]>();
    filtradas.forEach(m => {
      if (!porAno.has(m.anoLetivo)) porAno.set(m.anoLetivo, []);
      porAno.get(m.anoLetivo)!.push(m);
    });

    // Para cada ano, agrupa por série
    return this.filtroAnosLetivos
      .filter(ano => porAno.has(ano))
      .map(ano => {
        const matrizesDoAno = porAno.get(ano)!;
        const porSerie = new Map<string, MatrizCurricular[]>();
        
        matrizesDoAno.forEach(m => {
          if (!porSerie.has(m.serie)) porSerie.set(m.serie, []);
          porSerie.get(m.serie)!.push(m);
        });

        porSerie.forEach(list =>
          list.sort((a, b) => (a.disciplina?.nome || '').localeCompare(b.disciplina?.nome || '', 'pt-BR'))
        );

        const series = this.ORDEM_SERIES
          .filter(s => porSerie.has(s))
          .map(s => {
            const entradas = porSerie.get(s)!;
            return {
              serie: s,
              entradas,
              totalQAS: entradas.reduce((t, m) => t + m.cargaHorariaSemanal, 0),
              totalCH:  entradas.reduce((t, m) => t + this.ch(m), 0)
            };
          });

        return {
          ano,
          series,
          totalEntradas: matrizesDoAno.length
        };
      });
  }

  get gruposFiltrados(): GrupoSerie[] {
    // Mantém compatibilidade para uso em alguns lugares
    return this.gruposAno.flatMap(ga => ga.series);
  }

  get totalEntradas(): number {
    return this.gruposAno.reduce((t, ga) => t + ga.totalEntradas, 0);
  }

  get filtrosAtivos(): number {
    return (this.filtroSerie ? 1 : 0) + (this.filtroDisciplina ? 1 : 0);
  }

  ch(m: MatrizCurricular): number {
    return m.cargaHorariaAnual ?? m.cargaHorariaSemanal * 40;
  }

  // Anos disponíveis para o destino da cópia (2020–2030)
  get anosDestinoDisponiveis(): number[] {
    const base = new Date().getFullYear();
    const anos: number[] = [];
    for (let y = base - 3; y <= base + 5; y++) anos.push(y);
    return anos;
  }

  // ── Filtros ──────────────────────────────────────────────────

  limparFiltros(): void {
    this.filtroSerie = '';
    this.filtroDisciplina = '';
  }

  // ── Gerenciamento de Anos Múltiplos ──────────────────────────

  adicionarAno(): void {
    const ano = this.anoParaAdicionar;
    if (!ano || this.filtroAnosLetivos.includes(ano)) return;
    
    this.filtroAnosLetivos = [...this.filtroAnosLetivos, ano].sort((a, b) => a - b);
    this.carregarMatrizes();
  }

  removerAno(ano: number): void {
    if (this.filtroAnosLetivos.length <= 1) {
      this.showMessage('Mantenha pelo menos um ano selecionado', 'error');
      return;
    }
    this.filtroAnosLetivos = this.filtroAnosLetivos.filter(a => a !== ano);
    this.carregarMatrizes();
  }

  get anosDisponiveis(): number[] {
    return this.anosLetivos.filter(ano => !this.filtroAnosLetivos.includes(ano));
  }

  // ── Navegação ────────────────────────────────────────────────

  novaGrade(): void {
    this.router.navigate(['/matriz-curricular/serie']);
  }

  editarSerie(serie: string, ano: number): void {
    this.router.navigate(['/matriz-curricular/serie'], {
      queryParams: { serie, anoLetivo: ano }
    });
  }

  // ── Expansão de série ────────────────────────────────────────

  toggleSerieExpanded(serie: string): void {
    this.serieExpandida = {
      ...this.serieExpandida,
      [serie]: !this.serieExpandida[serie]
    };
  }

  // ── Exclusão ─────────────────────────────────────────────────

  confirmarExclusao(m: MatrizCurricular): void {
    this.confirm = {
      visible: true,
      title: 'Remover da matriz',
      message: `Remover "${m.disciplina?.nome || 'esta disciplina'}" da grade da ${m.serie}?`,
      callback: () => this.excluirMatriz(m)
    };
  }

  private excluirMatriz(m: MatrizCurricular): void {
    if (!m.id) return;
    this.confirm.visible = false;
    this.matrizService.excluir(m.id).subscribe({
      next: () => {
        this.showMessage('Disciplina removida da matriz com sucesso', 'success');
        this.carregarMatrizes();
      },
      error: () => this.showMessage('Erro ao excluir entrada da matriz', 'error')
    });
  }

  cancelarConfirmacao(): void {
    this.confirm.visible = false;
  }

  // ── Copiar para Ano ──────────────────────────────────────────

  abrirCopiarModal(): void {
    const anoBase = this.filtroAnosLetivos[this.filtroAnosLetivos.length - 1] || new Date().getFullYear();
    this.copiarModal = {
      visible: true,
      anoOrigem: anoBase,
      anoDestino: anoBase + 1,
      isLoading: false,
      resultado: null
    };
  }

  fecharCopiarModal(): void {
    if (this.copiarModal.resultado) {
      // Adiciona o ano destino aos filtros se não existir
      const anoDestino = this.copiarModal.anoDestino;
      if (!this.filtroAnosLetivos.includes(anoDestino)) {
        this.filtroAnosLetivos = [...this.filtroAnosLetivos, anoDestino].sort((a, b) => a - b);
      }
      // Recarrega anos letivos e matrizes
      this.carregarAnosLetivos();
      this.carregarMatrizes();
    }
    this.copiarModal.visible = false;
  }

  executarCopia(): void {
    const { anoOrigem, anoDestino } = this.copiarModal;
    if (anoOrigem === anoDestino) {
      this.showMessage('Ano de origem e destino não podem ser iguais', 'error');
      return;
    }
    this.copiarModal.isLoading = true;
    this.matrizService.copiarParaAno({ anoOrigem, anoDestino } as CopiarMatrizRequest).subscribe({
      next: (res: any) => {
        this.copiarModal.resultado = {
          copiadas:  res.copiadas  ?? 0,
          ignoradas: res.ignoradas ?? 0,
          message:   res.message   ?? ''
        };
        this.copiarModal.isLoading = false;
      },
      error: () => {
        this.showMessage('Erro ao copiar matriz curricular', 'error');
        this.copiarModal.isLoading = false;
      }
    });
  }

  // ── Histórico view por série ─────────────────────────────────

  /** Liga/desliga o modo histórico de uma série */
  toggleHistoricoView(serie: string, ano: number): void {
    const key = `${ano}-${serie}`;
    if (this.historicoView[key]) {
      this.historicoView = { ...this.historicoView, [key]: false };
      return;
    }
    // Inicializa o ano com o ano da série
    if (!this.historicoViewAno[key]) {
      this.historicoViewAno = { ...this.historicoViewAno, [key]: ano };
    }
    this.historicoView = { ...this.historicoView, [key]: true };
    this.carregarHistoricoView(key, serie, ano);
  }

  /** Recarrega o histórico da série com o ano atualmente selecionado */
  carregarHistoricoView(key: string, serie: string, anoBase: number): void {
    const ano = this.historicoViewAno[key] ?? anoBase;
    this.historicoViewData = {
      ...this.historicoViewData,
      [key]: { loading: true, registros: [] }
    };
    this.matrizService.listarHistorico({ anoLetivo: ano, serie, limit: 100 }).subscribe({
      next: (registros) =>
        this.historicoViewData = { ...this.historicoViewData, [key]: { loading: false, registros } },
      error: () =>
        this.historicoViewData = { ...this.historicoViewData, [key]: { loading: false, registros: [] } }
    });
  }

  /** Chamado pelo select de ano dentro da view de histórico */
  onHistoricoViewAnoChange(key: string, serie: string, ano: string | number): void {
    this.historicoViewAno = { ...this.historicoViewAno, [key]: +ano };
    const anoBase = this.historicoViewAno[key];
    this.carregarHistoricoView(key, serie, anoBase);
  }

  /** Anos disponíveis no select de histórico (range maior que o filtro principal) */
  get anosHistorico(): number[] {
    const base = new Date().getFullYear();
    const anos: number[] = [];
    for (let y = base - 4; y <= base + 2; y++) anos.push(y);
    return anos;
  }

  // ── Histórico (modal global) ──────────────────────────────────

  abrirHistorico(serie?: string, ano?: number): void {
    const anoBase = ano || this.filtroAnosLetivos[0] || new Date().getFullYear();
    this.historicoModal = {
      visible: true,
      serieFiltro: serie || '',
      isLoading: true,
      registros: []
    };
    this.matrizService.listarHistorico({
      anoLetivo: anoBase,
      serie: serie || undefined,
      limit: 200
    }).subscribe({
      next: (registros) => {
        this.historicoModal.registros = registros;
        this.historicoModal.isLoading = false;
      },
      error: () => {
        this.historicoModal.isLoading = false;
        this.historicoModal.registros = [];
      }
    });
  }

  fecharHistorico(): void {
    this.historicoModal.visible = false;
  }

  acaoCls(acao: string): string {
    const map: Record<string, string> = {
      criado: 'tag-created',
      atualizado: 'tag-updated',
      excluido: 'tag-deleted'
    };
    return map[acao] || '';
  }

  acaoLabel(acao: string): string {
    const map: Record<string, string> = {
      criado: 'Criado',
      atualizado: 'Atualizado',
      excluido: 'Excluído'
    };
    return map[acao] || acao;
  }

  // ── Helpers ──────────────────────────────────────────────────

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => (this.message = ''), 4000);
  }
}
