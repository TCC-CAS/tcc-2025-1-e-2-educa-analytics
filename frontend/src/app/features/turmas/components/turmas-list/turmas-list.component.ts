import { Component, AfterViewInit, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TurmasService, Turma, Educando } from '../../services/turmas.service';

type StatusTurma = 'ativa' | 'inativa';

type Turno = 'Manhã' | 'Tarde' | 'Noite' | 'Integral';

type AnoLetivo = '2025' | '2026';

type Serie = '1º Ano EF' | '2º Ano EF' | '3º Ano EF' | '4º Ano EF' | '5º Ano EF' | '6º Ano EF' | '7º Ano EF' | '8º Ano EF' | '9º Ano EF';

interface TurmaFiltro {
  codigo: string;
  nome: string;
  turno: string;
  anoLetivo: string;
  serie: string;
  status: string;
}

@Component({
  selector: 'app-turmas-list',
  templateUrl: './turmas-list.component.html',
  styleUrls: ['./turmas-list.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;box-sizing:border-box;' }
})
export class TurmasListComponent implements AfterViewInit, OnInit {
  turmas: Turma[] = [];
  carregando = false;
  erroCarregamento = false;

  filteredTurmas: Turma[] = [];
  filtro: TurmaFiltro = {
    codigo: '',
    nome: '',
    turno: '',
    anoLetivo: '',
    serie: '',
    status: ''
  };

  educandosTurmaCarregados: Educando[] = [];
  educandosCarregando = false;

  turmaVisualizacao: Turma | null = null;
  get educandosTurma(): Educando[] {
    return this.educandosTurmaCarregados;
  }

  verEducandos(turma: Turma): void {
    this.turmaVisualizacao = turma;
    this.educandosTurmaCarregados = [];
    this.educandosCarregando = true;
    this.turmasService.listarEducandos(turma.id).subscribe({
      next: (data) => {
        this.educandosTurmaCarregados = data;
        this.educandosCarregando = false;
      },
      error: () => {
        this.educandosCarregando = false;
      },
    });
  }

  fecharEducandos(): void {
    this.turmaVisualizacao = null;
    this.educandosTurmaCarregados = [];
  }

  selectedIds = new Set<number>();
  bulkAction = '';

  // Lote
  modalLoteVisible = false;
  statusLote: StatusTurma = 'ativa';

  // Paginação
  currentPage = 1;
  pageSize = 5;
  Math = Math;

  get totalPages(): number {
    return Math.ceil(this.filteredTurmas.length / this.pageSize);
  }

