import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../../environments/environment';

type TipoColaborador = 'educador' | 'colaborador' | 'diretor';

interface Colaborador {
  id: number;
  matriculaFuncional: string;
  nomeCompleto: string;
  cargo: string;
  tipo: TipoColaborador;
  status: 'ativo' | 'inativo';
  selected?: boolean;
}

@Component({
  selector: 'app-colaboradores-list',
  templateUrl: './colaboradores-list.component.html',
  styleUrls: ['./colaboradores-list.component.scss']
})
export class ColaboradoresListComponent implements OnInit {
  colaboradores: Colaborador[] = [];
  colaboradoresFiltrados: Colaborador[] = [];
  loading = false;
  erro = '';

  // Filtros
  filtroMatricula: string = '';
  filtroNome: string = '';
  filtroCargo: string = '';
  filtroStatus: string = '';
  filtroTipo: string = '';

  // Seleção múltipla
  todosSelecionados: boolean = false;
  algumSelecionado: boolean = false;
  acaoLote: string = '';

  // Paginação
  paginaAtual: number = 1;
  itensPorPagina: number = 10;
  Math = Math;

  // Modais
  modalExclusaoVisible: boolean = false;
  colaboradorParaExcluir: Colaborador | null = null;
  modalLoteVisible: boolean = false;

