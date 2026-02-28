import { Component } from '@angular/core';
import { Router } from '@angular/router';

type StatusDisciplina = 'ativa' | 'inativa';

type Serie = '1' | '2' | '3';

interface Disciplina {
  id: number;
  abreviatura: string;
  nome: string;
  serie: Serie;
  aulasSemanais: number;
  horasSemanais: number;
  status: StatusDisciplina;
}

interface DisciplinaFiltro {
  abreviatura: string;
  nome: string;
  serie: string;
  aulasSemanais: string;
  horasSemanais: string;
  status: string;
}

@Component({
  selector: 'app-disciplinas-list',
  templateUrl: './disciplinas-list.component.html',
  styleUrls: ['./disciplinas-list.component.scss']
})
export class DisciplinasListComponent {
  disciplinas: Disciplina[] = [
    {
      id: 1,
      abreviatura: 'MAT',
      nome: 'Matematica',
      serie: '1',
      aulasSemanais: 5,
      horasSemanais: 4,
      status: 'ativa'
    },
    {
      id: 2,
      abreviatura: 'POR',
      nome: 'Portugues',
      serie: '2',
      aulasSemanais: 4,
      horasSemanais: 3,
      status: 'inativa'
    },
    {
      id: 3,
      abreviatura: 'HIS',
      nome: 'Historia',
      serie: '3',
      aulasSemanais: 3,
      horasSemanais: 2,
      status: 'ativa'
    }
  ];

  filteredDisciplinas: Disciplina[] = [...this.disciplinas];
  filtro: DisciplinaFiltro = {
    abreviatura: '',
    nome: '',
    serie: '',
    aulasSemanais: '',
    horasSemanais: '',
    status: ''
  };

  selectedIds = new Set<number>();
  bulkAction = '';
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private router: Router) { }

  applyFilters(): void {
    const abreviatura = this.filtro.abreviatura.trim().toLowerCase();
    const nome = this.filtro.nome.trim().toLowerCase();
    const aulas = this.filtro.aulasSemanais.trim();
    const horas = this.filtro.horasSemanais.trim();

    this.filteredDisciplinas = this.disciplinas.filter((disciplina) => {
      const matchesAbreviatura = !abreviatura || disciplina.abreviatura.toLowerCase().includes(abreviatura);
      const matchesNome = !nome || disciplina.nome.toLowerCase().includes(nome);
      const matchesSerie = !this.filtro.serie || disciplina.serie === this.filtro.serie;
      const matchesAulas = !aulas || disciplina.aulasSemanais === Number(aulas);
      const matchesHoras = !horas || disciplina.horasSemanais === Number(horas);
      const matchesStatus = !this.filtro.status || disciplina.status === this.filtro.status;

      return (
        matchesAbreviatura &&
        matchesNome &&
        matchesSerie &&
        matchesAulas &&
        matchesHoras &&
        matchesStatus
      );
    });

    this.syncSelection();
  }

  resetFilters(): void {
    this.filtro = {
      abreviatura: '',
      nome: '',
      serie: '',
      aulasSemanais: '',
      horasSemanais: '',
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
      this.filteredDisciplinas.forEach((disciplina) => this.selectedIds.add(disciplina.id));
    } else {
      this.selectedIds.clear();
    }
  }

  allSelected(): boolean {
    return this.filteredDisciplinas.length > 0 && this.filteredDisciplinas.every((disciplina) => this.selectedIds.has(disciplina.id));
  }

  syncSelection(): void {
    const validIds = new Set(this.filteredDisciplinas.map((disciplina) => disciplina.id));
    this.selectedIds.forEach((id) => {
      if (!validIds.has(id)) this.selectedIds.delete(id);
    });
  }

  editDisciplina(disciplina: Disciplina): void {
    this.router.navigate(['/disciplinas', disciplina.id, 'editar']);
  }

  toggleStatus(disciplina: Disciplina): void {
    disciplina.status = disciplina.status === 'ativa' ? 'inativa' : 'ativa';
    this.showMessage(`Disciplina ${disciplina.abreviatura} ${disciplina.status === 'ativa' ? 'ativada' : 'desativada'} com sucesso.`, 'success');
  }

  deleteDisciplina(disciplina: Disciplina): void {
    const confirmed = window.confirm('Tem certeza que deseja excluir esta disciplina?');
    if (!confirmed) return;

    this.disciplinas = this.disciplinas.filter((item) => item.id !== disciplina.id);
    this.applyFilters();
    this.showMessage(`Disciplina ${disciplina.abreviatura} excluida com sucesso.`, 'success');
  }

  performBulkAction(): void {
    if (!this.bulkAction) {
      this.showMessage('Selecione uma acao em lote.', 'error');
      return;
    }

    if (this.selectedIds.size === 0) {
      this.showMessage('Selecione ao menos uma disciplina.', 'error');
      return;
    }

    const confirmed = window.confirm('Tem certeza que deseja aplicar esta acao nas disciplinas selecionadas?');
    if (!confirmed) return;

    if (this.bulkAction === 'excluir') {
      this.disciplinas = this.disciplinas.filter((disciplina) => !this.selectedIds.has(disciplina.id));
      this.selectedIds.clear();
      this.applyFilters();
      this.showMessage('Disciplinas excluidas com sucesso.', 'success');
      return;
    }

    const status = this.bulkAction === 'ativar' ? 'ativa' : 'inativa';
    this.disciplinas = this.disciplinas.map((disciplina) =>
      this.selectedIds.has(disciplina.id) ? { ...disciplina, status } : disciplina
    );
    this.showMessage(`Disciplinas ${status === 'ativa' ? 'ativadas' : 'desativadas'} com sucesso.`, 'success');
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }
}
