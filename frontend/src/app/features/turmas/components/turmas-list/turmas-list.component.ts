import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

type StatusTurma = 'ativa' | 'inativa';

type Turno = 'Manhã' | 'Tarde' | 'Noite' | 'Integral';

type AnoLetivo = '2025' | '2026';

type Serie = '1º Ano' | '2º Ano' | '3º Ano' | '4º Ano' | '5º Ano' | '6º Ano' | '7º Ano' | '8º Ano' | '9º Ano' | '1ª Série EM' | '2ª Série EM' | '3ª Série EM';

interface Turma {
  id: number;
  codigo: string;
  nome: string;
  turno: Turno;
  anoLetivo: AnoLetivo;
  serie: Serie;
  sala: string;
  status: StatusTurma;
  vagas: number;
  inicioAulas: string;
  fimAulas: string;
}

interface TurmaFiltro {
  codigo: string;
  nome: string;
  turno: string;
  anoLetivo: string;
  serie: string;
  status: string;
}

interface Aluno {
  id: number;
  nome: string;
  serie: string;
  status: 'Ativa' | 'Trancada' | 'Cancelada';
}

@Component({
  selector: 'app-turmas-list',
  templateUrl: './turmas-list.component.html',
  styleUrls: ['./turmas-list.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;box-sizing:border-box;' }
})
export class TurmasListComponent implements AfterViewInit {
  turmas: Turma[] = [
    {
      id: 1,
      codigo: '1A',
      nome: '1A - Primeiro Ano A',
      turno: 'Manhã',
      anoLetivo: '2025',
      serie: '1º Ano',
      sala: 'Sala 101',
      status: 'ativa',
      vagas: 30,
      inicioAulas: '2025-02-10',
      fimAulas: '2025-12-15'
    },
    {
      id: 2,
      codigo: '2B',
      nome: '2B - Segundo Ano B',
      turno: 'Tarde',
      anoLetivo: '2025',
      serie: '2º Ano',
      sala: 'Sala 202',
      status: 'inativa',
      vagas: 28,
      inicioAulas: '2025-08-05',
      fimAulas: '2025-12-18'
    },
    {
      id: 3,
      codigo: '3A',
      nome: '3A - Terceiro Ano A',
      turno: 'Noite',
      anoLetivo: '2026',
      serie: '3º Ano',
      sala: 'Sala 301',
      status: 'ativa',
      vagas: 25,
      inicioAulas: '2026-02-02',
      fimAulas: '2026-12-10'
    }
  ];

  filteredTurmas: Turma[] = [...this.turmas];
  filtro: TurmaFiltro = {
    codigo: '',
    nome: '',
    turno: '',
    anoLetivo: '',
    serie: '',
    status: ''
  };

  private readonly educandosMock: Record<number, Aluno[]> = {
    1: [
      { id: 1, nome: 'Ana Paula Ferreira',    serie: '1º Ano', status: 'Ativa' },
      { id: 2, nome: 'Bruno Lima Souza',       serie: '1º Ano', status: 'Ativa' },
      { id: 3, nome: 'Carla Mendes Rodrigues', serie: '1º Ano', status: 'Trancada' },
    ],
    2: [
      { id: 4, nome: 'Daniel Costa Alves',   serie: '2º Ano', status: 'Ativa' },
      { id: 5, nome: 'Elisa Torres Martins', serie: '2º Ano', status: 'Ativa' },
    ],
    3: [
      { id: 6, nome: 'Felipe Ramos de Oliveira', serie: '3º Ano', status: 'Ativa' },
      { id: 7, nome: 'Gabriela Nunes Pereira',   serie: '3º Ano', status: 'Cancelada' },
      { id: 8, nome: 'Hugo Carvalho Silva',       serie: '3º Ano', status: 'Ativa' },
      { id: 9, nome: 'Isa Brandão Campos',        serie: '3º Ano', status: 'Ativa' },
    ],
  };

  turmaVisualizacao: Turma | null = null;
  get educandosTurma(): Aluno[] {
    return this.turmaVisualizacao ? (this.educandosMock[this.turmaVisualizacao.id] ?? []) : [];
  }

  verEducandos(turma: Turma): void {
    this.turmaVisualizacao = turma;
  }

  fecharEducandos(): void {
    this.turmaVisualizacao = null;
  }

  selectedIds = new Set<number>();
  bulkAction = '';

  // Lote
  modalLoteVisible = false;
  statusLote: StatusTurma = 'ativa';

  get totalSelecionados(): number { return this.selectedIds.size; }

  abrirModalLote(): void {
    if (this.selectedIds.size === 0) return;
    this.statusLote = 'ativa';
    this.modalLoteVisible = true;
  }

  confirmarLote(): void {
    this.modalLoteVisible = false;
    this.turmas = this.turmas.map(t =>
      this.selectedIds.has(t.id) ? { ...t, status: this.statusLote } : t
    );
    this.selectedIds.clear();
    this.applyFilters();
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

  constructor(private router: Router) { }

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
    const acao = turma.status === 'ativa' ? 'desativar' : 'ativar';
    this.openConfirm(
      `${acao.charAt(0).toUpperCase() + acao.slice(1)} turma`,
      `Tem certeza que deseja ${acao} a turma ${turma.codigo}?`,
      acao === 'desativar',
      () => {
        turma.status = turma.status === 'ativa' ? 'inativa' : 'ativa';
        this.showMessage(`Turma ${turma.codigo} ${turma.status === 'ativa' ? 'ativada' : 'desativada'} com sucesso.`, 'success');
      }
    );
  }

  deleteTurma(turma: Turma): void {
    this.openConfirm(
      'Excluir turma',
      `Tem certeza que deseja excluir a turma ${turma.codigo}? Esta ação não pode ser desfeita.`,
      true,
      () => {
        this.turmas = this.turmas.filter((item) => item.id !== turma.id);
        this.applyFilters();
        this.showMessage(`Turma ${turma.codigo} excluída com sucesso.`, 'success');
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
