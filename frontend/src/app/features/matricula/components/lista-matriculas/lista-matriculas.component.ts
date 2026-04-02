import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

export type DetalheTab = 'educando' | 'responsavel' | 'escolar' | 'historico';
export type StatusMatricula = 'Ativa' | 'Inativa' | 'Cancelada' | 'Abandono Escolar';

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

@Component({
  selector: 'app-lista-matriculas',
  templateUrl: './lista-matriculas.component.html',
  styleUrls: ['./lista-matriculas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class ListaMatriculasComponent implements OnInit, AfterViewInit {

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

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

  // Filtros───
  filtroNome = '';
  filtroSerie = '';
  filtroTurma = '';
  filtroAno = '';
  filtroStatus = '';
  filtroPeriodo = '';

  // Paginação─
  itensPorPagina = 10;
  paginaAtual = 1;

  // Listas cacheadas (atualizadas apenas quando necessário)
  matriculasFiltradas: MatriculaRegistro[] = [];
  matriculasPaginadas: MatriculaRegistro[] = [];
  paginas: number[] = [];
  totalPaginas = 1;
  turmasUnicas: string[] = [];
  anosUnicos: string[] = [];

  // Registro selecionado ─
  selecionado: MatriculaRegistro | null = null;
  edicao: MatriculaRegistro | null = null;

  readonly series = [
    '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano',
    '6º Ano', '7º Ano', '8º Ano', '9º Ano'
  ];

  readonly statusList: StatusMatricula[] = ['Ativa', 'Inativa', 'Cancelada', 'Abandono Escolar'];

  // Dados mock
  matriculas: MatriculaRegistro[] = [
    {
      id: 1,
      status: 'Ativa',
      dataMatricula: '2025-02-10',
      alunoNome: 'Ana Clara Oliveira',
      alunoNascimento: '2015-04-12',
      alunoIdade: 9,
      alunoGenero: 'Feminino (ela/dela)',
      alunoCorRaca: 'Parda',
      alunoCpf: '123.456.789-00',
      alunoRg: '1234567',
      alunoEmail: '',
      alunoCelular: '',
      alunoTelefone: '',
      alunoEndereco: { cep: '01310-100', logradouro: 'Av. Paulista', numero: '1000', complemento: 'Apto 12', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP' },
      respNome: 'Maria Oliveira',
      respNascimento: '1985-08-20',
      respIdade: 40,
      respGenero: 'Feminino (ela/dela)',
      respCorRaca: 'Parda',
      respCpf: '987.654.321-00',
      respRg: '7654321',
      respEmail: 'maria.oliveira@email.com',
      respCelular: '(11) 98765-4321',
      respTelefone: '',
      respParentesco: 'Mãe',
      respEndereco: { cep: '01310-100', logradouro: 'Av. Paulista', numero: '1000', complemento: 'Apto 12', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP' },
      serie: '4º Ano',
      turma: '4A - Quarto Ano A',
      codigoTurma: '4A',
      anoLetivo: '2025',
      dataInicio: '2025-02-03',
      dataTermino: '2025-12-19',
      periodo: 'Manhã',
      sala: 'Sala 101',
      historico: [
        {
          anoLetivo: '2024', serie: '3º Ano', turma: '3A', sala: 'Sala 101', periodo: 'Manhã', situacao: 'Aprovado',
          mediaGeral: 8.2, frequencia: 94,
          disciplinas: [
            { nome: 'Português',    n1: 8.0, n2: 7.5, n3: 9.0, n4: 8.5, media: 8.25, frequencia: 96, situacao: 'Aprovado' },
            { nome: 'Matemática',   n1: 7.0, n2: 8.0, n3: 8.5, n4: 9.0, media: 8.13, frequencia: 93, situacao: 'Aprovado' },
            { nome: 'Ciências',     n1: 9.0, n2: 8.5, n3: 8.0, n4: 8.5, media: 8.5,  frequencia: 95, situacao: 'Aprovado' },
            { nome: 'História',     n1: 7.5, n2: 8.0, n3: 7.0, n4: 8.0, media: 7.63, frequencia: 90, situacao: 'Aprovado' },
            { nome: 'Geografia',    n1: 8.0, n2: 8.5, n3: 9.0, n4: 8.0, media: 8.38, frequencia: 94, situacao: 'Aprovado' },
            { nome: 'Ed. Física',   n1: 10,  n2: 10,  n3: 9.5, n4: 10,  media: 9.88, frequencia: 98, situacao: 'Aprovado' },
          ]
        },
        {
          anoLetivo: '2023', serie: '2º Ano', turma: '2B', sala: 'Sala 205', periodo: 'Manhã', situacao: 'Aprovado',
          mediaGeral: 7.8, frequencia: 91,
          disciplinas: [
            { nome: 'Português',  n1: 7.0, n2: 7.5, n3: 8.0, n4: 8.5, media: 7.75, frequencia: 92, situacao: 'Aprovado' },
            { nome: 'Matemática', n1: 6.5, n2: 7.0, n3: 8.0, n4: 8.5, media: 7.5,  frequencia: 90, situacao: 'Aprovado' },
            { nome: 'Ciências',   n1: 8.0, n2: 8.0, n3: 8.5, n4: 8.0, media: 8.13, frequencia: 93, situacao: 'Aprovado' },
          ]
        }
      ]
    },
    {
      id: 2,
      status: 'Ativa',
      dataMatricula: '2025-02-12',
      alunoNome: 'Bruno Henrique Santos',
      alunoNascimento: '2014-11-03',
      alunoIdade: 10,
      alunoGenero: 'Masculino (ele/dele)',
      alunoCorRaca: 'Preta',
      alunoCpf: '234.567.890-11',
      alunoRg: '2345678',
      alunoEmail: '',
      alunoCelular: '',
      alunoTelefone: '',
      alunoEndereco: { cep: '04547-000', logradouro: 'Rua Funchal', numero: '200', complemento: '', bairro: 'Vila Olímpia', cidade: 'São Paulo', uf: 'SP' },
      respNome: 'Carlos Santos',
      respNascimento: '1980-03-15',
      respIdade: 44,
      respGenero: 'Masculino (ele/dele)',
      respCorRaca: 'Preta',
      respCpf: '111.222.333-44',
      respRg: '1112223',
      respEmail: 'carlos.santos@email.com',
      respCelular: '(11) 91234-5678',
      respTelefone: '(11) 3456-7890',
      respParentesco: 'Pai',
      respEndereco: { cep: '04547-000', logradouro: 'Rua Funchal', numero: '200', complemento: '', bairro: 'Vila Olímpia', cidade: 'São Paulo', uf: 'SP' },
      serie: '5º Ano',
      turma: '5A - Quinto Ano A',
      codigoTurma: '5A',
      anoLetivo: '2025',
      dataInicio: '2025-02-03',
      dataTermino: '2025-12-19',
      periodo: 'Tarde',
      sala: 'Sala 203',
      historico: [
        {
          anoLetivo: '2024', serie: '4º Ano', turma: '4B', sala: 'Sala 203', periodo: 'Tarde', situacao: 'Aprovado',
          mediaGeral: 7.1, frequencia: 88,
          disciplinas: [
            { nome: 'Português',    n1: 6.5, n2: 7.0, n3: 7.5, n4: 7.0, media: 7.0,  frequencia: 89, situacao: 'Aprovado' },
            { nome: 'Matemática',   n1: 5.0, n2: 6.0, n3: 7.0, n4: 7.5, media: 6.38, frequencia: 85, situacao: 'Aprovado' },
            { nome: 'Ciências',     n1: 7.0, n2: 7.5, n3: 8.0, n4: 7.5, media: 7.5,  frequencia: 90, situacao: 'Aprovado' },
          ]
        }
      ]
    },
    {
      id: 3,
      status: 'Inativa',
      dataMatricula: '2025-01-20',
      alunoNome: 'Layla Pereira Costa',
      alunoNascimento: '2016-07-28',
      alunoIdade: 8,
      alunoGenero: 'Feminino (ela/dela)',
      alunoCorRaca: 'Branca',
      alunoCpf: '345.678.901-22',
      alunoRg: '3456789',
      alunoEmail: '',
      alunoCelular: '',
      alunoTelefone: '',
      alunoEndereco: { cep: '20040-020', logradouro: 'Av. Rio Branco', numero: '45', complemento: 'Casa', bairro: 'Centro', cidade: 'Rio de Janeiro', uf: 'RJ' },
      respNome: 'Fernanda Costa',
      respNascimento: '1990-12-05',
      respIdade: 35,
      respGenero: 'Feminino (ela/dela)',
      respCorRaca: 'Branca',
      respCpf: '555.666.777-88',
      respRg: '5556667',
      respEmail: 'fernanda.costa@email.com',
      respCelular: '(21) 99876-5432',
      respTelefone: '',
      respParentesco: 'Mãe',
      respEndereco: { cep: '20040-020', logradouro: 'Av. Rio Branco', numero: '45', complemento: 'Casa', bairro: 'Centro', cidade: 'Rio de Janeiro', uf: 'RJ' },
      serie: '3º Ano',
      turma: '3B - Terceiro Ano B',
      codigoTurma: '3B',
      anoLetivo: '2025',
      dataInicio: '2025-02-03',
      dataTermino: '2025-12-19',
      periodo: 'Manhã',
      sala: 'Sala 105',
      historico: [
        {
          anoLetivo: '2024', serie: '2º Ano', turma: '2A', sala: 'Sala 102', periodo: 'Manhã', situacao: 'Aprovado',
          mediaGeral: 8.9, frequencia: 97,
          disciplinas: [
            { nome: 'Português',  n1: 9.0, n2: 9.0, n3: 8.5, n4: 9.5, media: 9.0, frequencia: 98, situacao: 'Aprovado' },
            { nome: 'Matemática', n1: 8.5, n2: 9.0, n3: 8.5, n4: 9.0, media: 8.75, frequencia: 96, situacao: 'Aprovado' },
          ]
        }
      ]
    },
    {
      id: 4,
      status: 'Ativa',
      dataMatricula: '2025-02-14',
      alunoNome: 'Miguel Ribeiro Alves',
      alunoNascimento: '2013-09-18',
      alunoIdade: 11,
      alunoGenero: 'Masculino (ele/dele)',
      alunoCorRaca: 'Parda',
      alunoCpf: '456.789.012-33',
      alunoRg: '4567890',
      alunoEmail: '',
      alunoCelular: '',
      alunoTelefone: '',
      alunoEndereco: { cep: '30130-110', logradouro: 'Av. Afonso Pena', numero: '3000', complemento: '', bairro: 'Centro', cidade: 'Belo Horizonte', uf: 'MG' },
      respNome: 'Roberto Alves',
      respNascimento: '1975-01-30',
      respIdade: 49,
      respGenero: 'Masculino (ele/dele)',
      respCorRaca: 'Parda',
      respCpf: '222.333.444-55',
      respRg: '2223334',
      respEmail: 'roberto.alves@email.com',
      respCelular: '(31) 98888-7777',
      respTelefone: '(31) 3222-3333',
      respParentesco: 'Pai',
      respEndereco: { cep: '30130-110', logradouro: 'Av. Afonso Pena', numero: '3000', complemento: '', bairro: 'Centro', cidade: 'Belo Horizonte', uf: 'MG' },
      serie: '6º Ano',
      turma: '6A - Sexto Ano A',
      codigoTurma: '6A',
      anoLetivo: '2025',
      dataInicio: '2025-02-03',
      dataTermino: '2025-12-19',
      periodo: 'Manhã',
      sala: 'Sala 302',
      historico: []
    },
    {
      id: 5,
      status: 'Cancelada',
      dataMatricula: '2025-01-15',
      alunoNome: 'Sofia Lins Teixeira',
      alunoNascimento: '2012-03-22',
      alunoIdade: 12,
      alunoGenero: 'Feminino (ela/dela)',
      alunoCorRaca: 'Branca',
      alunoCpf: '567.890.123-44',
      alunoRg: '5678901',
      alunoEmail: '',
      alunoCelular: '',
      alunoTelefone: '',
      alunoEndereco: { cep: '40020-010', logradouro: 'Rua Chile', numero: '10', complemento: 'Bl A', bairro: 'Centro', cidade: 'Salvador', uf: 'BA' },
      respNome: 'Patricia Teixeira',
      respNascimento: '1982-06-14',
      respIdade: 43,
      respGenero: 'Feminino (ela/dela)',
      respCorRaca: 'Branca',
      respCpf: '333.444.555-66',
      respRg: '3334445',
      respEmail: 'patricia.teixeira@email.com',
      respCelular: '(71) 97777-6666',
      respTelefone: '',
      respParentesco: 'Mãe',
      respEndereco: { cep: '40020-010', logradouro: 'Rua Chile', numero: '10', complemento: 'Bl A', bairro: 'Centro', cidade: 'Salvador', uf: 'BA' },
      serie: '7º Ano',
      turma: '7A - Sétimo Ano A',
      codigoTurma: '7A',
      anoLetivo: '2025',
      dataInicio: '2025-01-15',
      dataTermino: '2025-12-19',
      periodo: 'Manhã',
      sala: 'Sala 401',
      historico: [
        {
          anoLetivo: '2024', serie: '6º Ano', turma: '6B', sala: 'Sala 304', periodo: 'Manhã', situacao: 'Aprovado',
          mediaGeral: 6.5, frequencia: 85,
          disciplinas: [
            { nome: 'Português',  n1: 6.0, n2: 6.5, n3: 7.0, n4: 6.5, media: 6.5, frequencia: 84, situacao: 'Aprovado' },
            { nome: 'Matemática', n1: 5.0, n2: 5.5, n3: 6.5, n4: 7.0, media: 6.0, frequencia: 82, situacao: 'Aprovado' },
          ]
        }
      ]
    },
  ];

  // Inicialização 
  ngOnInit(): void {
    this.recalcularTudo();
  }

  // Recálculo centralizado 
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

  // Ações de lista
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
    this.router.navigate(['/matricula']);
  }

  rematricular(m: MatriculaRegistro): void {
    this.router.navigate(['/matricula'], { state: { rematricula: m } });
  }

  // Ações de detalhe
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
    const idx = this.matriculas.findIndex(m => m.id === this.edicao!.id);
    if (idx !== -1) {
      this.matriculas[idx] = JSON.parse(JSON.stringify(this.edicao));
      this.selecionado = this.matriculas[idx];
    }
    this.modoEdicao = false;
    this.recalcularTudo();
    this.cdr.markForCheck();
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

  onNascimentoChange(campo: 'aluno' | 'resp'): void {
    if (!this.edicao) return;
    if (campo === 'aluno') {
      const idade = this.calcularIdade(this.edicao.alunoNascimento);
      this.edicao.alunoIdade = idade ?? 0;
    } else {
      const idade = this.calcularIdade(this.edicao.respNascimento);
      this.edicao.respIdade = idade ?? 0;
    }
  }

  statusClass(status: StatusMatricula): string {
    const map: Record<StatusMatricula, string> = {
      'Ativa': 'status-ativa',
      'Inativa': 'status-inativa',
      'Cancelada': 'status-cancelada',
      'Abandono Escolar': 'status-abandono',
    };
    return map[status] ?? '';
  }

  // Seleção em lote
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
    this.matriculas.forEach(m => {
      if (this.selecionados.has(m.id)) {
        m.status = this.statusLote;
      }
    });
    this.selecionados.clear();
    this.recalcularTudo();
    this.cdr.markForCheck();
  }

  cancelarLote(): void {
    this.modalLoteVisible = false;
  }

  // Alteração individual de status
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
    const idx = this.matriculas.findIndex(m => m.id === this.matriculaStatusEdit!.id);
    if (idx !== -1) {
      this.matriculas[idx].status = this.novoStatus;
    }
    this.matriculaStatusEdit = null;
    this.recalcularTudo();
    this.cdr.markForCheck();
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
