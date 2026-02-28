import { Component } from '@angular/core';
import { Router } from '@angular/router';

type StatusTurma = 'ativa' | 'inativa';

type Turno = 'Manha' | 'Tarde' | 'Noite';

type PeriodoLetivo = '2025.1' | '2025.2' | '2026.1';

type Serie = '1' | '2' | '3';

interface Turma {
  id: number;
  codigo: string;
  descricao: string;
  turno: Turno;
  periodoLetivo: PeriodoLetivo;
  serie: Serie;
  status: StatusTurma;
  vagas: number;
  inicioAulas: string;
  fimAulas: string;
}

interface TurmaFiltro {
  codigo: string;
  descricao: string;
  turno: string;
  periodoLetivo: string;
  serie: string;
  status: string;
}

@Component({
  selector: 'app-turmas-list',
  templateUrl: './turmas-list.component.html',
  styleUrls: ['./turmas-list.component.scss']
})
export class TurmasListComponent {
  turmas: Turma[] = [
    {
      id: 1,
      codigo: 'T-001',
      descricao: '1 ano A',
      turno: 'Manha',
      periodoLetivo: '2025.1',
      serie: '1',
      status: 'ativa',
      vagas: 30,
      inicioAulas: '2025-02-10',
      fimAulas: '2025-12-15'
    },
    {
      id: 2,
      codigo: 'T-002',
      descricao: '2 ano B',
      turno: 'Tarde',
      periodoLetivo: '2025.2',
      serie: '2',
      status: 'inativa',
      vagas: 28,
      inicioAulas: '2025-08-05',
      fimAulas: '2025-12-18'
    },
    {
      id: 3,
      codigo: 'T-003',
      descricao: '3 ano A',
      turno: 'Noite',
      periodoLetivo: '2026.1',
      serie: '3',
      status: 'ativa',
      vagas: 25,
      inicioAulas: '2026-02-02',
      fimAulas: '2026-12-10'
    }
  ];

  filteredTurmas: Turma[] = [...this.turmas];
  filtro: TurmaFiltro = {
    codigo: '',
    descricao: '',
    turno: '',
    periodoLetivo: '',
    serie: '',
    status: ''
  };

  selectedIds = new Set<number>();
  bulkAction = '';
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private router: Router) { }

  applyFilters(): void {
    const codigo = this.filtro.codigo.trim().toLowerCase();
    const descricao = this.filtro.descricao.trim().toLowerCase();

    this.filteredTurmas = this.turmas.filter((turma) => {
      const matchesCodigo = !codigo || turma.codigo.toLowerCase().includes(codigo);
      const matchesDescricao = !descricao || turma.descricao.toLowerCase().includes(descricao);
      const matchesTurno = !this.filtro.turno || turma.turno === this.filtro.turno;
      const matchesPeriodo = !this.filtro.periodoLetivo || turma.periodoLetivo === this.filtro.periodoLetivo;
      const matchesSerie = !this.filtro.serie || turma.serie === this.filtro.serie;
      const matchesStatus = !this.filtro.status || turma.status === this.filtro.status;

      return (
        matchesCodigo &&
        matchesDescricao &&
        matchesTurno &&
        matchesPeriodo &&
        matchesSerie &&
        matchesStatus
      );
    });

    this.syncSelection();
  }

  resetFilters(): void {
    this.filtro = {
      codigo: '',
      descricao: '',
      turno: '',
      periodoLetivo: '',
      serie: '',
      status: ''
    };
    this.applyFilters();
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  toggleSelection(id: number, selected: boolean): void {
    if (selected) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
  }

  toggleAll(checked: boolean): void {
    if (checked) {
      this.filteredTurmas.forEach((turma) => this.selectedIds.add(turma.id));
    } else {
      this.selectedIds.clear();
    }
  }

  allSelected(): boolean {
    return this.filteredTurmas.length > 0 && this.filteredTurmas.every((turma) => this.selectedIds.has(turma.id));
  }

  syncSelection(): void {
    const validIds = new Set(this.filteredTurmas.map((turma) => turma.id));
    this.selectedIds.forEach((id) => {
      if (!validIds.has(id)) this.selectedIds.delete(id);
    });
  }

  editTurma(turma: Turma): void {
    this.router.navigate(['/turmas', turma.id, 'editar']);
  }

  toggleStatus(turma: Turma): void {
    turma.status = turma.status === 'ativa' ? 'inativa' : 'ativa';
    this.showMessage(`Turma ${turma.codigo} ${turma.status === 'ativa' ? 'ativada' : 'desativada'} com sucesso.`, 'success');
  }

  deleteTurma(turma: Turma): void {
    const confirmed = window.confirm('Tem certeza que deseja excluir esta turma?');
    if (!confirmed) return;

    this.turmas = this.turmas.filter((item) => item.id !== turma.id);
    this.applyFilters();
    this.showMessage(`Turma ${turma.codigo} excluida com sucesso.`, 'success');
  }

  performBulkAction(): void {
    if (!this.bulkAction) {
      this.showMessage('Selecione uma acao em lote.', 'error');
      return;
    }

    if (this.selectedIds.size === 0) {
      this.showMessage('Selecione ao menos uma turma.', 'error');
      return;
    }

    const confirmed = window.confirm('Tem certeza que deseja aplicar esta acao nas turmas selecionadas?');
    if (!confirmed) return;

    if (this.bulkAction === 'excluir') {
      this.turmas = this.turmas.filter((turma) => !this.selectedIds.has(turma.id));
      this.selectedIds.clear();
      this.applyFilters();
      this.showMessage('Turmas excluidas com sucesso.', 'success');
      return;
    }

    const status = this.bulkAction === 'ativar' ? 'ativa' : 'inativa';
    this.turmas = this.turmas.map((turma) =>
      this.selectedIds.has(turma.id) ? { ...turma, status } : turma
    );
    this.showMessage(`Turmas ${status === 'ativa' ? 'ativadas' : 'desativadas'} com sucesso.`, 'success');
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }
}
