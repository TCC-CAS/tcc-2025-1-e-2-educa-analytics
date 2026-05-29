import { Component, OnInit } from '@angular/core';
import { ReposicoesService, ReposicaoAula } from '../../services/reposicoes.service';

@Component({
  selector: 'app-reposicoes-list',
  templateUrl: './reposicoes-list.component.html',
  styleUrls: ['./reposicoes-list.component.scss']
})
export class ReposicoesListComponent implements OnInit {
  reposicoes: ReposicaoAula[] = [];
  reposicoesFiltradas: ReposicaoAula[] = [];
  carregando = false;
  erro = '';
  
  filtroStatus: string = 'todas';
  filtroTurma: string = '';
  filtroEducador: string = '';

  estatisticas: any = null;

  constructor(private reposicoesService: ReposicoesService) {}

  ngOnInit(): void {
    this.carregarReposicoes();
  }

  carregarReposicoes(status?: string): void {
    this.carregando = true;
    this.erro = '';

    const statusFiltro = status || (this.filtroStatus !== 'todas' ? this.filtroStatus as any : undefined);

    this.reposicoesService.listar(statusFiltro).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.reposicoes = response.data;
          this.aplicarFiltros();
          this.calcularEstatisticas();
        } else {
          this.erro = 'Erro ao carregar reposições';
        }
        this.carregando = false;
      },
      error: (err: any) => {
        this.erro = 'Erro ao conectar com o servidor';
        this.carregando = false;
        console.error(err);
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.reposicoes];

    // Filtro por turma
    if (this.filtroTurma) {
      resultado = resultado.filter(r => 
        r.turma.toLowerCase().includes(this.filtroTurma.toLowerCase())
      );
    }

    // Filtro por educador
    if (this.filtroEducador) {
      resultado = this.reposicoesService.filtrarPorEducador(resultado, this.filtroEducador);
    }

    this.reposicoesFiltradas = resultado;
  }

  calcularEstatisticas(): void {
    this.estatisticas = this.reposicoesService.calcularEstatisticas(this.reposicoes);
  }

  onFiltroStatusChange(): void {
    this.carregarReposicoes();
  }

  onFiltroChange(): void {
    this.aplicarFiltros();
  }

  marcarRealizada(idReposicao: number): void {
    if (!confirm('Marcar esta reposição como realizada?')) {
      return;
    }

    this.reposicoesService.marcarRealizada(idReposicao).subscribe({
      next: (response: any) => {
        if (response.success) {
          alert('Reposição marcada como realizada!');
          this.carregarReposicoes();
        }
      },
      error: (err: any) => {
        alert('Erro ao marcar reposição');
        console.error(err);
      }
    });
  }

  exportarCSV(): void {
    this.reposicoesService.downloadCSV(this.reposicoesFiltradas);
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  formatarStatus(status: string): string {
    return this.reposicoesService.formatarStatus(status);
  }

  getIcone(status: string): string {
    return this.reposicoesService.getIconePorStatus(status);
  }

  isAtrasada(reposicao: ReposicaoAula): boolean {
    return this.reposicoesService.isReposicaoAtrasada(reposicao);
  }

  diasDesdeCancel(dataCancelamento: string): number {
    return this.reposicoesService.calcularDiasDesdeCancelamento(dataCancelamento);
  }
}
