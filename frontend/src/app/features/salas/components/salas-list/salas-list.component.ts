import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

type StatusSala = 'ativa' | 'inativa';
type TipoSala = 'sala-de-aula' | 'laboratorio' | 'auditorio' | 'biblioteca' | 'quadra' | 'outro';

interface Sala {
  id: number;
  codigo: string;
  nome: string;
  tipo: TipoSala;
  capacidade: number;
  bloco: string;
  andar: string;
  projetor: boolean;
  arCondicionado: boolean;
  ventilador: boolean;
  computadores: boolean;
  acessibilidade: boolean;
  status: StatusSala;
}

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
export class SalasListComponent implements AfterViewInit {

  readonly tiposLabel: Record<TipoSala, string> = {
    'sala-de-aula': 'Sala de Aula',
    'laboratorio':  'Laboratório',
    'auditorio':    'Auditório',
    'biblioteca':   'Biblioteca',
    'quadra':       'Quadra',
    'outro':        'Outro'
  };

  salas: Sala[] = [
    { id: 1, codigo: '101',    nome: 'Sala 101',                    tipo: 'sala-de-aula', capacidade: 35,  bloco: 'A', andar: 'Térreo', projetor: true,  arCondicionado: true,  ventilador: false, computadores: false, acessibilidade: true,  status: 'ativa'   },
    { id: 2, codigo: '102',    nome: 'Sala 102',                    tipo: 'sala-de-aula', capacidade: 35,  bloco: 'A', andar: 'Térreo', projetor: false, arCondicionado: false, ventilador: true,  computadores: false, acessibilidade: false, status: 'ativa'   },
    { id: 3, codigo: '201',    nome: 'Sala 201',                    tipo: 'sala-de-aula', capacidade: 30,  bloco: 'A', andar: '1º',     projetor: true,  arCondicionado: true,  ventilador: false, computadores: false, acessibilidade: false, status: 'ativa'   },
    { id: 4, codigo: 'LAB-01', nome: 'Laboratório de Ciências',       tipo: 'laboratorio',  capacidade: 20,  bloco: 'B', andar: 'Térreo', projetor: true,  arCondicionado: true,  ventilador: false, computadores: false, acessibilidade: true,  status: 'ativa'   },
    { id: 5, codigo: 'LAB-02', nome: 'Laboratório de Informática',   tipo: 'laboratorio',  capacidade: 25,  bloco: 'B', andar: '1º',     projetor: true,  arCondicionado: true,  ventilador: false, computadores: true,  acessibilidade: false, status: 'ativa'   },
    { id: 6, codigo: 'AUD-01', nome: 'Auditório Principal',           tipo: 'auditorio',    capacidade: 150, bloco: 'C', andar: 'Térreo', projetor: true,  arCondicionado: true,  ventilador: false, computadores: false, acessibilidade: true,  status: 'ativa'   },
    { id: 7, codigo: '301',    nome: 'Sala 301',                    tipo: 'sala-de-aula', capacidade: 30,  bloco: 'A', andar: '2º',     projetor: false, arCondicionado: false, ventilador: true,  computadores: false, acessibilidade: false, status: 'inativa' }
  ];

  filteredSalas: Sala[] = [...this.salas];

  filtro: SalaFiltro = { codigo: '', nome: '', tipo: '', status: '' };

  selectedIds = new Set<number>();
  bulkAction = '';
  message = '';
  messageType: 'success' | 'error' = 'success';

  confirm = {
    visible: false,
    title: '',
    message: '',
    danger: false,
    callback: () => {}
  };

  constructor(private router: Router) {}

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

    this.syncSelection();
  }

  resetFilters(): void {
    this.filtro = { codigo: '', nome: '', tipo: '', status: '' };
    this.applyFilters();
  }

  isSelected(id: number): boolean { return this.selectedIds.has(id); }

  toggleSelection(id: number, selected: boolean): void {
    selected ? this.selectedIds.add(id) : this.selectedIds.delete(id);
  }

  toggleAll(checked: boolean): void {
    checked
      ? this.filteredSalas.forEach(s => this.selectedIds.add(s.id))
      : this.selectedIds.clear();
  }

  allSelected(): boolean {
    return this.filteredSalas.length > 0 &&
           this.filteredSalas.every(s => this.selectedIds.has(s.id));
  }

  syncSelection(): void {
    const validIds = new Set(this.filteredSalas.map(s => s.id));
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
        sala.status = novoStatus;
        this.applyFilters();
        this.showMessage(`Sala ${sala.codigo} ${novoStatus === 'ativa' ? 'ativada' : 'desativada'} com sucesso.`, 'success');
      }
    );
  }

  deleteSala(sala: Sala): void {
    this.openConfirm(
      'Excluir sala',
      `Tem certeza que deseja excluir a sala ${sala.codigo}? Esta ação não pode ser desfeita.`,
      true,
      () => {
        this.salas = this.salas.filter(s => s.id !== sala.id);
        this.applyFilters();
        this.showMessage(`Sala ${sala.codigo} excluída com sucesso.`, 'success');
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
        this.salas = this.salas.filter(s => !this.selectedIds.has(s.id));
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
        this.salas = this.salas.map(s => this.selectedIds.has(s.id) ? { ...s, status: novoStatus } : s);
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
