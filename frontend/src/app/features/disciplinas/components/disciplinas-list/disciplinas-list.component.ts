import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

type StatusDisciplina = 'ativa' | 'inativa';

type Serie = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

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
  styleUrls: ['./disciplinas-list.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class DisciplinasListComponent implements AfterViewInit {
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
    this.disciplinas = this.disciplinas.map(d =>
      this.selectedIds.has(d.id) ? { ...d, status: this.statusLote } : d
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
      if (performance.now() - startTime < 1200) requestAnimationFrame(frameLoop);
    };
    requestAnimationFrame(frameLoop);
    const observer = new MutationObserver(() => this.forceLeftAlignmentStyles());
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    setTimeout(() => observer.disconnect(), 2000);
  }

  private forceLeftAlignmentStyles(): void {
    const host = document.querySelector('app-disciplinas-list') as HTMLElement;
    if (host) { host.style.setProperty('text-align', 'left', 'important'); host.style.setProperty('display', 'block', 'important'); host.style.setProperty('width', '100%', 'important'); }
    const page = document.querySelector('.disciplinas-page') as HTMLElement;
    if (page) { page.style.setProperty('text-align', 'left', 'important'); page.style.setProperty('width', '100%', 'important'); }
    const pageHeader = document.querySelector('.disciplinas-page .page-header') as HTMLElement;
    if (pageHeader) {
      pageHeader.style.setProperty('text-align', 'left', 'important');
      pageHeader.style.setProperty('align-items', 'flex-start', 'important');
      pageHeader.style.setProperty('justify-content', 'flex-start', 'important');
    }
    (document.querySelectorAll('.disciplinas-page .page-header h1, .disciplinas-page .page-header p') as NodeListOf<HTMLElement>).forEach(el => {
      el.style.setProperty('text-align', 'left', 'important');
    });
    (document.querySelectorAll('.disciplinas-page .filters .field') as NodeListOf<HTMLElement>).forEach(el => {
      el.style.setProperty('text-align', 'left', 'important');
      el.style.setProperty('align-items', 'flex-start', 'important');
    });
    const toolbar = document.querySelector('.disciplinas-page .toolbar') as HTMLElement;
    if (toolbar) { toolbar.style.setProperty('text-align', 'left', 'important'); toolbar.style.setProperty('justify-content', 'flex-start', 'important'); }
  }

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
    const acao = disciplina.status === 'ativa' ? 'desativar' : 'ativar';
    this.openConfirm(
      `${acao.charAt(0).toUpperCase() + acao.slice(1)} disciplina`,
      `Deseja ${acao} a disciplina ${disciplina.abreviatura}?`,
      acao === 'desativar',
      () => {
        disciplina.status = disciplina.status === 'ativa' ? 'inativa' : 'ativa';
        this.showMessage(`Disciplina ${disciplina.abreviatura} ${disciplina.status === 'ativa' ? 'ativada' : 'desativada'} com sucesso.`, 'success');
      }
    );
  }

  deleteDisciplina(disciplina: Disciplina): void {
    this.openConfirm(
      'Excluir disciplina',
      `Tem certeza que deseja excluir a disciplina ${disciplina.abreviatura}? Esta ação não pode ser desfeita.`,
      true,
      () => {
        this.disciplinas = this.disciplinas.filter((item) => item.id !== disciplina.id);
        this.applyFilters();
        this.showMessage(`Disciplina ${disciplina.abreviatura} excluída com sucesso.`, 'success');
      }
    );
  }

  performBulkAction(): void {
    if (!this.bulkAction) { this.showMessage('Selecione uma ação em lote.', 'error'); return; }
    if (this.selectedIds.size === 0) { this.showMessage('Selecione ao menos uma disciplina.', 'error'); return; }
    const n = this.selectedIds.size;
    const acaoLabel = this.bulkAction === 'excluir' ? 'excluir' : this.bulkAction === 'ativar' ? 'ativar' : 'desativar';
    const isDanger = this.bulkAction === 'excluir' || this.bulkAction === 'desativar';
    const snap = this.bulkAction;
    this.openConfirm(
      'Ação em lote',
      `Deseja ${acaoLabel} ${n} disciplina(s) selecionada(s)?`,
      isDanger,
      () => {
        if (snap === 'excluir') {
          this.disciplinas = this.disciplinas.filter(d => !this.selectedIds.has(d.id));
          this.selectedIds.clear(); this.bulkAction = '';
          this.applyFilters();
          this.showMessage('Disciplinas excluídas com sucesso.', 'success');
          return;
        }
        const status: StatusDisciplina = snap === 'ativar' ? 'ativa' : 'inativa';
        this.disciplinas = this.disciplinas.map(d => this.selectedIds.has(d.id) ? { ...d, status } : d);
        this.selectedIds.clear(); this.bulkAction = '';
        this.applyFilters();
        this.showMessage(`Disciplinas ${status === 'ativa' ? 'ativadas' : 'desativadas'} com sucesso.`, 'success');
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
