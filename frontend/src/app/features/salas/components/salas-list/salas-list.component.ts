import { Component, AfterViewInit, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SalasService, Sala } from '../../services/salas.service';

type StatusSala = 'ativa' | 'inativa';
type TipoSala = 'sala-de-aula' | 'laboratorio' | 'auditorio' | 'biblioteca' | 'quadra' | 'outro';

interface SalaFiltro {
  codigo: string;
  nome: string;
  tipo: string;
  status: string;
}

@Component({
  selector: 'app-salas-list',
  templateUrl: './salas-list.component.html',
  styleUrls: ['./salas-list.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class SalasListComponent implements OnInit, AfterViewInit {

  readonly tiposLabel: Record<TipoSala, string> = {
    'sala-de-aula': 'Sala de Aula',
    'laboratorio':  'Laboratório',
    'auditorio':    'Auditório',
    'biblioteca':   'Biblioteca',
    'quadra':       'Quadra',
    'outro':        'Outro'
  };

  getTipoLabel(tipo: string): string {
    return this.tiposLabel[tipo as TipoSala] || tipo;
  }

  salas: Sala[] = [];
  filteredSalas: Sala[] = [];
  loading = false;

  filtro: SalaFiltro = { codigo: '', nome: '', tipo: '', status: '' };

  // Paginação
  paginaAtual = 1;
  itensPorPagina = 10;
  Math = Math;

  get totalPaginas(): number {
    return Math.ceil(this.filteredSalas.length / this.itensPorPagina);
  }

  get salasPaginadas(): Sala[] {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    return this.filteredSalas.slice(inicio, fim);
  }

  get paginasVisiveis(): number[] {
    const total = this.totalPaginas;
    const atual = this.paginaAtual;
    const delta = 2;
    const range: number[] = [];
    
    for (let i = Math.max(2, atual - delta); i <= Math.min(total - 1, atual + delta); i++) {
      range.push(i);
    }
    
    if (atual - delta > 2) {
      range.unshift(-1);
    }
    if (atual + delta < total - 1) {
      range.push(-1);
    }
    
    range.unshift(1);
    if (total > 1) {
      range.push(total);
    }
    
    return range;
  }

  get filtrosAtivos(): number {
    let count = 0;
    if (this.filtro.codigo) count++;
    if (this.filtro.nome) count++;
    if (this.filtro.tipo) count++;
    if (this.filtro.status) count++;
    return count;
  }

  selectedIds = new Set<number>();
  bulkAction = '';

  // Lote
  modalLoteVisible = false;
  statusLote: StatusSala = 'ativa';

  get totalSelecionados(): number { return this.selectedIds.size; }

  abrirModalLote(): void {
    if (this.selectedIds.size === 0) return;
    this.statusLote = 'ativa';
    this.modalLoteVisible = true;
  }

  confirmarLote(): void {
    this.modalLoteVisible = false;
    const ids = Array.from(this.selectedIds);
    
    this.salasService.atualizarStatusLote(ids, this.statusLote).subscribe({
      next: (response) => {
        this.carregarSalas();
        this.selectedIds.clear();
        this.showMessage(`${response.data.atualizados} sala(s) atualizada(s) com sucesso`, 'success');
      },
      error: (err) => {
        console.error('Erro ao atualizar status em lote:', err);
        this.showMessage('Erro ao atualizar status das salas', 'error');
      }
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

  constructor(private router: Router, private salasService: SalasService) {}

  ngOnInit(): void {
    this.carregarSalas();
  }

  carregarSalas(): void {
    this.loading = true;
    this.salasService.listarSalas().subscribe({
      next: (response) => {
        this.salas = response.data || [];
        this.filteredSalas = [...this.salas];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar salas:', err);
        this.showMessage('Erro ao carregar salas', 'error');
        this.loading = false;
      }
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
    const salasPage = document.querySelector('.salas-page') as HTMLElement;
    if (salasPage) {
      salasPage.style.setProperty('text-align', 'left', 'important');
      salasPage.style.setProperty('width', '100%', 'important');
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
    const nome   = this.filtro.nome.trim().toLowerCase();

    this.filteredSalas = this.salas.filter(s =>
      (!codigo            || s.codigo.toLowerCase().includes(codigo)) &&
      (!nome              || s.nome.toLowerCase().includes(nome)) &&
      (!this.filtro.tipo  || s.tipo === this.filtro.tipo) &&
      (!this.filtro.status|| s.status === this.filtro.status)
    );

    this.paginaAtual = 1;
    this.syncSelection();
  }

  resetFilters(): void {
    this.filtro = { codigo: '', nome: '', tipo: '', status: '' };
    this.applyFilters();
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaAtual = pagina;
    }
  }

  onItensPorPaginaChange(): void {
    this.paginaAtual = 1;
  }

  trackByIndex(i: number): number { return i; }

  isSelected(id: number): boolean { return this.selectedIds.has(id); }

  toggleSelection(id: number, selected: boolean): void {
    selected ? this.selectedIds.add(id) : this.selectedIds.delete(id);
  }

  toggleAll(checked: boolean): void {
    checked
      ? this.filteredSalas.forEach(s => s.id && this.selectedIds.add(s.id))
      : this.selectedIds.clear();
  }

  allSelected(): boolean {
    return this.filteredSalas.length > 0 &&
           this.filteredSalas.every(s => s.id && this.selectedIds.has(s.id));
  }

  syncSelection(): void {
    const validIds = new Set(this.filteredSalas.map(s => s.id).filter((id): id is number => id !== undefined));
    this.selectedIds.forEach(id => { if (!validIds.has(id)) this.selectedIds.delete(id); });
  }

  editSala(sala: Sala): void {
    this.router.navigate(['/salas', sala.id, 'editar']);
  }

  toggleStatus(sala: Sala): void {
    const acao = sala.status === 'ativa' ? 'desativar' : 'ativar';
    const novoStatus: StatusSala = sala.status === 'ativa' ? 'inativa' : 'ativa';
    this.openConfirm(
      acao === 'ativar' ? 'Ativar sala' : 'Desativar sala',
      `Deseja ${acao} a sala ${sala.codigo}?`,
      false,
      () => {
        if (sala.id) {
          this.salasService.atualizarStatus(sala.id, novoStatus).subscribe({
            next: () => {
              this.carregarSalas();
              this.showMessage(`Sala ${sala.codigo} ${novoStatus === 'ativa' ? 'ativada' : 'desativada'} com sucesso.`, 'success');
            },
            error: (err) => {
              console.error('Erro ao atualizar status:', err);
              this.showMessage('Erro ao atualizar status da sala', 'error');
            }
          });
        }
      }
    );
  }

  deleteSala(sala: Sala): void {
    this.openConfirm(
      'Excluir sala',
      `Tem certeza que deseja excluir a sala ${sala.codigo}? Esta ação não pode ser desfeita.`,
      true,
      () => {
        if (sala.id) {
          this.salasService.excluirSala(sala.id).subscribe({
            next: () => {
              this.carregarSalas();
              this.showMessage(`Sala ${sala.codigo} excluída com sucesso.`, 'success');
            },
            error: (err) => {
              console.error('Erro ao excluir sala:', err);
              this.showMessage('Erro ao excluir sala', 'error');
            }
          });
        }
      }
    );
  }

  performBulkAction(): void {
    if (!this.bulkAction) { this.showMessage('Selecione uma ação em lote.', 'error'); return; }
    if (this.selectedIds.size === 0) { this.showMessage('Selecione ao menos uma sala.', 'error'); return; }

    const count = this.selectedIds.size;
    const label = count === 1 ? '1 sala' : `${count} salas`;

    if (this.bulkAction === 'excluir') {
      this.openConfirm('Excluir salas', `Tem certeza que deseja excluir ${label}? Esta ação não pode ser desfeita.`, true, () => {
        this.salas = this.salas.filter(s => s.id && !this.selectedIds.has(s.id));
        this.selectedIds.clear(); this.bulkAction = '';
        this.applyFilters();
        this.showMessage('Salas excluídas com sucesso.', 'success');
      });
      return;
    }

    const novoStatus: StatusSala = this.bulkAction === 'ativar' ? 'ativa' : 'inativa';
    const acao = novoStatus === 'ativa' ? 'ativar' : 'desativar';
    this.openConfirm(
      `${acao.charAt(0).toUpperCase() + acao.slice(1)} salas`,
      `Deseja ${acao} ${label} selecionada${count > 1 ? 's' : ''}?`,
      false,
      () => {
        this.salas = this.salas.map(s => (s.id && this.selectedIds.has(s.id)) ? { ...s, status: novoStatus } : s);
        this.selectedIds.clear(); this.bulkAction = '';
        this.applyFilters();
        this.showMessage(`Salas ${novoStatus === 'ativa' ? 'ativadas' : 'desativadas'} com sucesso.`, 'success');
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
