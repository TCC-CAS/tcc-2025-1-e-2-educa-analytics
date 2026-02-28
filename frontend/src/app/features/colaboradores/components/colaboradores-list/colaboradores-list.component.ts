import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Colaborador {
  id: number;
  matriculaFuncional: string;
  nomeCompleto: string;
  cargo: string;
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
  
  // Filtros
  filtroMatricula: string = '';
  filtroNome: string = '';
  filtroCargo: string = '';
  filtroStatus: string = '';
  
  // Seleção múltipla
  todosSelecionados: boolean = false;
  algumSelecionado: boolean = false;
  
  // Ação em lote
  acaoLote: string = '';
  
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.carregarColaboradores();
  }

  carregarColaboradores(): void {
    // Mock data - substituir por chamada à API
    this.colaboradores = [
      { 
        id: 1, 
        matriculaFuncional: 'COL001', 
        nomeCompleto: 'Maria Santos Costa', 
        cargo: 'Secretária Escolar',
        status: 'ativo'
      },
      { 
        id: 2, 
        matriculaFuncional: 'COL002', 
        nomeCompleto: 'João Silva Pereira', 
        cargo: 'Auxiliar Administrativo',
        status: 'ativo'
      },
      { 
        id: 3, 
        matriculaFuncional: 'COL003', 
        nomeCompleto: 'Ana Oliveira Lima', 
        cargo: 'Bibliotecária',
        status: 'inativo'
      }
    ];
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.colaboradoresFiltrados = this.colaboradores.filter(colaborador => {
      const matchMatricula = !this.filtroMatricula || 
        colaborador.matriculaFuncional.toLowerCase().includes(this.filtroMatricula.toLowerCase());
      const matchNome = !this.filtroNome || 
        colaborador.nomeCompleto.toLowerCase().includes(this.filtroNome.toLowerCase());
      const matchCargo = !this.filtroCargo || 
        colaborador.cargo.toLowerCase().includes(this.filtroCargo.toLowerCase());
      const matchStatus = !this.filtroStatus || 
        colaborador.status === this.filtroStatus;
      
      return matchMatricula && matchNome && matchCargo && matchStatus;
    });
  }

  limparFiltros(): void {
    this.filtroMatricula = '';
    this.filtroNome = '';
    this.filtroCargo = '';
    this.filtroStatus = '';
    this.aplicarFiltros();
  }

  novo(): void {
    this.router.navigate(['/colaboradores/novo']);
  }

  editar(id: number): void {
    this.router.navigate([`/colaboradores/${id}/editar`]);
  }

  excluir(colaborador: Colaborador): void {
    if (confirm(`Tem certeza que deseja excluir o colaborador ${colaborador.nomeCompleto}?`)) {
      // Implementar chamada à API
      this.colaboradores = this.colaboradores.filter(c => c.id !== colaborador.id);
      this.aplicarFiltros();
      this.verificarSelecao();
    }
  }

  ativar(colaborador: Colaborador): void {
    colaborador.status = 'ativo';
    // Implementar chamada à API
  }

  desativar(colaborador: Colaborador): void {
    colaborador.status = 'inativo';
    // Implementar chamada à API
  }

  toggleTodos(): void {
    this.colaboradoresFiltrados.forEach(colaborador => {
      colaborador.selected = this.todosSelecionados;
    });
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
    
    if (selecionados.length === 0) {
      alert('Selecione pelo menos um colaborador');
      return;
    }

    if (!this.acaoLote) {
      alert('Selecione uma ação');
      return;
    }

    const nomes = selecionados.map(c => c.nomeCompleto).join(', ');
    let mensagem = '';

    switch(this.acaoLote) {
      case 'ativar':
        mensagem = `Tem certeza que deseja ativar os colaboradores: ${nomes}?`;
        break;
      case 'desativar':
        mensagem = `Tem certeza que deseja desativar os colaboradores: ${nomes}?`;
        break;
      case 'excluir':
        mensagem = `Tem certeza que deseja excluir os colaboradores: ${nomes}?`;
        break;
    }

    if (confirm(mensagem)) {
      selecionados.forEach(colaborador => {
        switch(this.acaoLote) {
          case 'ativar':
            colaborador.status = 'ativo';
            break;
          case 'desativar':
            colaborador.status = 'inativo';
            break;
          case 'excluir':
            this.colaboradores = this.colaboradores.filter(c => c.id !== colaborador.id);
            break;
        }
      });
      
      this.aplicarFiltros();
      this.todosSelecionados = false;
      this.acaoLote = '';
      this.verificarSelecao();
    }
  }
}
