import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TurmasService, Sala } from '../../services/turmas.service';

type StatusTurma = 'ativa' | 'inativa';

type Turno = 'Manhã' | 'Tarde' | 'Noite' | 'Integral';

type Serie = '1º Ano EF' | '2º Ano EF' | '3º Ano EF' | '4º Ano EF' | '5º Ano EF' | '6º Ano EF' | '7º Ano EF' | '8º Ano EF' | '9º Ano EF';

interface TurmaFormModel {
  codigo: string;
  nome: string;
  turno: Turno | '';
  anoLetivo: string;
  serie: Serie | '';
  idSala: number | null;
  vagas: number | null | undefined;
  inicioAulas: string;
  fimAulas: string;
  status: StatusTurma | '';
}

@Component({
  selector: 'app-turma-form',
  templateUrl: './turma-form.component.html',
  styleUrls: ['./turma-form.component.scss']
})
export class TurmaFormComponent implements OnInit {
  turmaId: string | null = null;
  message = '';
  messageType: 'success' | 'error' = 'success';
  confirmVisible = false;
  carregando = false;
  salvando = false;
  salas: Sala[] = [];

  model: TurmaFormModel = {
    codigo: '',
    nome: '',
    turno: '',
    anoLetivo: '',
    serie: '',
    idSala: null,
    vagas: null,
    inicioAulas: '',
    fimAulas: '',
    status: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private turmasService: TurmasService,
  ) {}

  ngOnInit(): void {
    this.turmaId = this.route.snapshot.paramMap.get('id');
    this.turmasService.listarSalas().subscribe({
      next: (data) => { 
        // Filtrar apenas salas ativas e ordenar por nome
        this.salas = data
          .filter(s => s.status === 'ativa')
          .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
      },
      error: () => {},
    });
    if (this.turmaId) {
      this.carregando = true;
      this.turmasService.buscar(+this.turmaId).subscribe({
        next: (t) => {
          this.model = {
            codigo:      t.codigo       || '',
            nome:        t.nome         || '',
            turno:       (t.turno        || '') as Turno | '',
            anoLetivo:   t.anoLetivo    || '',
            serie:       (t.serie        || '') as Serie | '',
            idSala:      t.idSala       ?? null,
            vagas:       t.vagas        ?? null,
            inicioAulas: t.inicioAulas  || '',
            fimAulas:    t.fimAulas     || '',
            status:      (t.status       || '') as StatusTurma | '',
          };
          this.carregando = false;
        },
        error: () => {
          this.showMessage('Erro ao carregar dados da turma.', 'error');
          this.carregando = false;
        },
      });
    }
  }

  submit(formValid: boolean): void {
    if (!formValid) {
      this.showMessage('Preencha todos os campos obrigatorios.', 'error');
      return;
    }

    if (this.model.inicioAulas && this.model.fimAulas && this.model.inicioAulas > this.model.fimAulas) {
      this.showMessage('A data de inicio deve ser anterior ao termino.', 'error');
      return;
    }

    if (this.turmaId) {
      this.confirmVisible = true;
      return;
    }

    this.salvando = true;
    const payload = { ...this.model, vagas: this.model.vagas ?? undefined };
    this.turmasService.criar(payload).subscribe({
      next: () => {
        this.salvando = false;
        this.showMessage('Turma cadastrada com sucesso.', 'success');
        setTimeout(() => this.router.navigate(['/turmas']), 1500);
      },
      error: (err) => {
        this.salvando = false;
        const msg = err?.error?.error || 'Erro ao cadastrar turma.';
        this.showMessage(msg, 'error');
      },
    });
  }

  confirmEdit(): void {
    this.confirmVisible = false;
    this.salvando = true;
    const payload = { ...this.model, vagas: this.model.vagas ?? undefined };
    this.turmasService.atualizar(+this.turmaId!, payload).subscribe({
      next: () => {
        this.salvando = false;
        this.showMessage('Turma editada com sucesso.', 'success');
        setTimeout(() => this.router.navigate(['/turmas']), 1500);
      },
      error: (err) => {
        this.salvando = false;
        const msg = err?.error?.error || 'Erro ao editar turma.';
        this.showMessage(msg, 'error');
      },
    });
  }

  cancelConfirm(): void {
    this.confirmVisible = false;
  }

  onSalaChange(): void {
    if (this.model.idSala) {
      const salaEscolhida = this.salas.find(s => s.id === this.model.idSala);
      if (salaEscolhida && salaEscolhida.capacidade) {
        this.model.vagas = salaEscolhida.capacidade;
      }
    } else {
      // Se não selecionou sala, limpa as vagas
      this.model.vagas = null;
    }
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  cancel(): void {
    this.router.navigate(['/turmas']);
  }
}
