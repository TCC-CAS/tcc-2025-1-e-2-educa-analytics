import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface Evento {
  id?: number;
  nomeEvento: string;
  dataEvento: string;
  horarioEvento: string;
  serieEscolar: string;
  descricao: string;
}

@Component({
  selector: 'app-evento-form',
  templateUrl: './evento-form.component.html',
  styleUrls: ['./evento-form.component.scss']
})
export class EventoFormComponent implements OnInit {
  eventoId: number | null = null;
  isEdicao: boolean = false;
  
  evento: Evento = {
    nomeEvento: '',
    dataEvento: '',
    horarioEvento: '',
    serieEscolar: '',
    descricao: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventoId = parseInt(id);
      this.isEdicao = true;
      this.carregarEvento();
    }
  }

  carregarEvento(): void {
    // Mock - substituir por chamada à API
    this.evento = {
      id: this.eventoId!,
      nomeEvento: 'Feira de Ciências',
      dataEvento: '2026-03-15',
      horarioEvento: '14:00',
      serieEscolar: '6º Ano',
      descricao: 'Apresentação de projetos científicos dos alunos do 6º ano. Os estudantes demonstrarão experimentos e pesquisas desenvolvidas ao longo do semestre.'
    };
  }

  salvar(form: any): void {
    if (!form.valid) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (this.isEdicao) {
      console.log('Atualizar evento:', this.evento);
      // Implementar chamada à API
    } else {
      console.log('Criar novo evento:', this.evento);
      // Implementar chamada à API
    }

    this.voltar();
  }

  voltar(): void {
    this.router.navigate(['/eventos']);
  }
}
