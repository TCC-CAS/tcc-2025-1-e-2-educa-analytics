import { Component, AfterViewInit, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { TurmasService, Turma, Educando } from '../../services/turmas.service';

type StatusTurma = 'planejada' | 'ativa' | 'encerrada' | 'cancelada' | 'suspensa' | 'inativa';

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
  host: { style: 'display:flex;flex-direction:column;min-height:100%;overflow:visible;flex:1 0 auto;width:100%;box-sizing:border-box;' },
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
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
    this.turmasService.listarEducandos(this.getTurmaId(turma)).subscribe({
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
    this.buscaEducando = '';
  }

  // Busca e filtragem de educandos
  buscaEducando = '';

  educandosFiltrados(): Educando[] {
    if (!this.buscaEducando.trim()) {
      return this.educandosTurmaCarregados;
    }
    
    const busca = this.buscaEducando.toLowerCase().trim();
    return this.educandosTurmaCarregados.filter(educando => 
      educando.nome?.toLowerCase().includes(busca) ||
      educando.idMatricula?.toLowerCase().includes(busca)
    );
  }

  getIniciais(nome: string): string {
    if (!nome) return '?';
    
    const palavras = nome.trim().split(/\s+/);
    if (palavras.length === 1) {
      return palavras[0].substring(0, 2).toUpperCase();
    }
    
    return (palavras[0][0] + palavras[palavras.length - 1][0]).toUpperCase();
  }

  selectedIds = new Set<number>();
  bulkAction = '';
  
  // Menu dropdown de status
  statusMenuAberto: number | null = null;

  // Lote
  modalLoteVisible = false;
  statusLote: StatusTurma = 'planejada';

  // Paginação
  currentPage = 1;
  pageSize = 10;
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
    this.statusLote = 'planejada';
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

  // Método auxiliar para obter ID da turma (compatível com antiga e nova estrutura)
  private getTurmaId(turma: any): number {
    return turma.idTurma || turma.id;
  }

  // Método auxiliar para obter código da turma (compatível com antiga e nova estrutura)
  private getTurmaCodigo(turma: any): string {
    return turma.codigo_automatico || turma.codigo || '';
  }

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

    // Fechar menu de status ao clicar fora
    document.addEventListener('click', () => {
      if (this.statusMenuAberto !== null) {
        this.fecharStatusMenu();
      }
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

    this.filteredTurmas = this.turmas.filter((turma: any) => {
      const matchesCodigo = !codigo || (turma.codigo_automatico || turma.codigo || '').toLowerCase().includes(codigo);
      const matchesDescricao = !nome || (turma.nomeTurma || turma.nome || '').toLowerCase().includes(nome);
      const matchesTurno = !this.filtro.turno || (turma.periodo_nome || turma.turno) === this.filtro.turno;
      const matchesPeriodo = !this.filtro.anoLetivo || String(turma.ano_letivo || turma.anoLetivo) === String(this.filtro.anoLetivo);
      const matchesSerie = !this.filtro.serie || (turma.serie_nome || turma.serie_codigo || turma.serie) === this.filtro.serie;
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
      this.filteredTurmas.forEach((turma) => this.selectedIds.add(this.getTurmaId(turma)));
    } else {
      this.selectedIds.clear();
    }
  }

  allSelected(): boolean {
    return this.filteredTurmas.length > 0 && this.filteredTurmas.every((turma) => this.selectedIds.has(this.getTurmaId(turma)));
  }

  syncSelection(): void {
    const validIds = new Set(this.filteredTurmas.map((turma) => this.getTurmaId(turma)));
    this.selectedIds.forEach((id) => {
      if (!validIds.has(id)) this.selectedIds.delete(id);
    });
  }

  editTurma(turma: Turma): void {
    this.router.navigate(['/turmas', this.getTurmaId(turma), 'editar']);
  }

  toggleStatusMenu(turmaId: number | undefined, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!turmaId) return;
    this.statusMenuAberto = this.statusMenuAberto === turmaId ? null : turmaId;
  }

  fecharStatusMenu(): void {
    this.statusMenuAberto = null;
  }

  alterarStatusPara(turma: Turma, novoStatus: StatusTurma, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.fecharStatusMenu();
    
    if (turma.status === novoStatus) {
      this.showMessage('A turma já está com este status.', 'error');
      return;
    }

    const statusLabels: {[key: string]: string} = {
      'planejada': 'Planejada',
      'ativa': 'Ativa',
      'encerrada': 'Encerrada',
      'cancelada': 'Cancelada',
      'suspensa': 'Suspensa',
      'inativa': 'Inativa'
    };
    
    this.openConfirm(
      'Alterar status',
      `Deseja alterar o status da turma ${this.getTurmaCodigo(turma)} para "${statusLabels[novoStatus]}"?`,
      novoStatus === 'cancelada' || novoStatus === 'inativa',
      () => {
        this.turmasService.alterarStatus(this.getTurmaId(turma), novoStatus).subscribe({
          next: () => {
            this.showMessage(`Status da turma ${this.getTurmaCodigo(turma)} alterado para "${statusLabels[novoStatus]}" com sucesso.`, 'success');
            this.carregarTurmas();
          },
          error: () => this.showMessage('Erro ao alterar status.', 'error'),
        });
      }
    );
  }

  getStatusLabel(status: string): string {
    const labels: {[key: string]: string} = {
      'planejada': 'Planejada',
      'ativa': 'Ativa',
      'encerrada': 'Encerrada',
      'cancelada': 'Cancelada',
      'suspensa': 'Suspensa',
      'inativa': 'Inativa'
    };
    return labels[status] || status;
  }

  toggleStatus(turma: Turma): void {
    const novoStatus: StatusTurma = turma.status === 'ativa' ? 'inativa' : 'ativa';
    const acao = novoStatus === 'ativa' ? 'ativar' : 'desativar';
    this.openConfirm(
      `${acao.charAt(0).toUpperCase() + acao.slice(1)} turma`,
      `Tem certeza que deseja ${acao} a turma ${this.getTurmaCodigo(turma)}?`,
      acao === 'desativar',
      () => {
        this.turmasService.alterarStatus(this.getTurmaId(turma), novoStatus).subscribe({
          next: () => {
            this.showMessage(`Turma ${this.getTurmaCodigo(turma)} ${novoStatus === 'ativa' ? 'ativada' : 'desativada'} com sucesso.`, 'success');
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
      `Tem certeza que deseja excluir a turma ${this.getTurmaCodigo(turma)}? Esta ação não pode ser desfeita.`,
      true,
      () => {
        this.turmasService.deletar(this.getTurmaId(turma)).subscribe({
          next: () => {
            this.showMessage(`Turma ${this.getTurmaCodigo(turma)} excluída com sucesso.`, 'success');
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
          this.turmas = this.turmas.filter((turma) => !this.selectedIds.has(this.getTurmaId(turma)));
          this.selectedIds.clear();
          this.bulkAction = '';
          this.applyFilters();
          this.showMessage('Turmas excluídas com sucesso.', 'success');
          return;
        }

        const status = bulkActionSnapshot === 'ativar' ? 'ativa' : 'inativa';
        this.turmas = this.turmas.map((turma) =>
          this.selectedIds.has(this.getTurmaId(turma)) ? { ...turma, status } : turma
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
