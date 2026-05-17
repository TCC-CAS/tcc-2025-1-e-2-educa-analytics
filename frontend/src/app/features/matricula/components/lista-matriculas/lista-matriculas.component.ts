import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export type DetalheTab = 'educando' | 'responsavel' | 'escolar' | 'historico';
export type StatusMatricula = 'Ativa' | 'Concluída' | 'Abandonada' | 'Transferida';

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

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

  // Responsável
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

  // Histórico
  historico: HistoricoItem[];
}

interface TurmaDetalhe {
  codigo: string;
  nome: string;
  anoLetivo: string;
  serie: string;
  periodo: string;
  sala: string;
  dataInicio: string;
  dataTermino: string;
  vagasOcupadas: number[];
}

interface TurmaBackend {
  idTurma: number;
  codTurma: string;
  nomeTurma: string;
  periodo: string;
  anoLetivo: string;
  serie: string;
  qldVagas: number;
  dataInicio: string;
  dataFim: string;
  status: string;
  idSala: number | null;
  nomeSala: string | null;
  vagasOcupadas: number[];
  vagasDisponiveis: number;
}

@Component({
  selector: 'app-lista-matriculas',
  templateUrl: './lista-matriculas.component.html',
  styleUrls: ['./lista-matriculas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class ListaMatriculasComponent implements OnInit, AfterViewInit {
  // Propriedades de navegação e estado
  view: 'lista' | 'detalhe' = 'lista';
  modoEdicao = false;
  activeTab: DetalheTab = 'educando';
  secaoAtiva = '';
  historicoExpandido: number | null = null;

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

  // Filtros
  filtroNome = '';
  filtroSerie = '';
  filtroTurma = '';
  filtroAno = '';
  filtroStatus = '';
  filtroSituacao = '';
  filtroPeriodo = '';

  get filtrosAtivos(): number {
    return [this.filtroNome, this.filtroSerie, this.filtroTurma, this.filtroAno, this.filtroStatus, this.filtroSituacao, this.filtroPeriodo]
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
    '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano',
    '6º Ano', '7º Ano', '8º Ano', '9º Ano'
  ];

  readonly statusList: StatusMatricula[] = ['Ativa', 'Concluída', 'Abandonada', 'Transferida'];

  // Gênero (para edição)
  alunoGeneroSelecionado = '';
  alunoGeneroOutro = false;
  alunoGeneroCustom = '';
  
  respGeneroSelecionado = '';
  respGeneroOutro = false;
  respGeneroCustom = '';

  readonly generosOpcoes = [
    { value: 'mulher-cis', label: 'Mulher cis' },
    { value: 'homem-cis', label: 'Homem cis' },
    { value: 'homem-trans', label: 'Homem trans' },
    { value: 'mulher-trans', label: 'Mulher trans' },
    { value: 'agenero', label: 'Agênero' },
    { value: 'genero-fluido', label: 'Gênero fluido' },
    { value: 'bigenero', label: 'Bigênero' },
    { value: 'demigenero', label: 'Demigênero' },
    { value: 'intergenero', label: 'Intergênero' },
    { value: 'nao-informar', label: 'Prefiro não informar' },
    { value: 'outro', label: 'Outro' }
  ];

  // Lógica de cascata para turmas (edição)
  anosLetivos: string[] = Array.from({ length: 6 }, (_, i) =>
    (new Date().getFullYear() - 1 + i).toString()
  );
  
  seriesDisponiveis: string[] = [];
  periodosDisponiveis: { value: string; label: string }[] = [];
  turmasDisponiveis: TurmaDetalhe[] = [];
  turmasCarregando = false;

  private readonly periodosLabel: Record<string, string> = {
    matutino: 'Manhã', 
    vespertino: 'Tarde', 
    noturno: 'Noite', 
    integral: 'Integral'
  };

  private readonly periodosLabelReverso: Record<string, string> = {
    'Manhã': 'matutino',
    'Tarde': 'vespertino',
    'Noite': 'noturno',
    'Integral': 'integral',
    'matutino': 'matutino',
    'vespertino': 'vespertino',
    'noturno': 'noturno',
    'integral': 'integral'
  };

  // CEP e endereço
  cepLoadingAluno = false;
  cepErroAluno = false;
  cepLoadingResp = false;
  cepErroResp = false;
  useSameAddress = false;

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
      if (this.filtroStatus  && m.status    !== this.filtroStatus)  return false;      if (this.filtroSituacao && this.getSituacao(m) !== this.filtroSituacao) return false;      if (this.filtroPeriodo && m.periodo    !== this.filtroPeriodo) return false;
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

  // Ações de lista
  abrirDetalhe(m: MatriculaRegistro): void {
    this.selecionado = m;
    this.edicao = JSON.parse(JSON.stringify(m)); // deep copy
    this.modoEdicao = false;
    this.activeTab = 'educando';
    this.secaoAtiva = 'identificacao-educando';
    this.historicoExpandido = null;
    this.view = 'detalhe';
    
    // Resetar estados de CEP e endereço
    this.cepLoadingAluno = false;
    this.cepErroAluno = false;
    this.cepLoadingResp = false;
    this.cepErroResp = false;
    this.useSameAddress = false;
    
    // Inicializa gênero
    this.alunoGeneroSelecionado = m.alunoGenero || '';
    this.alunoGeneroOutro = !this.generosOpcoes.some(g => g.value === m.alunoGenero);
    this.alunoGeneroCustom = this.alunoGeneroOutro ? m.alunoGenero : '';
    
    this.respGeneroSelecionado = m.respGenero || '';
    this.respGeneroOutro = !this.generosOpcoes.some(g => g.value === m.respGenero);
    this.respGeneroCustom = this.respGeneroOutro ? m.respGenero : '';
    
    // Converte período para o formato de valor (matutino, vespertino, etc)
    if (this.edicao && this.edicao.periodo) {
      this.edicao.periodo = this.periodosLabelReverso[this.edicao.periodo] || this.edicao.periodo;
    }
    
    this.cdr.markForCheck();
  }

  voltarLista(): void {
    this.view = 'lista';
    this.selecionado = null;
    this.edicao = null;
    this.modoEdicao = false;
    this.cdr.markForCheck();
  }

  selecionarSecao(secaoId: string): void {
    this.secaoAtiva = secaoId;
    this.cdr.markForCheck();
  }

  mudarAba(aba: DetalheTab): void {
    this.activeTab = aba;
    // Definir seção inicial ao trocar de aba
    if (aba === 'educando') {
      this.secaoAtiva = 'identificacao-educando';
    } else if (aba === 'responsavel') {
      this.secaoAtiva = 'identificacao-responsavel';
    } else {
      this.secaoAtiva = '';
    }
    this.cdr.markForCheck();
  }

  novaMatricula(): void {
    this.router.navigate(['/matricula/nova']);
  }

  rematricular(m: MatriculaRegistro): void {
    this.router.navigate(['/matricula/nova'], { state: { rematricula: m } });
  }

  // Ações de detalhe
  iniciarEdicao(): void {
    this.modoEdicao = true;
    
    // Carrega séries se ano letivo está definido
    if (this.edicao?.anoLetivo) {
      this.computarSeries();
    }
    
    // Carrega períodos se série está definida
    if (this.edicao?.anoLetivo && this.edicao?.serie) {
      this.computarPeriodos();
    }
    
    // Carrega turmas se período está definido
    if (this.edicao?.anoLetivo && this.edicao?.serie && this.edicao?.periodo) {
      this.carregarTurmasEdicao();
    }
    
    this.cdr.markForCheck();
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
    
    // Determina o gênero final (customizado ou selecionado)
    const generoEducando = this.alunoGeneroOutro ? this.alunoGeneroCustom : this.alunoGeneroSelecionado;
    const generoResponsavel = this.respGeneroOutro ? this.respGeneroCustom : this.respGeneroSelecionado;
    
    const payload = {
      educando: {
        nomeCompleto:   this.edicao.alunoNome,
        dataNascimento: this.edicao.alunoNascimento,
        idade:          this.edicao.alunoIdade,
        genero:         generoEducando || this.edicao.alunoGenero,
        cor:            this.edicao.alunoCorRaca,
        cpf:            this.edicao.alunoCpf,
        rg:             this.edicao.alunoRg,
        email:          this.edicao.alunoEmail,
        telefone:       this.edicao.alunoTelefone,
        endereco:       this.edicao.alunoEndereco,
      },
      responsavel: this.edicao.respNome ? {
        idMatricula:    this.edicao.id,
        nomeCompleto:   this.edicao.respNome,
        dataNascimento: this.edicao.respNascimento,
        genero:         generoResponsavel || this.edicao.respGenero,
        cpf:            this.edicao.respCpf,
        rg:             this.edicao.respRg,
        email:          this.edicao.respEmail,
        telefone:       this.edicao.respTelefone,
        endereco:       this.edicao.respEndereco,
      } : undefined,
      dadosEscolares: {
        anoLetivo:      this.edicao.anoLetivo,
        serie:          this.edicao.serie,
        periodo:        this.edicao.periodo,
        codigoTurma:    this.edicao.codigoTurma,
        turma:          this.edicao.turma,
        sala:           this.edicao.sala,
        dataInicio:     this.edicao.dataInicio,
        dataTermino:    this.edicao.dataTermino,
      }
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

  // Métodos de formatação para visualização
  formatarCpf(cpf: string | undefined): string {
    if (!cpf) return '-';
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11) return cpf;
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  formatarRg(rg: string | undefined): string {
    if (!rg) return '-';
    const limpo = rg.replace(/[^\dXx]/g, '');
    if (limpo.length < 8) return rg;
    if (limpo.length === 9) {
      return limpo.replace(/(\d{2})(\d{3})(\d{3})([\dXx])/, '$1.$2.$3-$4');
    }
    return rg;
  }

  formatarTelefone(telefone: string | undefined): string {
    if (!telefone) return '-';
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }

  formatarCep(cep: string | undefined): string {
    if (!cep) return '-';
    const numeros = cep.replace(/\D/g, '');
    if (numeros.length !== 8) return cep;
    return numeros.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  statusClass(status: StatusMatricula): string {
    const map: Record<StatusMatricula, string> = {
      'Ativa': 'status-ativa',
      'Concluída': 'status-concluida',
      'Abandonada': 'status-abandonada',
      'Transferida': 'status-transferida',
    };
    return map[status] ?? '';
  }

  getSituacao(m: MatriculaRegistro): 'Aprovado' | 'Reprovado' | 'Em andamento' {
    // Se a matrícula foi abandonada, consideramos como situação indefinida (em andamento)
    if (m.status === 'Abandonada') {
      return 'Em andamento';
    }

    // Verifica se o período letivo já terminou
    const hoje = new Date();
    const dataTermino = new Date(m.dataTermino);
    const periodoAtivo = hoje <= dataTermino;

    // Se o período ainda está ativo, está em andamento
    if (periodoAtivo) {
      return 'Em andamento';
    }

    // Se não tem histórico, consideramos em andamento
    if (!m.historico || m.historico.length === 0) {
      return 'Em andamento';
    }

    // Procura o histórico do ano letivo atual da matrícula
    const historicoAtual = m.historico.find(h => h.anoLetivo === m.anoLetivo);
    
    if (!historicoAtual) {
      return 'Em andamento';
    }

    // Se o histórico já tem uma situação definida, usa ela
    if (historicoAtual.situacao === 'Aprovado' || historicoAtual.situacao === 'Reprovado') {
      return historicoAtual.situacao;
    }

    // Se não tem disciplinas, considera em andamento
    if (!historicoAtual.disciplinas || historicoAtual.disciplinas.length === 0) {
      return 'Em andamento';
    }

    // Verifica se todas as disciplinas têm situação definida
    const todasDefinidas = historicoAtual.disciplinas.every(d => 
      d.situacao === 'Aprovado' || d.situacao === 'Reprovado'
    );

    if (!todasDefinidas) {
      return 'Em andamento';
    }

    // Se alguma disciplina foi reprovada, o educando foi reprovado
    const temReprovacao = historicoAtual.disciplinas.some(d => d.situacao === 'Reprovado');
    
    return temReprovacao ? 'Reprovado' : 'Aprovado';
  }

  situacaoClass(situacao: 'Aprovado' | 'Reprovado' | 'Em andamento' | 'Transferido'): string {
    const map = {
      'Aprovado': 'situacao-aprovado',
      'Reprovado': 'situacao-reprovado',
      'Em andamento': 'situacao-andamento',
      'Transferido': 'situacao-transferido',
    };
    return map[situacao] ?? '';
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

  // Exclusão de matrícula
  modalExclusaoVisible = false;
  matriculaExclusao: MatriculaRegistro | null = null;

  abrirModalExclusao(m: MatriculaRegistro, event: Event): void {
    event.stopPropagation();
    this.matriculaExclusao = m;
    this.modalExclusaoVisible = true;
    this.cdr.markForCheck();
  }

  confirmarExclusao(): void {
    if (!this.matriculaExclusao) return;
    const id = this.matriculaExclusao.idMatricula;
    this.modalExclusaoVisible = false;
    
    this.http.delete(`${environment.apiUrl}/matricula/${id}`).subscribe({
      next: () => {
        // Remove da lista local
        const idx = this.matriculas.findIndex(m => m.idMatricula === id);
        if (idx !== -1) {
          this.matriculas.splice(idx, 1);
        }
        // Remove da seleção se estava selecionada
        if (this.matriculaExclusao) {
          this.selecionados.delete(this.matriculaExclusao.id);
        }
        this.matriculaExclusao = null;
        this.recalcularTudo();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao excluir matrícula:', err);
        this.matriculaExclusao = null;
        this.cdr.markForCheck();
      },
    });
  }

  cancelarExclusao(): void {
    this.modalExclusaoVisible = false;
    this.matriculaExclusao = null;
    this.cdr.markForCheck();
  }

  // Gênero (edição)
  onAlunoGeneroChange(valor: string): void {
    this.alunoGeneroOutro = valor === 'outro';
    if (!this.alunoGeneroOutro) {
      this.alunoGeneroCustom = '';
    }
    if (this.edicao) {
      this.edicao.alunoGenero = valor;
    }
    this.cdr.markForCheck();
  }

  onRespGeneroChange(valor: string): void {
    this.respGeneroOutro = valor === 'outro';
    if (!this.respGeneroOutro) {
      this.respGeneroCustom = '';
    }
    if (this.edicao) {
      this.edicao.respGenero = valor;
    }
    this.cdr.markForCheck();
  }

  // Cascata de turmas (edição)
  private computarSeries(): void {
    if (!this.edicao?.anoLetivo) { 
      this.seriesDisponiveis = []; 
      return; 
    }
    this.http.get<string[]>(`${environment.apiUrl}/matricula/series?anoLetivo=${this.edicao.anoLetivo}`)
      .subscribe({ 
        next: (series) => { 
          this.seriesDisponiveis = series;
          this.cdr.markForCheck();
        } 
      });
  }

  private computarPeriodos(): void {
    if (!this.edicao?.anoLetivo || !this.edicao?.serie) { 
      this.periodosDisponiveis = []; 
      return; 
    }
    const params = `anoLetivo=${encodeURIComponent(this.edicao.anoLetivo)}&serie=${encodeURIComponent(this.edicao.serie)}`;
    this.http.get<string[]>(`${environment.apiUrl}/matricula/periodos?${params}`)
      .subscribe({
        next: (periodos) => {
          this.periodosDisponiveis = periodos.map(p => ({ 
            value: p, 
            label: this.periodosLabel[p] ?? p 
          }));
          this.cdr.markForCheck();
        },
      });
  }

  private carregarTurmasEdicao(): void {
    if (!this.edicao?.anoLetivo || !this.edicao?.serie || !this.edicao?.periodo) { 
      this.turmasDisponiveis = []; 
      return; 
    }
    this.turmasCarregando = true;
    const params = `anoLetivo=${encodeURIComponent(this.edicao.anoLetivo)}&serie=${encodeURIComponent(this.edicao.serie)}&periodo=${encodeURIComponent(this.edicao.periodo)}`;
    this.http.get<TurmaBackend[]>(`${environment.apiUrl}/matricula/turmas?${params}`)
      .subscribe({
        next: (turmasBackend) => {
          this.turmasDisponiveis = turmasBackend.map(t => ({
            codigo:       t.codTurma,
            nome:         t.nomeTurma,
            anoLetivo:    String(t.anoLetivo),
            serie:        t.serie,
            periodo:      t.periodo,
            sala:         t.nomeSala ?? '',
            dataInicio:   t.dataInicio ?? '',
            dataTermino:  t.dataFim ?? '',
            vagasOcupadas: t.vagasOcupadas ?? [],
          }));
          this.turmasCarregando = false;
          this.cdr.markForCheck();
        },
        error: () => { 
          this.turmasCarregando = false; 
          this.cdr.markForCheck();
        },
      });
  }

  onAnoLetivoChange(): void {
    if (!this.edicao) return;
    this.edicao.serie = '';
    this.edicao.periodo = '';
    this.edicao.codigoTurma = '';
    this.edicao.turma = '';
    this.edicao.dataInicio = '';
    this.edicao.dataTermino = '';
    this.edicao.sala = '';
    this.turmasDisponiveis = [];
    this.periodosDisponiveis = [];
    this.computarSeries();
  }

  onSerieChange(): void {
    if (!this.edicao) return;
    this.edicao.periodo = '';
    this.edicao.codigoTurma = '';
    this.edicao.turma = '';
    this.edicao.dataInicio = '';
    this.edicao.dataTermino = '';
    this.edicao.sala = '';
    this.turmasDisponiveis = [];
    this.computarPeriodos();
  }

  onPeriodoChange(): void {
    if (!this.edicao) return;
    this.edicao.codigoTurma = '';
    this.edicao.turma = '';
    this.edicao.dataInicio = '';
    this.edicao.dataTermino = '';
    this.edicao.sala = '';
    this.carregarTurmasEdicao();
  }

  onTurmaChange(): void {
    if (!this.edicao || !this.edicao.codigoTurma) return;
    const turma = this.turmasDisponiveis.find(t => t.codigo === this.edicao!.codigoTurma);
    if (turma) {
      this.edicao.turma = turma.nome;
      this.edicao.sala = turma.sala;
      this.edicao.dataInicio = turma.dataInicio;
      this.edicao.dataTermino = turma.dataTermino;
      this.cdr.markForCheck();
    }
  }

  getPeriodoLabel(periodo: string): string {
    if (!periodo) return '-';
    return this.periodosLabel[periodo] || periodo;
  }

  // Busca de CEP
  buscarCepAluno(): void {
    if (!this.edicao) return;
    const cep = this.edicao.alunoEndereco.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    this.cepLoadingAluno = true;
    this.cepErroAluno = false;
    this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: (data) => {
        this.cepLoadingAluno = false;
        if (data.erro) { 
          this.cepErroAluno = true; 
          return; 
        }
        if (this.edicao) {
          this.edicao.alunoEndereco.logradouro = data.logradouro;
          this.edicao.alunoEndereco.bairro = data.bairro;
          this.edicao.alunoEndereco.uf = data.uf;
          this.edicao.alunoEndereco.cidade = data.localidade;
          if (!this.edicao.alunoEndereco.complemento) {
            this.edicao.alunoEndereco.complemento = data.complemento;
          }
          this.cdr.markForCheck();
        }
      },
      error: () => { 
        this.cepLoadingAluno = false; 
        this.cepErroAluno = true;
        this.cdr.markForCheck();
      }
    });
  }

  buscarCepResp(): void {
    if (!this.edicao) return;
    const cep = this.edicao.respEndereco.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    this.cepLoadingResp = true;
    this.cepErroResp = false;
    this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: (data) => {
        this.cepLoadingResp = false;
        if (data.erro) { 
          this.cepErroResp = true; 
          return; 
        }
        if (this.edicao) {
          this.edicao.respEndereco.logradouro = data.logradouro;
          this.edicao.respEndereco.bairro = data.bairro;
          this.edicao.respEndereco.uf = data.uf;
          this.edicao.respEndereco.cidade = data.localidade;
          if (!this.edicao.respEndereco.complemento) {
            this.edicao.respEndereco.complemento = data.complemento;
          }
          this.cdr.markForCheck();
        }
      },
      error: () => { 
        this.cepLoadingResp = false; 
        this.cepErroResp = true;
        this.cdr.markForCheck();
      }
    });
  }

  toggleSameAddress(): void {
    if (!this.edicao) return;
    if (this.useSameAddress) {
      this.edicao.respEndereco = { ...this.edicao.alunoEndereco };
      this.cepErroResp = false;
      this.cepLoadingResp = false;
    } else {
      this.edicao.respEndereco = { 
        cep: '', 
        logradouro: '', 
        numero: '', 
        complemento: '', 
        bairro: '', 
        uf: '', 
        cidade: '' 
      };
    }
    this.cdr.markForCheck();
  }

  mascaraCep(event: Event): void {
    const el = event.target as HTMLInputElement;
    let v = el.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) v = v.replace(/(\d{5})(\d{0,3})/, '$1-$2');
    el.value = v;
    if (this.edicao) {
      const campo = el.name as 'alunoCep' | 'respCep';
      if (campo === 'alunoCep') {
        this.edicao.alunoEndereco.cep = v;
      } else if (campo === 'respCep') {
        this.edicao.respEndereco.cep = v;
      }
    }
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
    this.filtroSituacao = '';
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

  onItensPorPaginaChange(): void {
    this.paginaAtual = 1;
    this.recalcularTudo();
    this.cdr.markForCheck();
  }

  get paginasVisiveis(): number[] {
    if (this.totalPaginas <= 7) {
      return this.paginas;
    }

    const atual = this.paginaAtual;
    const total = this.totalPaginas;
    const resultado: number[] = [];

    if (atual <= 4) {
      // Início: 1 2 3 4 5 ... 10
      for (let i = 1; i <= 5; i++) resultado.push(i);
      resultado.push(-1); // reticências
      resultado.push(total);
    } else if (atual >= total - 3) {
      // Fim: 1 ... 6 7 8 9 10
      resultado.push(1);
      resultado.push(-1);
      for (let i = total - 4; i <= total; i++) resultado.push(i);
    } else {
      // Meio: 1 ... 4 5 6 ... 10
      resultado.push(1);
      resultado.push(-1);
      for (let i = atual - 1; i <= atual + 1; i++) resultado.push(i);
      resultado.push(-1);
      resultado.push(total);
    }

    return resultado;
  }

  readonly Math = Math;
}
