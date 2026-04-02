import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

type StatusSala = 'ativa' | 'inativa';
type TipoSala = 'sala-de-aula' | 'laboratorio' | 'auditorio' | 'biblioteca' | 'quadra' | 'outro';

interface SalaFormModel {
  codigo: string;
  nome: string;
  tipo: TipoSala | '';
  capacidade: number | null;
  bloco: string;
  andar: string;
  projetor: boolean;
  arCondicionado: boolean;
  ventilador: boolean;
  computadores: boolean;
  acessibilidade: boolean;
  status: StatusSala | '';
  observacoes: string;
}

@Component({
  selector: 'app-sala-form',
  templateUrl: './sala-form.component.html',
  styleUrls: ['./sala-form.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class SalaFormComponent {
  salaId: string | null = null;
  message = '';
  messageType: 'success' | 'error' = 'success';

  readonly tiposList: { value: TipoSala; label: string }[] = [
    { value: 'sala-de-aula', label: 'Sala de Aula' },
    { value: 'laboratorio',  label: 'Laboratório' },
    { value: 'auditorio',    label: 'Auditório' },
    { value: 'biblioteca',   label: 'Biblioteca' },
    { value: 'quadra',       label: 'Quadra' },
    { value: 'outro',        label: 'Outro' },
  ];

  model: SalaFormModel = {
    codigo: '',
    nome: '',
    tipo: '',
    capacidade: null,
    bloco: '',
    andar: '',
    projetor: false,
    arCondicionado: false,
    ventilador: false,
    computadores: false,
    acessibilidade: false,
    status: '',
    observacoes: ''
  };

  constructor(private route: ActivatedRoute, private router: Router) {
    this.salaId = this.route.snapshot.paramMap.get('id');

    if (this.salaId) {
      this.model = {
        codigo: '101',
        nome: 'Sala 101',
        tipo: 'sala-de-aula',
        capacidade: 35,
        bloco: 'A',
        andar: 'Térreo',
        projetor: true,
        arCondicionado: true,
        ventilador: false,
        computadores: false,
        acessibilidade: false,
        status: 'ativa',
        observacoes: ''
      };
    }
  }

  submit(formValid: boolean): void {
    if (!formValid) {
      this.showMessage('Preencha todos os campos obrigatórios.', 'error');
      return;
    }
    this.showMessage(
      this.salaId ? 'Sala atualizada com sucesso!' : 'Sala cadastrada com sucesso!',
      'success'
    );
    setTimeout(() => this.router.navigate(['/salas']), 1200);
  }

  cancel(): void {
    this.router.navigate(['/salas']);
  }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
  }
}
