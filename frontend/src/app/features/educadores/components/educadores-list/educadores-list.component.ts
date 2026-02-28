import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Educador {
  id: number;
  matriculaFuncional: string;
  nomeCompleto: string;
  disciplinaLecionada: string;
  turno: string;
  status: 'ativo' | 'inativo';
  selected?: boolean;
}

@Component({
  selector: 'app-educadores-list',
  templateUrl: './educadores-list.component.html',
  styleUrls: ['./educadores-list.component.scss']
})
export class EducadoresListComponent implements OnInit {
  educadores: Educador[] = [];
  educadoresFiltrados: Educador[] = [];
  
  // Filtros
  filtroMatricula: string = '';
  filtroNome: string = '';
  filtroDisciplina: string = '';
  filtroTurno: string = '';
  filtroStatus: string = '';
  
  // Seleção múltipla
  todosSelecionados: boolean = false;
  algumSelecionado: boolean = false;
  
  // Ação em lote
  acaoLote: string = '';
  
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.carregarEducadores();
  }

  carregarEducadores(): void {
    // Mock data - substituir por chamada à API
    this.educadores = [
      { 
        id: 1, 
        matriculaFuncional: 'EDU001', 
        nomeCompleto: 'Ana Paula Silva', 
        disciplinaLecionada: 'Matemática',
        turno: 'Matutino',
        status: 'ativo'
      },
      { 
        id: 2, 
        matriculaFuncional: 'EDU002', 
        nomeCompleto: 'Carlos Eduardo Santos', 
        disciplinaLecionada: 'Português',
        turno: 'Vespertino',
        status: 'ativo'
      },
      { 
        id: 3, 
        matriculaFuncional: 'EDU003', 
        nomeCompleto: 'Beatriz Oliveira', 
        disciplinaLecionada: 'História',
        turno: 'Matutino',
        status: 'inativo'
      }
    ];
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.educadoresFiltrados = this.educadores.filter(educador => {
      const matchMatricula = !this.filtroMatricula || 
        educador.matriculaFuncional.toLowerCase().includes(this.filtroMatricula.toLowerCase());
      const matchNome = !this.filtroNome || 
        educador.nomeCompleto.toLowerCase().includes(this.filtroNome.toLowerCase());
      const matchDisciplina = !this.filtroDisciplina || 
        educador.disciplinaLecionada.toLowerCase().includes(this.filtroDisciplina.toLowerCase());
      const matchTurno = !this.filtroTurno || 
        educador.turno === this.filtroTurno;
      const matchStatus = !this.filtroStatus || 
        educador.status === this.filtroStatus;
      
      return matchMatricula && matchNome && matchDisciplina && matchTurno && matchStatus;
    });
  }

  limparFiltros(): void {
    this.filtroMatricula = '';
    this.filtroNome = '';
    this.filtroDisciplina = '';
    this.filtroTurno = '';
    this.filtroStatus = '';
    this.aplicarFiltros();
  }

  novo(): void {
    this.router.navigate(['/educadores/novo']);
  }

  editar(id: number): void {
    this.router.navigate([`/educadores/${id}/editar`]);
  }

  excluir(educador: Educador): void {
    if (confirm(`Tem certeza que deseja excluir o educador ${educador.nomeCompleto}?`)) {
      // Implementar chamada à API
      this.educadores = this.educadores.filter(e => e.id !== educador.id);
      this.aplicarFiltros();
      this.verificarSelecao();
    }
  }

  ativar(educador: Educador): void {
    educador.status = 'ativo';
    // Implementar chamada à API
  }

  desativar(educador: Educador): void {
    educador.status = 'inativo';
    // Implementar chamada à API
  }

  toggleTodos(): void {
    this.educadoresFiltrados.forEach(educador => {
      educador.selected = this.todosSelecionados;
    });
    this.verificarSelecao();
  }

  toggleEducador(): void {
    this.todosSelecionados = this.educadoresFiltrados.every(e => e.selected);
    this.verificarSelecao();
  }

  verificarSelecao(): void {
    this.algumSelecionado = this.educadoresFiltrados.some(e => e.selected);
  }

  get quantidadeSelecionados(): number {
    return this.educadoresFiltrados.filter(e => e.selected).length;
  }

  executarAcaoLote(): void {
    const selecionados = this.educadoresFiltrados.filter(e => e.selected);
    
    if (selecionados.length === 0) {
      alert('Selecione pelo menos um educador');
      return;
    }

    if (!this.acaoLote) {
      alert('Selecione uma ação');
      return;
    }

    const nomes = selecionados.map(e => e.nomeCompleto).join(', ');
    let mensagem = '';

    switch(this.acaoLote) {
      case 'ativar':
        mensagem = `Tem certeza que deseja ativar os educadores: ${nomes}?`;
        break;
      case 'desativar':
        mensagem = `Tem certeza que deseja desativar os educadores: ${nomes}?`;
        break;
      case 'excluir':
        mensagem = `Tem certeza que deseja excluir os educadores: ${nomes}?`;
        break;
    }

    if (confirm(mensagem)) {
      selecionados.forEach(educador => {
        switch(this.acaoLote) {
          case 'ativar':
            educador.status = 'ativo';
            break;
          case 'desativar':
            educador.status = 'inativo';
            break;
          case 'excluir':
            this.educadores = this.educadores.filter(e => e.id !== educador.id);
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
