import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

type StatusTurma = 'ativa' | 'inativa';

type Turno = 'Manhã' | 'Tarde' | 'Noite' | 'Integral';

type Serie = '1º Ano' | '2º Ano' | '3º Ano' | '4º Ano' | '5º Ano' | '6º Ano' | '7º Ano' | '8º Ano' | '9º Ano' | '1ª Série EM' | '2ª Série EM' | '3ª Série EM';

interface TurmaFormModel {
  codigo: string;
  nome: string;
  turno: Turno | '';
  anoLetivo: string;
  serie: Serie | '';
  sala: string;
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
  confirmVisible = false;

  model: TurmaFormModel = {
    codigo: '',
    nome: '',
    turno: '',
    anoLetivo: '',
    serie: '',
    sala: '',
    vagas: null,
    inicioAulas: '',
    fimAulas: '',
    status: ''
  };

  constructor(private route: ActivatedRoute, private router: Router) {
    this.turmaId = this.route.snapshot.paramMap.get('id');

    if (this.turmaId) {
      this.model = {
        codigo: '2B',
        nome: '2B - Segundo Ano B',
        turno: 'Tarde',
        anoLetivo: '2025',
        serie: '2º Ano',
        sala: 'Sala 202',
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
      this.confirmVisible = true;
      return;
    }

    this.showMessage('Turma cadastrada com sucesso.', 'success');
  }

  confirmEdit(): void {
    this.confirmVisible = false;
    this.showMessage('Turma editada com sucesso.', 'success');
  }

  cancelConfirm(): void {
    this.confirmVisible = false;
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  cancel(): void {
    this.router.navigate(['/turmas']);
  }
}
