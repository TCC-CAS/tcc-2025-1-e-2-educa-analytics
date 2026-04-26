import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export type DetalheTab = 'educando' | 'responsavel' | 'escolar' | 'historico';
export type StatusMatricula = 'Ativa' | 'Concluída' | 'Abandonada';

export interface HistoricoItem {
  anoLetivo: string;
  serie: string;
  turma: string;
  sala: string;
  periodo: string;
  situacao: 'Aprovado' | 'Reprovado' | 'Transferido' | 'Em andamento';
  mediaGeral: number | null;
  frequencia: number | null;
  disciplinas: {
    nome: string;
    n1: number | null;
    n2: number | null;
    n3: number | null;
    n4: number | null;
    media: number | null;
    frequencia: number | null;
    situacao: 'Aprovado' | 'Reprovado' | 'Em andamento';
  }[];
}

export interface MatriculaRegistro {
  id: number;
  idMatricula: string;
  status: StatusMatricula;
  dataMatricula: string;

  // Educando
  alunoNome: string;
  alunoNascimento: string;
  alunoIdade: number;
  alunoGenero: string;
  alunoCorRaca: string;
  alunoCpf: string;
  alunoRg: string;
  alunoEmail: string;
  alunoCelular: string;
  alunoTelefone: string;
  alunoEndereco: {
    cep: string; logradouro: string; numero: string;
    complemento: string; bairro: string; cidade: string; uf: string;
  };

  // ResponsÃ¡vel
  respNome: string;
  respNascimento: string;
  respIdade: number;
  respGenero: string;
  respCorRaca: string;
  respCpf: string;
  respRg: string;
  respEmail: string;
  respCelular: string;
  respTelefone: string;
  respParentesco: string;
  respEndereco: {
    cep: string; logradouro: string; numero: string;
    complemento: string; bairro: string; cidade: string; uf: string;
  };

  // Escolar
  serie: string;
  turma: string;
  codigoTurma: string;
  anoLetivo: string;
  dataInicio: string;
  dataTermino: string;
  periodo: string;
  sala: string;

  // HistÃ³rico
  historico: HistoricoItem[];
}

