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
  styleUrls: ['./eventos-list.component.scss']
})
export class EventosListComponent implements OnInit {
  eventos: Evento[] = [];
  eventosFiltrados: Evento[] = [];
  
  // Filtros
  filtroNome: string = '';
  filtroData: string = '';
  filtroHorario: string = '';
  filtroSerie: string = '';
  
  // Seleção múltipla
  todosSelecionados: boolean = false;
  algumSelecionado: boolean = false;
  
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.carregarEventos();
  }

  carregarEventos(): void {
    // Mock data - substituir por chamada à API
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
    this.eventosFiltrados = this.eventos.filter(evento => {
      const matchNome = !this.filtroNome || 
        evento.nomeEvento.toLowerCase().includes(this.filtroNome.toLowerCase());
      const matchData = !this.filtroData || 
        evento.dataEvento === this.filtroData;
      const matchHorario = !this.filtroHorario || 
        evento.horarioEvento.includes(this.filtroHorario);
      const matchSerie = !this.filtroSerie || 
        evento.serieEscolar.toLowerCase().includes(this.filtroSerie.toLowerCase());
      
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

  novo(): void {
    this.router.navigate(['/eventos/novo']);
  }

  editar(id: number): void {
    this.router.navigate([`/eventos/${id}/editar`]);
  }

  excluir(evento: Evento): void {
    if (confirm(`Tem certeza que deseja excluir o evento "${evento.nomeEvento}"?`)) {
      // Implementar chamada à API
      this.eventos = this.eventos.filter(e => e.id !== evento.id);
      this.aplicarFiltros();
      this.verificarSelecao();
    }
  }

  toggleTodos(): void {
    this.eventosFiltrados.forEach(evento => {
      evento.selected = this.todosSelecionados;
    });
    this.verificarSelecao();
  }

  toggleEvento(): void {
    this.todosSelecionados = this.eventosFiltrados.every(e => e.selected);
    this.verificarSelecao();
  }

  verificarSelecao(): void {
    this.algumSelecionado = this.eventosFiltrados.some(e => e.selected);
  }

  get quantidadeSelecionados(): number {
    return this.eventosFiltrados.filter(e => e.selected).length;
  }

  excluirSelecionados(): void {
    const selecionados = this.eventosFiltrados.filter(e => e.selected);
    
    if (selecionados.length === 0) {
      alert('Selecione pelo menos um evento');
      return;
    }

    const nomes = selecionados.map(e => e.nomeEvento).join(', ');
    const mensagem = `Tem certeza que deseja excluir os eventos: ${nomes}?`;

    if (confirm(mensagem)) {
      selecionados.forEach(evento => {
        this.eventos = this.eventos.filter(e => e.id !== evento.id);
      });
      
      this.aplicarFiltros();
      this.todosSelecionados = false;
      this.verificarSelecao();
    }
  }
}
