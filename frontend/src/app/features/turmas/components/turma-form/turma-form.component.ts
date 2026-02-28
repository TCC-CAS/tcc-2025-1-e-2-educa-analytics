import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

type StatusTurma = 'ativa' | 'inativa';

type Turno = 'Manha' | 'Tarde' | 'Noite';

type PeriodoLetivo = '2025.1' | '2025.2' | '2026.1';

type Serie = '1' | '2' | '3';

interface TurmaFormModel {
  codigo: string;
  descricao: string;
  turno: Turno | '';
  periodoLetivo: PeriodoLetivo | '';
  serie: Serie | '';
  vagas: number | null;
  inicioAulas: string;
  fimAulas: string;
  status: StatusTurma | '';
}

@Component({
  selector: 'app-turma-form',
  templateUrl: './turma-form.component.html',
  styleUrls: ['./turma-form.component.scss']
})
export class TurmaFormComponent {
  turmaId: string | null = null;
  message = '';
  messageType: 'success' | 'error' = 'success';

  model: TurmaFormModel = {
    codigo: '',
    descricao: '',
    turno: '',
    periodoLetivo: '',
    serie: '',
    vagas: null,
    inicioAulas: '',
    fimAulas: '',
    status: ''
  };

  constructor(private route: ActivatedRoute, private router: Router) {
    this.turmaId = this.route.snapshot.paramMap.get('id');

    if (this.turmaId) {
      this.model = {
        codigo: 'T-002',
        descricao: '2 ano B',
        turno: 'Tarde',
        periodoLetivo: '2025.2',
        serie: '2',
        vagas: 28,
        inicioAulas: '2025-08-05',
        fimAulas: '2025-12-18',
        status: 'inativa'
      };
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
      this.showMessage('Turma editada com sucesso.', 'success');
      return;
    }

    this.showMessage('Turma cadastrada com sucesso.', 'success');
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  cancel(): void {
    this.router.navigate(['/turmas']);
  }
}
