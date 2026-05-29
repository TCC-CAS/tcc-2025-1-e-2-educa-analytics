import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Evento {
  id: number;
  nomeEvento: string;
  dataEvento: string;
  horarioEvento: string;
  serieEscolar: string;
  descricao: string;
  selected?: boolean;
}

@Component({
  selector: 'app-eventos-list',
  templateUrl: './eventos-list.component.html',
  styleUrls: ['./eventos-list.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class EventosListComponent implements OnInit {
  eventos: Evento[] = [];
  eventosFiltrados: Evento[] = [];

  // Filtros
  filtroNome    = '';
  filtroData    = '';
  filtroHorario = '';
  filtroSerie   = '';

  // Seleção
  todosSelecionados = false;

  // Mensagem
  message     = '';
  messageType: 'success' | 'error' = 'success';

  // Modal de confirmação
  confirm = { visible: false, title: '', message: '', danger: false, callback: () => {} };

  // Paginação
  paginaAtual     = 1;
  itensPorPagina  = 10;
  readonly Math   = Math;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.carregarEventos();
  }

  carregarEventos(): void {
    this.eventos = [
      {
        id: 1,
        nomeEvento: 'Feira de Ciências',
        dataEvento: '2026-03-15',
        horarioEvento: '14:00',
        serieEscolar: '6º Ano',
        descricao: 'Apresentação de projetos científicos dos alunos'
      },
      {
        id: 2,
        nomeEvento: 'Reunião de Pais',
        dataEvento: '2026-03-20',
        horarioEvento: '18:30',
        serieEscolar: '7º Ano',
        descricao: 'Reunião com pais e responsáveis sobre o desempenho dos alunos'
      },
      {
        id: 3,
        nomeEvento: 'Olimpíada de Matemática',
        dataEvento: '2026-04-10',
        horarioEvento: '09:00',
        serieEscolar: '8º Ano',
        descricao: 'Competição de matemática entre turmas'
      }
    ];
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.paginaAtual = 1;
    this.eventosFiltrados = this.eventos.filter(e => {
      const matchNome    = !this.filtroNome    || e.nomeEvento.toLowerCase().includes(this.filtroNome.toLowerCase());
      const matchData    = !this.filtroData    || e.dataEvento === this.filtroData;
      const matchHorario = !this.filtroHorario || e.horarioEvento.includes(this.filtroHorario);
      const matchSerie   = !this.filtroSerie   || e.serieEscolar.toLowerCase().includes(this.filtroSerie.toLowerCase());
      return matchNome && matchData && matchHorario && matchSerie;
    });
  }

  limparFiltros(): void {
    this.filtroNome = '';
    this.filtroData = '';
    this.filtroHorario = '';
    this.filtroSerie = '';
    this.aplicarFiltros();
  }

  get filtrosAtivos(): number {
    return (this.filtroNome ? 1 : 0) + (this.filtroData ? 1 : 0) +
           (this.filtroHorario ? 1 : 0) + (this.filtroSerie ? 1 : 0);
  }

  // Seleção
  get algumSelecionado(): boolean { return this.eventosFiltrados.some(e => e.selected); }
  get quantidadeSelecionados(): number { return this.eventosFiltrados.filter(e => e.selected).length; }

  toggleTodos(): void {
    this.eventosFiltrados.forEach(e => e.selected = this.todosSelecionados);
  }

  toggleEvento(): void {
    this.todosSelecionados = this.eventosFiltrados.every(e => e.selected);
  }

  limparSelecao(): void {
    this.eventosFiltrados.forEach(e => e.selected = false);
    this.todosSelecionados = false;
  }

  // Paginação
  get totalPaginas(): number {
    return Math.ceil(this.eventosFiltrados.length / this.itensPorPagina);
  }

  get eventosPaginados(): Evento[] {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    return this.eventosFiltrados.slice(inicio, inicio + this.itensPorPagina);
  }

  get paginasVisiveis(): number[] {
    const total = this.totalPaginas;
    const atual = this.paginaAtual;
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(2, atual - delta); i <= Math.min(total - 1, atual + delta); i++) {
      range.push(i);
    }
    if (atual - delta > 2) range.unshift(-1);
    if (atual + delta < total - 1) range.push(-1);
    range.unshift(1);
    if (total > 1) range.push(total);
    return range;
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) this.paginaAtual = pagina;
  }

  onItensPorPaginaChange(): void { this.paginaAtual = 1; }

  trackByIndex(i: number): number { return i; }

  // CRUD
  novo(): void { this.router.navigate(['/eventos/novo']); }

  editar(id: number): void { this.router.navigate([`/eventos/${id}/editar`]); }

  excluir(evento: Evento): void {
    this.openConfirm(
      'Excluir evento',
      `Tem certeza que deseja excluir o evento "${evento.nomeEvento}"? Esta ação não pode ser desfeita.`,
      true,
      () => {
        this.eventos = this.eventos.filter(e => e.id !== evento.id);
        this.aplicarFiltros();
        this.showMessage(`Evento "${evento.nomeEvento}" excluído com sucesso.`, 'success');
      }
    );
  }

  excluirSelecionados(): void {
    const n = this.quantidadeSelecionados;
    this.openConfirm(
      'Excluir eventos',
      `Tem certeza que deseja excluir ${n} evento(s) selecionado(s)? Esta ação não pode ser desfeita.`,
      true,
      () => {
        this.eventos = this.eventos.filter(e => !e.selected);
        this.aplicarFiltros();
        this.todosSelecionados = false;
        this.showMessage(`${n} evento(s) excluído(s) com sucesso.`, 'success');
      }
    );
  }

  openConfirm(title: string, message: string, danger: boolean, callback: () => void): void {
    this.confirm = { visible: true, title, message, danger, callback };
  }

  confirmAction(): void { this.confirm.visible = false; this.confirm.callback(); }
  cancelConfirm(): void  { this.confirm.visible = false; }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message     = msg;
    this.messageType = type;
  }
}