  get paginatedTurmas(): Turma[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredTurmas.slice(start, end);
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

  get totalSelecionados(): number { return this.selectedIds.size; }

  abrirModalLote(): void {
    if (this.selectedIds.size === 0) return;
    this.statusLote = 'ativa';
    this.modalLoteVisible = true;
  }

  confirmarLote(): void {
    this.modalLoteVisible = false;
    const ids = Array.from(this.selectedIds);
    this.turmasService.alterarStatusLote(ids, this.statusLote).subscribe({
      next: () => {
        this.selectedIds.clear();
        this.showMessage('Status das turmas atualizado com sucesso.', 'success');
        this.carregarTurmas();
      },
      error: () => this.showMessage('Erro ao alterar status em lote.', 'error'),
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

  constructor(private router: Router, private turmasService: TurmasService) { }

  ngOnInit(): void {
    this.carregarTurmas();
  }

  carregarTurmas(): void {
    this.carregando = true;
    this.erroCarregamento = false;
    this.turmasService.listar().subscribe({
      next: (data) => {
        this.turmas = data;
        this.carregando = false;
        this.applyFilters();
      },
      error: () => {
        this.carregando = false;
        this.erroCarregamento = true;
      },
    });
  }

  ngAfterViewInit(): void {
    this.forceLeftAlignmentStyles();

    const startTime = performance.now();
    const frameLoop = () => {
      this.forceLeftAlignmentStyles();
      if (performance.now() - startTime < 1200) {
        requestAnimationFrame(frameLoop);
      }
    };
    requestAnimationFrame(frameLoop);

    const observer = new MutationObserver(() => {
      this.forceLeftAlignmentStyles();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    setTimeout(() => {
      observer.disconnect();
    }, 2000);
  }

  private forceLeftAlignmentStyles(): void {
    const turmasPage = document.querySelector('.turmas-page') as HTMLElement;
    if (turmasPage) {
      turmasPage.style.setProperty('text-align', 'left', 'important');
      turmasPage.style.setProperty('width', '100%', 'important');
    }

    const filters = document.querySelector('.filters') as HTMLElement;
    if (filters) {
      filters.style.setProperty('text-align', 'left', 'important');
    }

    const fields = document.querySelectorAll('.filters .field') as NodeListOf<HTMLElement>;
    fields.forEach((field) => {
      field.style.setProperty('text-align', 'left', 'important');
      field.style.setProperty('align-items', 'flex-start', 'important');

      const label = field.querySelector('label') as HTMLElement;
      if (label) {
        label.style.setProperty('text-align', 'left', 'important');
      }

      const input = field.querySelector('input, select') as HTMLElement;
      if (input) {
        input.style.setProperty('text-align', 'left', 'important');
      }
    });

    const inputs = document.querySelectorAll('.filters input, .filters select') as NodeListOf<HTMLElement>;
    inputs.forEach((input) => {
      input.style.setProperty('text-align', 'left', 'important');
    });

    const pageHeader = document.querySelector('.page-header') as HTMLElement;
    if (pageHeader) {
      pageHeader.style.setProperty('text-align', 'left', 'important');
      pageHeader.style.setProperty('align-items', 'flex-start', 'important');
      pageHeader.style.setProperty('justify-content', 'flex-start', 'important');

      const headerDiv = pageHeader.querySelector('div') as HTMLElement;
      if (headerDiv) {
        headerDiv.style.setProperty('text-align', 'left', 'important');
      }

      const h1 = pageHeader.querySelector('h1') as HTMLElement;
      if (h1) {
        h1.style.setProperty('text-align', 'left', 'important');
      }

      const p = pageHeader.querySelector('p') as HTMLElement;
      if (p) {
        p.style.setProperty('text-align', 'left', 'important');
      }
    }

    const toolbar = document.querySelector('.toolbar') as HTMLElement;
    if (toolbar) {
      toolbar.style.setProperty('text-align', 'left', 'important');
      toolbar.style.setProperty('display', 'flex', 'important');
      toolbar.style.setProperty('align-items', 'flex-start', 'important');
      toolbar.style.setProperty('justify-content', 'flex-start', 'important');

      const primaryBtn = toolbar.querySelector('a.primary') as HTMLElement;
      if (primaryBtn) {
        primaryBtn.style.setProperty('text-align', 'center', 'important');
      }
    }

    const message = document.querySelector('.message') as HTMLElement;
    if (message) {
      message.style.setProperty('text-align', 'left', 'important');
    }

    const bulkActions = document.querySelector('.bulk-actions') as HTMLElement;
    if (bulkActions) {
      bulkActions.style.setProperty('text-align', 'left', 'important');
    }

    const table = document.querySelector('.table') as HTMLElement;
    if (table) {
      table.style.setProperty('text-align', 'left', 'important');
    }
  }

  applyFilters(): void {
    const codigo = this.filtro.codigo.trim().toLowerCase();
    const nome = this.filtro.nome.trim().toLowerCase();

    this.filteredTurmas = this.turmas.filter((turma) => {
      const matchesCodigo = !codigo || turma.codigo.toLowerCase().includes(codigo);
      const matchesDescricao = !nome || turma.nome.toLowerCase().includes(nome);
      const matchesTurno = !this.filtro.turno || turma.turno === this.filtro.turno;
      const matchesPeriodo = !this.filtro.anoLetivo || turma.anoLetivo === this.filtro.anoLetivo;
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

    this.currentPage = 1; // Reset para primeira página ao filtrar
    this.syncSelection();
  }

  resetFilters(): void {
    this.filtro = {
      codigo: '',
      nome: '',
      turno: '',
      anoLetivo: '',
      serie: '',
      status: ''
    };
    this.applyFilters();
  }

  get filtrosAtivos(): number {
    return [this.filtro.codigo, this.filtro.nome, this.filtro.turno, this.filtro.anoLetivo, this.filtro.serie, this.filtro.status]
      .filter(v => v !== '').length;
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
    const novoStatus: StatusTurma = turma.status === 'ativa' ? 'inativa' : 'ativa';
    const acao = novoStatus === 'ativa' ? 'ativar' : 'desativar';
    this.openConfirm(
      `${acao.charAt(0).toUpperCase() + acao.slice(1)} turma`,
      `Tem certeza que deseja ${acao} a turma ${turma.codigo}?`,
      acao === 'desativar',
      () => {
        this.turmasService.alterarStatus(turma.id, novoStatus).subscribe({
          next: () => {
            this.showMessage(`Turma ${turma.codigo} ${novoStatus === 'ativa' ? 'ativada' : 'desativada'} com sucesso.`, 'success');
            this.carregarTurmas();
          },
          error: () => this.showMessage('Erro ao alterar status.', 'error'),
        });
      }
    );
  }

  deleteTurma(turma: Turma): void {
    this.openConfirm(
      'Excluir turma',
      `Tem certeza que deseja excluir a turma ${turma.codigo}? Esta ação não pode ser desfeita.`,
      true,
      () => {
        this.turmasService.deletar(turma.id).subscribe({
          next: () => {
            this.showMessage(`Turma ${turma.codigo} excluída com sucesso.`, 'success');
            this.carregarTurmas();
          },
          error: () => this.showMessage('Erro ao excluir turma.', 'error'),
        });
      }
    );
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

    const n = this.selectedIds.size;
    const acaoLabel = this.bulkAction === 'excluir' ? 'excluir' : this.bulkAction === 'ativar' ? 'ativar' : 'desativar';
    const isDanger = this.bulkAction === 'excluir' || this.bulkAction === 'desativar';
    const bulkActionSnapshot = this.bulkAction;

    this.openConfirm(
      'Ação em lote',
      `Tem certeza que deseja ${acaoLabel} ${n} turma(s) selecionada(s)?`,
      isDanger,
      () => {
        if (bulkActionSnapshot === 'excluir') {
          this.turmas = this.turmas.filter((turma) => !this.selectedIds.has(turma.id));
          this.selectedIds.clear();
          this.bulkAction = '';
          this.applyFilters();
          this.showMessage('Turmas excluídas com sucesso.', 'success');
          return;
        }

        const status = bulkActionSnapshot === 'ativar' ? 'ativa' : 'inativa';
        this.turmas = this.turmas.map((turma) =>
          this.selectedIds.has(turma.id) ? { ...turma, status } : turma
        );
        this.selectedIds.clear();
        this.bulkAction = '';
        this.applyFilters();
        this.showMessage(`Turmas ${status === 'ativa' ? 'ativadas' : 'desativadas'} com sucesso.`, 'success');
      }
    );
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  openConfirm(title: string, message: string, danger: boolean, callback: () => void): void {
    this.confirm = { visible: true, title, message, danger, callback };
  }

  confirmAction(): void { this.confirm.visible = false; this.confirm.callback(); }
  cancelConfirm(): void  { this.confirm.visible = false; }
}
