import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.carregarColaboradores();
  }

  carregarColaboradores(): void {
    this.colaboradores = [
      {
        id: 1,
        matriculaFuncional: 'EDU-00001',
        nomeCompleto: 'Carlos Eduardo Ferreira',
        cargo: 'Professor de Matemática',
        tipo: 'educador',
        status: 'ativo'
      },
      {
        id: 2,
        matriculaFuncional: 'EDU-00002',
        nomeCompleto: 'Fernanda Alves Lima',
        cargo: 'Professora de Português',
        tipo: 'educador',
        status: 'ativo'
      },
      {
        id: 3,
        matriculaFuncional: 'COL-00001',
        nomeCompleto: 'Maria Santos Costa',
        cargo: 'Secretária Escolar',
        tipo: 'colaborador',
        status: 'ativo'
      },
      {
        id: 4,
        matriculaFuncional: 'COL-00002',
        nomeCompleto: 'João Silva Pereira',
        cargo: 'Auxiliar Administrativo',
        tipo: 'colaborador',
        status: 'ativo'
      },
      {
        id: 5,
        matriculaFuncional: 'COL-00003',
        nomeCompleto: 'Ana Oliveira Lima',
        cargo: 'Bibliotecária',
        tipo: 'colaborador',
        status: 'inativo'
      },
      {
        id: 6,
        matriculaFuncional: 'DIR-00001',
        nomeCompleto: 'Roberto Mendes Souza',
        cargo: 'Diretor Geral',
        tipo: 'diretor',
        status: 'ativo'
      }
    ];
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
    this.aplicarFiltros();
  }

  novo(): void {
    this.router.navigate(['/colaboradores/novo']);
  }

  novoEducador(): void {
    this.router.navigate(['/educadores/novo']);
  }

  editar(id: number): void {
    this.router.navigate([`/colaboradores/${id}/editar`]);
  }

  excluir(colaborador: Colaborador): void {
    if (confirm(`Tem certeza que deseja excluir ${colaborador.nomeCompleto}?`)) {
      this.colaboradores = this.colaboradores.filter(c => c.id !== colaborador.id);
      this.aplicarFiltros();
      this.verificarSelecao();
    }
  }

  ativar(colaborador: Colaborador): void {
    colaborador.status = 'ativo';
  }

  desativar(colaborador: Colaborador): void {
    colaborador.status = 'inativo';
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
      selecionados.forEach(c => {
        if (this.acaoLote === 'ativar') c.status = 'ativo';
        else if (this.acaoLote === 'desativar') c.status = 'inativo';
        else this.colaboradores = this.colaboradores.filter(x => x.id !== c.id);
      });
      this.aplicarFiltros();
      this.todosSelecionados = false;
      this.acaoLote = '';
      this.verificarSelecao();
    }
  }
}
