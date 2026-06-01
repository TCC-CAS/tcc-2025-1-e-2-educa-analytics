import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DisciplinasService, Disciplina } from '../../services/disciplinas.service';

type StatusDisciplina = 'ativa' | 'inativa';

interface DisciplinaOption {
  nome: string;
  codigo: string;
}

const DISCIPLINAS_OPCOES: DisciplinaOption[] = [
  { nome: 'LÍNGUA PORTUGUESA',    codigo: 'LP' },
  { nome: 'ARTE',                 codigo: 'ART' },
  { nome: 'EDUCAÇÃO FÍSICA',      codigo: 'EDF' },
  { nome: 'LÍNGUA INGLESA',       codigo: 'LI' },
  { nome: 'MATEMÁTICA',           codigo: 'MAT' },
  { nome: 'CIÊNCIAS DA NATUREZA', codigo: 'CN' },
  { nome: 'GEOGRAFIA',            codigo: 'GEO' },
  { nome: 'HISTÓRIA',             codigo: 'HIS' },
];

@Component({
  selector: 'app-disciplina-form',
  templateUrl: './disciplina-form.component.html',
  styleUrls: ['./disciplina-form.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class DisciplinaFormComponent implements OnInit {
  disciplinaId: number | null = null;
  message = '';
  messageType: 'success' | 'error' = 'success';
  confirmVisible = false;
  isLoading = false;

  readonly disciplinasOpcoes = DISCIPLINAS_OPCOES;

  model: Disciplina = {
    codigo: '',
    nome: '',
    cargaHoraria: 0,
    descricao: '',
    status: 'ativa'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private disciplinasService: DisciplinasService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.disciplinaId = parseInt(id, 10);
      this.carregarDisciplina();
    }
  }

  carregarDisciplina(): void {
    if (!this.disciplinaId) return;
    
    this.isLoading = true;
    this.disciplinasService.buscar(this.disciplinaId).subscribe({
      next: (disciplina) => {
        this.model = { ...disciplina };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar disciplina:', error);
        this.showMessage('Erro ao carregar disciplina', 'error');
        this.isLoading = false;
      }
    });
  }

  onNomeChange(): void {
    const opcao = DISCIPLINAS_OPCOES.find(d => d.nome === this.model.nome);
    if (opcao) {
      this.model.codigo = opcao.codigo;
    } else {
      this.model.codigo = '';
    }
  }

  submit(formValid: boolean): void {
    if (!formValid) {
      this.showMessage('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    if (this.disciplinaId) {
      this.confirmVisible = true;
      return;
    }

    // Criar nova disciplina
    this.isLoading = true;
    this.disciplinasService.criar({
      codigo: this.model.codigo,
      nome: this.model.nome,
      cargaHoraria: 0,
      descricao: this.model.descricao,
      status: this.model.status
    }).subscribe({
      next: () => {
        this.showMessage('Disciplina cadastrada com sucesso.', 'success');
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/disciplinas']);
        }, 1500);
      },
      error: (error) => {
        console.error('Erro ao criar disciplina:', error);
        const msg = error.error?.message || 'Erro ao cadastrar disciplina';
        this.showMessage(msg, 'error');
        this.isLoading = false;
      }
    });
  }

  confirmEdit(): void {
    this.confirmVisible = false;
    
    if (!this.disciplinaId) return;
    
    this.isLoading = true;
    this.disciplinasService.atualizar(this.disciplinaId, {
      codigo: this.model.codigo,
      nome: this.model.nome,
      descricao: this.model.descricao,
      status: this.model.status
    }).subscribe({
      next: () => {
        this.showMessage('Disciplina editada com sucesso.', 'success');
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/disciplinas']);
        }, 1500);
      },
      error: (error) => {
        console.error('Erro ao atualizar disciplina:', error);
        const msg = error.error?.message || 'Erro ao atualizar disciplina';
        this.showMessage(msg, 'error');
        this.isLoading = false;
      }
    });
  }

  cancelConfirm(): void {
    this.confirmVisible = false;
  }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
  }

  cancel(): void {
    this.router.navigate(['/disciplinas']);
  }
}

