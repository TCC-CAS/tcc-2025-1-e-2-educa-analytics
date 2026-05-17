import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SalasService, Sala } from '../../services/salas.service';

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
export class SalaFormComponent implements OnInit {
  salaId: number | null = null;
  message = '';
  messageType: 'success' | 'error' = 'success';
  loading = false;

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private salasService: SalasService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.salaId = parseInt(id, 10);
      this.carregarSala(this.salaId);
    }
  }

  carregarSala(id: number): void {
    this.loading = true;
    this.salasService.buscarSala(id).subscribe({
      next: (response) => {
        const sala = response.data;
        this.model = {
          codigo: sala.codigo,
          nome: sala.nome,
          tipo: sala.tipo as TipoSala,
          capacidade: sala.capacidade,
          bloco: sala.bloco || '',
          andar: sala.andar || '',
          projetor: sala.projetor,
          arCondicionado: sala.arCondicionado,
          ventilador: sala.ventilador,
          computadores: sala.computadores,
          acessibilidade: sala.acessibilidade,
          status: sala.status,
          observacoes: sala.observacoes || ''
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar sala:', err);
        this.showMessage('Erro ao carregar dados da sala', 'error');
        this.loading = false;
        setTimeout(() => this.router.navigate(['/salas']), 2000);
      }
    });
  }

  submit(formValid: boolean): void {
    if (!formValid) {
      this.showMessage('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    if (!this.model.capacidade || this.model.capacidade <= 0) {
      this.showMessage('Capacidade deve ser maior que zero.', 'error');
      return;
    }

    // Validar que o status foi selecionado
    if (!this.model.status || (this.model.status !== 'ativa' && this.model.status !== 'inativa')) {
      this.showMessage('Selecione um status válido (Ativa ou Inativa).', 'error');
      return;
    }

    const salaData: Omit<Sala, 'id'> = {
      codigo: this.model.codigo,
      nome: this.model.nome,
      tipo: this.model.tipo as string,
      capacidade: this.model.capacidade,
      bloco: this.model.bloco,
      andar: this.model.andar,
      projetor: this.model.projetor,
      arCondicionado: this.model.arCondicionado,
      ventilador: this.model.ventilador,
      computadores: this.model.computadores,
      acessibilidade: this.model.acessibilidade,
      status: this.model.status as 'ativa' | 'inativa',
      observacoes: this.model.observacoes
    };

    this.loading = true;

    if (this.salaId) {
      // Atualizar sala existente
      this.salasService.atualizarSala(this.salaId, salaData).subscribe({
        next: () => {
          this.showMessage('Sala atualizada com sucesso!', 'success');
          setTimeout(() => this.router.navigate(['/salas']), 1200);
        },
        error: (err) => {
          console.error('Erro ao atualizar sala:', err);
          const errorMessage = err.error?.message || 'Erro ao atualizar sala';
          this.showMessage(errorMessage, 'error');
          this.loading = false;
        }
      });
    } else {
      // Criar nova sala
      this.salasService.criarSala(salaData).subscribe({
        next: () => {
          this.showMessage('Sala cadastrada com sucesso!', 'success');
          setTimeout(() => this.router.navigate(['/salas']), 1200);
        },
        error: (err) => {
          console.error('Erro ao cadastrar sala:', err);
          const errorMessage = err.error?.message || 'Erro ao cadastrar sala';
          this.showMessage(errorMessage, 'error');
          this.loading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/salas']);
  }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
  }
}
