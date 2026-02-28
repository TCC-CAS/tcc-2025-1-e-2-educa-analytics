import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

type StatusDisciplina = 'ativa' | 'inativa';

type Turno = 'Manha' | 'Tarde' | 'Noite';

type PeriodoLetivo = '2025.1' | '2025.2' | '2026.1';

type Serie = '1' | '2' | '3';

type AreaConhecimento = 'Linguagens' | 'Matematica' | 'Ciencias Humanas' | 'Ciencias da Natureza';

interface DisciplinaFormModel {
  abreviatura: string;
  nome: string;
  serie: Serie | '';
  periodoLetivo: PeriodoLetivo | '';
  turno: Turno | '';
  aulasSemanais: number | null;
  horasSemanais: number | null;
  horasAnuais: number | null;
  areaConhecimento: AreaConhecimento | '';
  status: StatusDisciplina | '';
}

@Component({
  selector: 'app-disciplina-form',
  templateUrl: './disciplina-form.component.html',
  styleUrls: ['./disciplina-form.component.scss']
})
export class DisciplinaFormComponent {
  disciplinaId: string | null = null;
  message = '';
  messageType: 'success' | 'error' = 'success';

  model: DisciplinaFormModel = {
    abreviatura: '',
    nome: '',
    serie: '',
    periodoLetivo: '',
    turno: '',
    aulasSemanais: null,
    horasSemanais: null,
    horasAnuais: null,
    areaConhecimento: '',
    status: ''
  };

  constructor(private route: ActivatedRoute, private router: Router) {
    this.disciplinaId = this.route.snapshot.paramMap.get('id');

    if (this.disciplinaId) {
      this.model = {
        abreviatura: 'POR',
        nome: 'Portugues',
        serie: '2',
        periodoLetivo: '2025.2',
        turno: 'Tarde',
        aulasSemanais: 4,
        horasSemanais: 3,
        horasAnuais: 120,
        areaConhecimento: 'Linguagens',
        status: 'inativa'
      };
    }
  }

  submit(formValid: boolean): void {
    if (!formValid) {
      this.showMessage('Preencha todos os campos obrigatorios.', 'error');
      return;
    }

    if (this.turmaHorasInvalidas()) {
      this.showMessage('Horas anuais devem ser maiores ou iguais as horas semanais.', 'error');
      return;
    }

    if (this.disciplinaId) {
      this.showMessage('Disciplina editada com sucesso.', 'success');
      return;
    }

    this.showMessage('Disciplina cadastrada com sucesso.', 'success');
  }

  turmaHorasInvalidas(): boolean {
    if (this.model.horasAnuais === null || this.model.horasSemanais === null) return false;
    return this.model.horasAnuais < this.model.horasSemanais;
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  cancel(): void {
    this.router.navigate(['/disciplinas']);
  }
}
