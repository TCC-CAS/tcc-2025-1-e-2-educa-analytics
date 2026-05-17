import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface Educador {
  idMatricula?: string;
  matriculaFuncional?: string;
  nomeCompleto: string;
  disciplinaLecionada?: string;
  turno?: string;
  status?: 'ativo' | 'inativo';
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

  filtroNome: string = '';
  filtroMatricula: string = '';
  filtroDisciplina: string = '';
  filtroTurno: string = '';
  filtroStatus: string = '';

  todosSelecionados: boolean = false;
  algumSelecionado: boolean = false;
  acaoLote: string = '';

  modalExclusaoVisible: boolean = false;
  educadorParaExcluir: Educador | null = null;
  modalLoteVisible: boolean = false;

  paginaAtual: number = 1;
  itensPorPagina: number = 10;

  Math = Math;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.carregarEducadores();
  }

  carregarEducadores(): void {
    this.http.get<any>(`${environment.apiUrl}/educadores`).subscribe({
      next: (response) => {
        console.log('Resposta da API:', response);
        // A API retorna {sucesso: true, educadores: [...], total: n}
        if (response.sucesso && response.educadores) {
          this.educadores = response.educadores.map((edu: any) => {
            // Processar disciplinas
            const disciplinas = edu.disciplinas || [];
            const disciplinaLecionada = disciplinas.length > 0 ? disciplinas.join(', ') : 'N/A';
            
            // Processar turnos
            let turno = 'N/A';
            if (edu.periodos && Array.isArray(edu.periodos) && edu.periodos.length > 0) {
              // Mapear valores para nomes legíveis
              const turnoMap: { [key: string]: string } = {
                'manha': 'Manhã',
                'tarde': 'Tarde',
                'noite': 'Noite',
                'integral': 'Integral'
              };
              turno = edu.periodos.map((p: string) => turnoMap[p.toLowerCase()] || p).join(', ');
            }
            
            return {
              idMatricula: edu.idMatricula,
              matriculaFuncional: edu.idMatricula,
              nomeCompleto: edu.nomeCompleto,
              disciplinaLecionada: disciplinaLecionada,
              turno: turno,
              status: edu.status || 'ativo'
            };
          });
          this.aplicarFiltros();
        }
      },
      error: (err) => {
        console.error('Erro ao carregar educadores:', err);
        alert('Erro ao carregar lista de educadores. Verifique o console.');
      }
    });
  }

  onFiltroChange(): void {
    this.paginaAtual = 1;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.educadoresFiltrados = this.educadores.filter(e => {
      const matchNome = !this.filtroNome || e.nomeCompleto.toLowerCase().includes(this.filtroNome.toLowerCase());
      const matchMatricula = !this.filtroMatricula || (e.matriculaFuncional?.toLowerCase().includes(this.filtroMatricula.toLowerCase()) ?? false);
      const matchDisciplina = !this.filtroDisciplina || (e.disciplinaLecionada?.toLowerCase().includes(this.filtroDisciplina.toLowerCase()) ?? false);
      const matchTurno = !this.filtroTurno || e.turno === this.filtroTurno;
      const matchStatus = !this.filtroStatus || (e.status || 'ativo') === this.filtroStatus;
      return matchNome && matchMatricula && matchDisciplina && matchTurno && matchStatus;
    });
  }

  limparFiltros(): void {
    this.filtroNome = '';
    this.filtroMatricula = '';
    this.filtroDisciplina = '';
    this.filtroTurno = '';
    this.filtroStatus = '';
    this.paginaAtual = 1;
    this.aplicarFiltros();
  }

  get filtrosAtivos(): number {
    return [this.filtroNome, this.filtroMatricula, this.filtroDisciplina, this.filtroTurno, this.filtroStatus].filter(Boolean).length;
  }

  get educadoresPaginados(): Educador[] {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    return this.educadoresFiltrados.slice(inicio, inicio + this.itensPorPagina);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.educadoresFiltrados.length / this.itensPorPagina));
  }

  get paginasVisiveis(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPaginas; i++) pages.push(i);
    return pages;
  }

  irParaPagina(pagina: number): void {
    this.paginaAtual = Math.max(1, Math.min(pagina, this.totalPaginas));
  }

  onItensPorPaginaChange(): void {
    this.paginaAtual = 1;
  }

  novo(): void {
    this.router.navigate(['/educadores/novo']);
  }

  editar(idMatricula: string): void {
    this.router.navigate([`/educadores/${idMatricula}/editar`]);
  }

  verTurmas(idMatricula: string): void {
    this.router.navigate([`/educadores/${idMatricula}/minhas-turmas`]);
  }

  ativar(educador: Educador): void {
    educador.status = 'ativo';
  }

  desativar(educador: Educador): void {
    educador.status = 'inativo';
  }

  abrirModalExclusao(educador: Educador, event: Event): void {
    event.stopPropagation();
    this.educadorParaExcluir = educador;
    this.modalExclusaoVisible = true;
  }

  cancelarExclusao(): void {
    this.modalExclusaoVisible = false;
    this.educadorParaExcluir = null;
  }

  confirmarExclusao(): void {
    if (this.educadorParaExcluir) {
      const idMatricula = this.educadorParaExcluir.idMatricula;
      
      // Chama a API para excluir
      this.http.delete<any>(`${environment.apiUrl}/educadores/${idMatricula}`).subscribe({
        next: (response) => {
          console.log('Educador excluído:', response);
          // Remove da lista local
          this.educadores = this.educadores.filter(e => e.idMatricula !== idMatricula);
          this.aplicarFiltros();
          this.verificarSelecao();
          this.cancelarExclusao();
        },
        error: (err) => {
          console.error('Erro ao excluir educador:', err);
          alert('Erro ao excluir educador. Verifique o console.');
          this.cancelarExclusao();
        }
      });
    } else {
      this.cancelarExclusao();
    }
  }

  toggleTodos(): void {
    this.educadoresFiltrados.forEach(e => e.selected = this.todosSelecionados);
    this.verificarSelecao();
  }

  selecionarTodos(valor: boolean): void {
    this.todosSelecionados = valor;
    this.educadoresFiltrados.forEach(e => e.selected = valor);
    this.verificarSelecao();
  }

  toggleEducador(educador: Educador): void {
    educador.selected = !educador.selected;
    this.todosSelecionados = this.educadoresFiltrados.every(e => e.selected);
    this.verificarSelecao();
  }

  verificarSelecao(): void {
    this.algumSelecionado = this.educadoresFiltrados.some(e => e.selected);
  }

  get quantidadeSelecionados(): number {
    return this.educadoresFiltrados.filter(e => e.selected).length;
  }

  abrirModalLote(): void {
    if (!this.acaoLote || this.quantidadeSelecionados === 0) return;
    this.modalLoteVisible = true;
  }

  cancelarLote(): void {
    this.modalLoteVisible = false;
  }

  confirmarLote(): void {
    const selecionados = this.educadoresFiltrados.filter(e => e.selected);
    
    if (this.acaoLote === 'excluir') {
      // Excluir via API
      const deleteRequests = selecionados.map(educador => 
        this.http.delete<any>(`${environment.apiUrl}/educadores/${educador.idMatricula}`)
      );
      
      // Executa todas as exclusões
      Promise.all(deleteRequests.map(req => req.toPromise()))
        .then(() => {
          // Remove da lista local
          const idsExcluidos = selecionados.map(e => e.idMatricula);
          this.educadores = this.educadores.filter(e => !idsExcluidos.includes(e.idMatricula));
          this.aplicarFiltros();
          this.todosSelecionados = false;
          this.acaoLote = '';
          this.verificarSelecao();
          this.cancelarLote();
        })
        .catch(err => {
          console.error('Erro ao excluir educadores em lote:', err);
          alert('Erro ao excluir alguns educadores. Verifique o console.');
          this.cancelarLote();
          this.carregarEducadores(); // Recarrega a lista
        });
    } else {
      // Ativar/Desativar (ainda não implementado via API)
      selecionados.forEach(educador => {
        switch (this.acaoLote) {
          case 'ativar': educador.status = 'ativo'; break;
          case 'desativar': educador.status = 'inativo'; break;
        }
      });
      this.aplicarFiltros();
      this.todosSelecionados = false;
      this.acaoLote = '';
      this.verificarSelecao();
      this.cancelarLote();
    }
  }

  statusClass(status?: string): string {
    return status === 'ativo' ? 'status-ativo' : 'status-inativo';
  }

  trackById(index: number, item: Educador): string { return item.idMatricula || index.toString(); }
  trackByIndex(index: number): number { return index; }
}