  tipoLabel: Record<TipoColaborador, string> = {
    educador: 'Educador',
    colaborador: 'Colaborador',
    diretor: 'Diretor'
  };

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.carregarColaboradores();
  }

  carregarColaboradores(): void {
    this.loading = true;
    this.erro = '';
    this.http.get<Colaborador[]>(`${environment.apiUrl}/colaboradores`).subscribe({
      next: (dados) => {
        this.loading = false;
        this.colaboradores = dados;
        this.aplicarFiltros();
      },
      error: () => {
        this.loading = false;
        this.erro = 'Erro ao carregar colaboradores. Tente novamente.';
      }
    });
  }

  onFiltroChange(): void {
    this.paginaAtual = 1;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.colaboradoresFiltrados = this.colaboradores.filter(c => {
      const matchMatricula = !this.filtroMatricula ||
        c.matriculaFuncional.toLowerCase().includes(this.filtroMatricula.toLowerCase());
      const matchNome = !this.filtroNome ||
        c.nomeCompleto.toLowerCase().includes(this.filtroNome.toLowerCase());
      const matchCargo = !this.filtroCargo ||
        c.cargo.toLowerCase().includes(this.filtroCargo.toLowerCase());
      const matchStatus = !this.filtroStatus || c.status === this.filtroStatus;
      const matchTipo = !this.filtroTipo || c.tipo === this.filtroTipo;
      return matchMatricula && matchNome && matchCargo && matchStatus && matchTipo;
    });
  }

  limparFiltros(): void {
    this.filtroMatricula = '';
    this.filtroNome = '';
    this.filtroCargo = '';
    this.filtroStatus = '';
    this.filtroTipo = '';
    this.paginaAtual = 1;
    this.aplicarFiltros();
  }

  get filtrosAtivos(): number {
    return [this.filtroMatricula, this.filtroNome, this.filtroCargo, this.filtroStatus, this.filtroTipo].filter(Boolean).length;
  }

  get colaboradoresPaginados(): Colaborador[] {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    return this.colaboradoresFiltrados.slice(inicio, inicio + this.itensPorPagina);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.colaboradoresFiltrados.length / this.itensPorPagina));
  }

  get paginasVisiveis(): (number | -1)[] {
    const total = this.totalPaginas;
    const current = this.paginaAtual;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | -1)[] = [1];
    if (current > 3) pages.push(-1);
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  irParaPagina(pagina: number): void {
    this.paginaAtual = Math.max(1, Math.min(pagina, this.totalPaginas));
  }

  onItensPorPaginaChange(): void {
    this.paginaAtual = 1;
  }

  novo(): void {
    this.router.navigate(['/colaboradores/novo']);
  }

  editar(colaborador: Colaborador): void {
    const m = colaborador.matriculaFuncional;
    if (colaborador.tipo === 'educador') {
      this.router.navigate([`/educadores/${m}/editar`]);
    } else {
      this.router.navigate([`/colaboradores/${m}/editar`]);
    }
  }

  abrirModalExclusao(colaborador: Colaborador, event: Event): void {
    event.stopPropagation();
    this.colaboradorParaExcluir = colaborador;
    this.modalExclusaoVisible = true;
  }

  cancelarExclusao(): void {
    this.modalExclusaoVisible = false;
    this.colaboradorParaExcluir = null;
  }

  confirmarExclusao(): void {
    if (!this.colaboradorParaExcluir) { this.cancelarExclusao(); return; }
    this.http.delete(`${environment.apiUrl}/colaboradores/${this.colaboradorParaExcluir.matriculaFuncional}`).subscribe({
      next: () => { this.carregarColaboradores(); this.cancelarExclusao(); },
      error: () => { alert('Erro ao excluir. Tente novamente.'); this.cancelarExclusao(); }
    });
  }

  ativar(colaborador: Colaborador): void {
    this.http.patch(`${environment.apiUrl}/colaboradores/${colaborador.matriculaFuncional}/status`, { status: 'ativo' }).subscribe({
      next: () => { colaborador.status = 'ativo'; this.aplicarFiltros(); },
      error: () => alert('Erro ao ativar. Tente novamente.')
    });
  }

  desativar(colaborador: Colaborador): void {
    this.http.patch(`${environment.apiUrl}/colaboradores/${colaborador.matriculaFuncional}/status`, { status: 'inativo' }).subscribe({
      next: () => { colaborador.status = 'inativo'; this.aplicarFiltros(); },
      error: () => alert('Erro ao desativar. Tente novamente.')
    });
  }

  toggleTodos(): void {
    this.colaboradoresFiltrados.forEach(c => { c.selected = this.todosSelecionados; });
    this.verificarSelecao();
  }

  toggleColaborador(colaborador: Colaborador): void {
    colaborador.selected = !colaborador.selected;
    this.todosSelecionados = this.colaboradoresFiltrados.every(c => c.selected);
    this.verificarSelecao();
  }

  selecionarTodos(valor: boolean): void {
    this.todosSelecionados = valor;
    this.colaboradoresFiltrados.forEach(c => c.selected = valor);
    this.verificarSelecao();
  }

  verificarSelecao(): void {
    this.algumSelecionado = this.colaboradoresFiltrados.some(c => c.selected);
  }

  get quantidadeSelecionados(): number {
    return this.colaboradoresFiltrados.filter(c => c.selected).length;
  }

  abrirModalLote(): void {
    if (!this.acaoLote || this.quantidadeSelecionados === 0) return;
    this.modalLoteVisible = true;
  }

  cancelarLote(): void {
    this.modalLoteVisible = false;
  }

  confirmarLote(): void {
    const selecionados = this.colaboradoresFiltrados.filter(c => c.selected);
    const requests = selecionados.map(c => {
      if (this.acaoLote === 'excluir') {
        return this.http.delete(`${environment.apiUrl}/colaboradores/${c.matriculaFuncional}`);
      }
      return this.http.patch(`${environment.apiUrl}/colaboradores/${c.matriculaFuncional}/status`, { status: this.acaoLote });
    });
    forkJoin(requests).subscribe({
      next: () => {
        this.carregarColaboradores();
        this.todosSelecionados = false;
        this.acaoLote = '';
        this.cancelarLote();
      },
      error: () => { alert('Erro ao executar ação. Tente novamente.'); this.cancelarLote(); }
    });
  }

  trackById(index: number, item: Colaborador): number { return item.id; }
  trackByIndex(index: number): number { return index; }
}
