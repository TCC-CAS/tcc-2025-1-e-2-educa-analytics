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
  styleUrls: ['./colaboradores-list.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
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

  // Ação em lote
  acaoLote: string = '';

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
    this.aplicarFiltros();
  }

  novo(): void {
    this.router.navigate(['/colaboradores/novo']);
  }

  novoEducador(): void {
    this.router.navigate(['/educadores/novo']);
  }

  editar(colaborador: Colaborador): void {
    const m = colaborador.matriculaFuncional;
    if (colaborador.tipo === 'educador') {
      this.router.navigate([`/educadores/${m}/editar`]);
    } else {
      this.router.navigate([`/colaboradores/${m}/editar`]);
    }
  }

  excluir(colaborador: Colaborador): void {
    if (confirm(`Tem certeza que deseja excluir ${colaborador.nomeCompleto}?`)) {
      this.http.delete(`${environment.apiUrl}/colaboradores/${colaborador.matriculaFuncional}`).subscribe({
        next: () => this.carregarColaboradores(),
        error: () => alert('Erro ao excluir. Tente novamente.')
      });
    }
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

  toggleColaborador(): void {
    this.todosSelecionados = this.colaboradoresFiltrados.every(c => c.selected);
    this.verificarSelecao();
  }

  verificarSelecao(): void {
    this.algumSelecionado = this.colaboradoresFiltrados.some(c => c.selected);
  }

  get quantidadeSelecionados(): number {
    return this.colaboradoresFiltrados.filter(c => c.selected).length;
  }

  executarAcaoLote(): void {
    const selecionados = this.colaboradoresFiltrados.filter(c => c.selected);
    if (selecionados.length === 0) { alert('Selecione pelo menos um registro'); return; }
    if (!this.acaoLote) { alert('Selecione uma ação'); return; }
    const nomes = selecionados.map(c => c.nomeCompleto).join(', ');
    const msg = this.acaoLote === 'excluir'
      ? `Excluir: ${nomes}?`
      : `${this.acaoLote === 'ativar' ? 'Ativar' : 'Desativar'}: ${nomes}?`;
    if (confirm(msg)) {
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
        },
        error: () => alert('Erro ao executar ação. Tente novamente.')
      });
    }
  }
}