@Component({
  selector: 'app-lista-matriculas',
  templateUrl: './lista-matriculas.component.html',
  styleUrls: ['./lista-matriculas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class ListaMatriculasComponent implements OnInit, AfterViewInit {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
  ) {}

  ngAfterViewInit(): void {
    this.forceLeftAlignmentStyles();

    const startTime = performance.now();
    const frameLoop = () => {
      this.forceLeftAlignmentStyles();
      if (performance.now() - startTime < 1200) {
        requestAnimationFrame(frameLoop);
      }
    };
    requestAnimationFrame(frameLoop);

    const observer = new MutationObserver(() => {
      this.forceLeftAlignmentStyles();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    setTimeout(() => {
      observer.disconnect();
    }, 2000);
  }

  private forceLeftAlignmentStyles(): void {
    const listaPage = document.querySelector('.lista-page') as HTMLElement;
    if (listaPage) {
      listaPage.style.setProperty('text-align', 'left', 'important');
      listaPage.style.setProperty('width', '100%', 'important');
    }

    const pageHeader = document.querySelector('.page-header') as HTMLElement;
    if (pageHeader) {
      pageHeader.style.setProperty('text-align', 'left', 'important');
      pageHeader.style.setProperty('align-items', 'flex-start', 'important');
      pageHeader.style.setProperty('justify-content', 'flex-start', 'important');

      const h1 = pageHeader.querySelector('h1') as HTMLElement;
      if (h1) h1.style.setProperty('text-align', 'left', 'important');

      const p = pageHeader.querySelector('p, span') as HTMLElement;
      if (p) p.style.setProperty('text-align', 'left', 'important');
    }

    const filtrosCard = document.querySelector('.filtros-card') as HTMLElement;
    if (filtrosCard) {
      filtrosCard.style.setProperty('text-align', 'left', 'important');
    }

    const filtroFields = document.querySelectorAll('.filtro-field') as NodeListOf<HTMLElement>;
    filtroFields.forEach((field) => {
      field.style.setProperty('text-align', 'left', 'important');
      field.style.setProperty('align-items', 'flex-start', 'important');

      const label = field.querySelector('label') as HTMLElement;
      if (label) label.style.setProperty('text-align', 'left', 'important');

      const input = field.querySelector('input, select') as HTMLElement;
      if (input) input.style.setProperty('text-align', 'left', 'important');
    });

    const tabelaCard = document.querySelector('.tabela-card') as HTMLElement;
    if (tabelaCard) {
      tabelaCard.style.setProperty('text-align', 'left', 'important');
    }
  }

  // Estado da tela
  view: 'lista' | 'detalhe' = 'lista';
  modoEdicao = false;
  activeTab: DetalheTab = 'educando';
  historicoExpandido: number | null = null;

  // Filtrosâ”€â”€â”€
  filtroNome = '';
  filtroSerie = '';
  filtroTurma = '';
  filtroAno = '';
  filtroStatus = '';
  filtroPeriodo = '';

  get filtrosAtivos(): number {
    return [this.filtroNome, this.filtroSerie, this.filtroTurma, this.filtroAno, this.filtroStatus, this.filtroPeriodo]
      .filter(v => v !== '').length;
  }

  // PaginaÃ§Ã£oâ”€
  itensPorPagina = 10;
  paginaAtual = 1;

  // Listas cacheadas (atualizadas apenas quando necessÃ¡rio)
  matriculasFiltradas: MatriculaRegistro[] = [];
  matriculasPaginadas: MatriculaRegistro[] = [];
  paginas: number[] = [];
  totalPaginas = 1;
  turmasUnicas: string[] = [];
  anosUnicos: string[] = [];

  // Registro selecionado â”€
  selecionado: MatriculaRegistro | null = null;
  edicao: MatriculaRegistro | null = null;

  readonly series = [
    '1Âº Ano', '2Âº Ano', '3Âº Ano', '4Âº Ano', '5Âº Ano',
    '6Âº Ano', '7Âº Ano', '8Âº Ano', '9Âº Ano'
  ];

  readonly statusList: StatusMatricula[] = ['Ativa', 'Concluída', 'Abandonada'];

  // Dados e estado de carregamento
  matriculas: MatriculaRegistro[] = [];
  carregando = false;
  erroCarregamento = false;

  // Inicialização
  ngOnInit(): void {
    this.carregarMatriculas();
    // Se a rota for /matricula/editar/:id, abre o detalhe em modo edição
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this._idParaEditar = idParam;
    }
  }

  private _idParaEditar: string | null = null;

  carregarMatriculas(): void {
    this.carregando = true;
    this.erroCarregamento = false;
    this.http.get<MatriculaRegistro[]>(`${environment.apiUrl}/matricula`).subscribe({
      next: (data) => {
        this.matriculas = data;
        this.carregando = false;
        this.recalcularTudo();
        // Abre edição se veio de /matricula/editar/:id
        if (this._idParaEditar) {
          const alvo = this.matriculas.find(m => m.idMatricula === this._idParaEditar);
          if (alvo) { this.abrirDetalhe(alvo); this.iniciarEdicao(); }
          this._idParaEditar = null;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregando = false;
        this.erroCarregamento = true;
        this.cdr.markForCheck();
      },
    });
  }

  // InicializaÃ§Ã£o (ngOnInit definido acima)

  // InicializaÃ§Ã£o (ngOnInit definido acima)

  // RecÃ¡lculo centralizado 
  private recalcularTudo(): void {
    const nomeLower = this.filtroNome.toLowerCase();
    this.matriculasFiltradas = this.matriculas.filter(m => {
      if (nomeLower && !m.alunoNome.toLowerCase().includes(nomeLower)) return false;
      if (this.filtroSerie  && m.serie        !== this.filtroSerie)  return false;
      if (this.filtroTurma  && m.codigoTurma  !== this.filtroTurma)  return false;
      if (this.filtroAno    && m.anoLetivo    !== this.filtroAno)    return false;
      if (this.filtroStatus  && m.status    !== this.filtroStatus)  return false;
      if (this.filtroPeriodo && m.periodo    !== this.filtroPeriodo) return false;
      return true;
    });
    this.totalPaginas = Math.max(1, Math.ceil(this.matriculasFiltradas.length / this.itensPorPagina));
    if (this.paginaAtual > this.totalPaginas) this.paginaAtual = 1;
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    this.matriculasPaginadas = this.matriculasFiltradas.slice(inicio, inicio + this.itensPorPagina);
    this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
    this.turmasUnicas = [...new Set(this.matriculas.map(m => m.codigoTurma))].sort();
    this.anosUnicos   = [...new Set(this.matriculas.map(m => m.anoLetivo))].sort().reverse();
  }

  // TrackBy helpers
  trackById(_: number, m: MatriculaRegistro): number { return m.id; }
  trackByIndex(i: number): number { return i; }
  trackByNome(_: number, s: string): string { return s; }

  // AÃ§Ãµes de lista
  abrirDetalhe(m: MatriculaRegistro): void {
    this.selecionado = m;
    this.edicao = JSON.parse(JSON.stringify(m)); // deep copy
    this.modoEdicao = false;
    this.activeTab = 'educando';
    this.historicoExpandido = null;
    this.view = 'detalhe';
    this.cdr.markForCheck();
  }

  voltarLista(): void {
    this.view = 'lista';
    this.selecionado = null;
    this.edicao = null;
    this.modoEdicao = false;
    this.cdr.markForCheck();
  }

  novaMatricula(): void {
    this.router.navigate(['/matricula/nova']);
  }

  rematricular(m: MatriculaRegistro): void {
    this.router.navigate(['/matricula/nova'], { state: { rematricula: m } });
  }

  // AÃ§Ãµes de detalhe
  iniciarEdicao(): void {
    this.modoEdicao = true;
  }

  cancelarEdicao(): void {
    this.edicao = JSON.parse(JSON.stringify(this.selecionado!));
    this.modoEdicao = false;
  }

  confirmEdicaoVisible = false;

  abrirConfirmEdicao(): void {
    if (!this.edicao) return;
    this.confirmEdicaoVisible = true;
  }

  confirmarEdicao(): void {
    this.confirmEdicaoVisible = false;
    this.salvarEdicao();
  }

  cancelarConfirmEdicao(): void {
    this.confirmEdicaoVisible = false;
  }

  salvarEdicao(): void {
    if (!this.edicao) return;
    const id = this.edicao.idMatricula;
    const payload = {
      educando: {
        nomeCompleto:   this.edicao.alunoNome,
        dataNascimento: this.edicao.alunoNascimento,
        idade:          this.edicao.alunoIdade,
        genero:         this.edicao.alunoGenero,
        cor:            this.edicao.alunoCorRaca,
        cpf:            this.edicao.alunoCpf,
        rg:             this.edicao.alunoRg,
        email:          this.edicao.alunoEmail,
        telefone:       this.edicao.alunoTelefone,
        endereco:       this.edicao.alunoEndereco,
      },
      responsavel: this.edicao.respNome ? {
        idMatricula:    this.edicao.id,   // idResponsavel nÃ£o exposto diretamente
        nomeCompleto:   this.edicao.respNome,
        dataNascimento: this.edicao.respNascimento,
        cpf:            this.edicao.respCpf,
        rg:             this.edicao.respRg,
        email:          this.edicao.respEmail,
        telefone:       this.edicao.respTelefone,
        endereco:       this.edicao.respEndereco,
      } : undefined,
    };
    this.http.put<MatriculaRegistro>(`${environment.apiUrl}/matricula/${id}`, payload).subscribe({
      next: (updated) => {
        const idx = this.matriculas.findIndex(m => m.idMatricula === id);
        if (idx !== -1) this.matriculas[idx] = updated;
        this.selecionado = updated;
        this.edicao = JSON.parse(JSON.stringify(updated));
        this.modoEdicao = false;
        this.recalcularTudo();
        this.cdr.markForCheck();
      },
      error: () => {
        this.modoEdicao = false;
        this.cdr.markForCheck();
      },
    });
  }

  toggleHistorico(index: number): void {
    this.historicoExpandido = this.historicoExpandido === index ? null : index;
  }

  // Helpers
  calcularIdade(nascimento: string): number | null {
    if (!nascimento) return null;
    const hoje = new Date();
    const nasc = new Date(nascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  }

  readonly maxDataNasc = new Date().toISOString().split('T')[0];
  readonly minDataNasc = '1900-01-01';

  onNascimentoChange(campo: 'aluno' | 'resp'): void {
    if (!this.edicao) return;
    if (campo === 'aluno') {
      const idade = this.calcularIdade(this.edicao.alunoNascimento);
      this.edicao.alunoIdade = (idade !== null && idade >= 0 && idade <= 120) ? idade : 0;
      if (idade !== null && (idade < 0 || idade > 120)) this.edicao.alunoNascimento = '';
    } else {
      const idade = this.calcularIdade(this.edicao.respNascimento);
      this.edicao.respIdade = (idade !== null && idade >= 0 && idade <= 120) ? idade : 0;
      if (idade !== null && (idade < 0 || idade > 120)) this.edicao.respNascimento = '';
    }
  }

  mascaraCpf(event: Event): void {
    const el = event.target as HTMLInputElement;
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    el.value = v;
    if (this.edicao) {
      const campo = el.name as 'alunoCpf' | 'respCpf';
      (this.edicao as any)[campo] = v;
    }
  }

  mascaraRg(event: Event): void {
    const el = event.target as HTMLInputElement;
    let v = el.value.replace(/[^\dXx]/g, '').slice(0, 9);
    if (v.length > 8) v = v.replace(/(\d{2})(\d{3})(\d{3})([\dXx])/, '$1.$2.$3-$4');
    else if (v.length > 5) v = v.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,3})/, '$1.$2');
    el.value = v;
    if (this.edicao) {
      const campo = el.name as 'alunoRg' | 'respRg';
      (this.edicao as any)[campo] = v;
    }
  }

  mascaraTelefone(event: Event): void {
    const el = event.target as HTMLInputElement;
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length === 11) v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else if (v.length === 10) v = v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    el.value = v;
    if (this.edicao) {
      const campo = el.name as 'alunoTelefone' | 'respTelefone';
      (this.edicao as any)[campo] = v;
    }
  }

  statusClass(status: StatusMatricula): string {
    const map: Record<StatusMatricula, string> = {
      'Ativa': 'status-ativa',
      'Concluída': 'status-concluida',
      'Abandonada': 'status-abandonada',
    };
    return map[status] ?? '';
  }

  // SeleÃ§Ã£o em lote
  selecionados = new Set<number>();
  statusLote: StatusMatricula = 'Ativa';
  modalLoteVisible = false;

  get totalSelecionados(): number { return this.selecionados.size; }

  get todosSelecionados(): boolean {
    return this.matriculasPaginadas.length > 0 &&
      this.matriculasPaginadas.every(m => this.selecionados.has(m.id));
  }

  isSelecionado(id: number): boolean { return this.selecionados.has(id); }

  toggleSelecao(id: number): void {
    if (this.selecionados.has(id)) {
      this.selecionados.delete(id);
    } else {
      this.selecionados.add(id);
    }
    this.cdr.markForCheck();
  }

  selecionarTodos(checked: boolean): void {
    if (checked) {
      this.matriculasPaginadas.forEach(m => this.selecionados.add(m.id));
    } else {
      this.matriculasPaginadas.forEach(m => this.selecionados.delete(m.id));
    }
    this.cdr.markForCheck();
  }

  abrirModalLote(): void {
    if (this.selecionados.size === 0) return;
    this.statusLote = 'Ativa';
    this.modalLoteVisible = true;
  }

  confirmarLote(): void {
    this.modalLoteVisible = false;
    const ids = [...this.selecionados].map(id => {
      const m = this.matriculas.find(m => m.id === id);
      return m?.idMatricula ?? '';
    }).filter(Boolean);
    const novoStatus = this.statusLote;
    this.http.patch(`${environment.apiUrl}/matricula/lote/status`, { ids, status: novoStatus }).subscribe({
      next: () => {
        this.matriculas.forEach(m => {
          if (this.selecionados.has(m.id)) m.status = novoStatus;
        });
        this.selecionados.clear();
        this.recalcularTudo();
        this.cdr.markForCheck();
      },
    });
  }

  cancelarLote(): void {
    this.modalLoteVisible = false;
  }

  // AlteraÃ§Ã£o individual de status
  modalStatusVisible = false;
  matriculaStatusEdit: MatriculaRegistro | null = null;
  novoStatus: StatusMatricula = 'Ativa';

  abrirModalStatus(m: MatriculaRegistro, event: Event): void {
    event.stopPropagation();
    this.matriculaStatusEdit = m;
    this.novoStatus = m.status;
    this.modalStatusVisible = true;
  }

  confirmarAlteracaoStatus(): void {
    this.modalStatusVisible = false;
    if (!this.matriculaStatusEdit) return;
    const id = this.matriculaStatusEdit.idMatricula;
    const novoStatus = this.novoStatus;
    this.http.patch(`${environment.apiUrl}/matricula/${id}/status`, { status: novoStatus }).subscribe({
      next: () => {
        const idx = this.matriculas.findIndex(m => m.idMatricula === id);
        if (idx !== -1) this.matriculas[idx].status = novoStatus;
        this.matriculaStatusEdit = null;
        this.recalcularTudo();
        this.cdr.markForCheck();
      },
      error: () => { this.matriculaStatusEdit = null; },
    });
  }

  cancelarModalStatus(): void {
    this.modalStatusVisible = false;
    this.matriculaStatusEdit = null;
  }

  situacaoClass(s: string): string {
    if (s === 'Aprovado') return 'situacao-aprovado';
    if (s === 'Reprovado') return 'situacao-reprovado';
    if (s === 'Em andamento') return 'situacao-andamento';
    return 'situacao-transferido';
  }

  notaClass(nota: number | null): string {
    if (nota === null) return '';
    if (nota >= 7) return 'nota-ok';
    if (nota >= 5) return 'nota-risco';
    return 'nota-baixa';
  }

  formatarData(data: string): string {
    if (!data) return '-';
    const [y, m, d] = data.split('-');
    return `${d}/${m}/${y}`;
  }

  limparFiltros(): void {
    this.filtroNome = '';
    this.filtroSerie = '';
    this.filtroTurma = '';
    this.filtroAno = '';
    this.filtroStatus = '';
    this.filtroPeriodo = '';
    this.paginaAtual = 1;
    this.recalcularTudo();
    this.cdr.markForCheck();
  }

  irParaPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) {
      this.paginaAtual = p;
      this.recalcularTudo();
      this.cdr.markForCheck();
    }
  }

  onFiltroChange(): void {
    this.paginaAtual = 1;
    this.recalcularTudo();
    this.cdr.markForCheck();
  }
}
