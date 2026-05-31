import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DisciplinasService, Disciplina } from '../../services/disciplinas.service';

type StatusDisciplina = 'ativa' | 'inativa';

interface DisciplinaFiltro {
  codigo: string;
  nome: string;
  status: string;
}

@Component({
  selector: 'app-disciplinas-list',
  templateUrl: './disciplinas-list.component.html',
  styleUrls: ['./disciplinas-list.component.scss'],
  host: { style: 'display:flex;flex-direction:column;min-height:100%;overflow:visible;flex:1 0 auto;width:100%;box-sizing:border-box;' }
})
export class DisciplinasListComponent implements OnInit {
  disciplinas: Disciplina[] = [];
  filteredDisciplinas: Disciplina[] = [];
  isLoading = true;
  
  filtro: DisciplinaFiltro = {
    codigo: '',
    nome: '',
    status: ''
  };

  // Paginação
  currentPage = 1;
  pageSize = 10;
  Math = Math;

  // Contagem de filtros ativos
  get filtrosAtivos(): number {
    let count = 0;
    if (this.filtro.codigo) count++;
    if (this.filtro.nome) count++;
    if (this.filtro.status) count++;
    return count;
  }

  onFiltroChange(): void {
    this.applyFilters();
  }

  limparFiltros(): void {
    this.resetFilters();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredDisciplinas.length / this.pageSize);
  }

  get paginatedDisciplinas(): Disciplina[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredDisciplinas.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  getVisiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);

    if (current - delta > 2) {
      pages.push(-1); // dots
    }

    const start = Math.max(2, current - delta);
    const end = Math.min(total - 1, current + delta);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current + delta < total - 1) {
      pages.push(-1); // dots
    }

    pages.push(total);

    return pages;
  }

  selectedIds = new Set<number>();
  bulkAction = '';

  // Lote
  modalLoteVisible = false;
  statusLote: StatusDisciplina = 'ativa';

  get totalSelecionados(): number { return this.selectedIds.size; }

  abrirModalLote(): void {
    if (this.selectedIds.size === 0) return;
    this.statusLote = 'ativa';
    this.modalLoteVisible = true;
  }

  confirmarLote(): void {
    this.modalLoteVisible = false;
    // Atualizar cada disciplina selecionada via API
    const promises = Array.from(this.selectedIds).map(id => {
      const disc = this.disciplinas.find(d => d.id === id);
      if (disc) {
        return this.disciplinasService.atualizar(id, {
          ...disc,
          status: this.statusLote
        }).toPromise();
      }
      return Promise.resolve();
    });

    Promise.all(promises).then(() => {
      this.showMessage('Status atualizado com sucesso', 'success');
      this.selectedIds.clear();
      this.carregarDisciplinas();
    }).catch((error) => {
      console.error('Erro ao atualizar disciplinas:', error);
      this.showMessage('Erro ao atualizar disciplinas', 'error');
    });
  }

  cancelarLote(): void {
    this.modalLoteVisible = false;
  }

  message = '';
  messageType: 'success' | 'error' = 'success';

  confirm = {
    visible: false,
    title: '',
    message: '',
    danger: false,
    callback: () => {}
  };

  constructor(
    private router: Router,
    private disciplinasService: DisciplinasService
  ) { }

  ngOnInit(): void {
    this.carregarDisciplinas();
  }

  carregarDisciplinas(): void {
    this.isLoading = true;
    const statusFilter = this.filtro.status as 'ativa' | 'inativa' | undefined;
    
    this.disciplinasService.listar(statusFilter || undefined).subscribe({
      next: (disciplinas) => {
        this.disciplinas = disciplinas;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar disciplinas:', error);
        this.showMessage('Erro ao carregar disciplinas', 'error');
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const codigo = this.filtro.codigo.trim().toLowerCase();
    const nome = this.filtro.nome.trim().toLowerCase();

    this.filteredDisciplinas = this.disciplinas.filter((disciplina) => {
      const matchesCodigo = !codigo || disciplina.codigo.toLowerCase().includes(codigo);
      const matchesNome = !nome || disciplina.nome.toLowerCase().includes(nome);
      const matchesStatus = !this.filtro.status || disciplina.status === this.filtro.status;

      return matchesCodigo && matchesNome && matchesStatus;
    });

    this.currentPage = 1;
    this.syncSelection();
  }

  resetFilters(): void {
    this.filtro = { codigo: '', nome: '', status: '' };
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
      this.filteredDisciplinas.forEach((disciplina) => {
        if (disciplina.id !== undefined) {
          this.selectedIds.add(disciplina.id);
        }
      });
    } else {
      this.selectedIds.clear();
    }
  }

  allSelected(): boolean {
    return this.filteredDisciplinas.length > 0 && 
           this.filteredDisciplinas.every((disciplina) => 
             disciplina.id !== undefined && this.selectedIds.has(disciplina.id)
           );
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
    const acao = disciplina.status === 'ativa' ? 'inativar' : 'ativar';
    const novoStatus: 'ativa' | 'inativa' = disciplina.status === 'ativa' ? 'inativa' : 'ativa';
    
    this.openConfirm(
      `${acao.charAt(0).toUpperCase() + acao.slice(1)} disciplina`,
      `Deseja ${acao} a disciplina ${disciplina.nome}?`,
      acao === 'inativar',
      () => {
        if (!disciplina.id) return;
        
        this.disciplinasService.atualizar(disciplina.id, {
          ...disciplina,
          status: novoStatus
        }).subscribe({
          next: () => {
            this.showMessage(`Disciplina ${disciplina.nome} ${novoStatus === 'ativa' ? 'ativada' : 'inativada'} com sucesso.`, 'success');
            this.carregarDisciplinas();
          },
          error: (error) => {
            console.error('Erro ao atualizar status:', error);
            this.showMessage('Erro ao atualizar status da disciplina', 'error');
          }
        });
      }
    );
  }

  deleteDisciplina(disciplina: Disciplina): void {
    this.openConfirm(
      'Excluir disciplina permanentemente',
      `Tem certeza que deseja EXCLUIR PERMANENTEMENTE a disciplina ${disciplina.nome}? Esta ação não pode ser desfeita.`,
      true,
      () => {
        if (!disciplina.id) return;
        
        this.disciplinasService.deletar(disciplina.id).subscribe({
          next: () => {
            this.showMessage(`Disciplina ${disciplina.nome} excluída com sucesso.`, 'success');
            this.carregarDisciplinas();
          },
          error: (error) => {
            console.error('Erro ao deletar disciplina:', error);
            this.showMessage('Erro ao excluir disciplina', 'error');
          }
        });
      }
    );
  }

  performBulkAction(): void {
    if (!this.bulkAction) { this.showMessage('Selecione uma ação em lote.', 'error'); return; }
    if (this.selectedIds.size === 0) { this.showMessage('Selecione ao menos uma disciplina.', 'error'); return; }
    const n = this.selectedIds.size;
    const acaoLabel = this.bulkAction === 'excluir' ? 'inativar' : this.bulkAction === 'ativar' ? 'ativar' : 'inativar';
    const isDanger = this.bulkAction === 'excluir' || this.bulkAction === 'desativar';
    const snap = this.bulkAction;
    this.openConfirm(
      'Ação em lote',
      `Deseja ${acaoLabel} ${n} disciplina(s) selecionada(s)?`,
      isDanger,
      () => {
        if (snap === 'excluir') {
          // Inativar todas as disciplinas selecionadas
          const promises = Array.from(this.selectedIds).map(id => {
            return this.disciplinasService.deletar(id).toPromise();
          });
          
          Promise.all(promises).then(() => {
            this.showMessage('Disciplinas inativadas com sucesso.', 'success');
            this.selectedIds.clear();
            this.bulkAction = '';
            this.carregarDisciplinas();
          }).catch((error) => {
            console.error('Erro ao inativar disciplinas:', error);
            this.showMessage('Erro ao inativar disciplinas', 'error');
          });
          return;
        }
        
        const status: StatusDisciplina = snap === 'ativar' ? 'ativa' : 'inativa';
        const promises = Array.from(this.selectedIds).map(id => {
          const disc = this.disciplinas.find(d => d.id === id);
          if (disc) {
            return this.disciplinasService.atualizar(id, {
              ...disc,
              status
            }).toPromise();
          }
          return Promise.resolve();
        });
        
        Promise.all(promises).then(() => {
          this.showMessage(`Disciplinas ${status === 'ativa' ? 'ativadas' : 'inativadas'} com sucesso.`, 'success');
          this.selectedIds.clear();
          this.bulkAction = '';
          this.carregarDisciplinas();
        }).catch((error) => {
          console.error('Erro ao atualizar disciplinas:', error);
          this.showMessage('Erro ao atualizar disciplinas', 'error');
        });
      }
    );
  }

  openConfirm(title: string, message: string, danger: boolean, callback: () => void): void {
    this.confirm = { visible: true, title, message, danger, callback };
  }

  confirmAction(): void { this.confirm.visible = false; this.confirm.callback(); }
  cancelConfirm(): void  { this.confirm.visible = false; }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }
}
