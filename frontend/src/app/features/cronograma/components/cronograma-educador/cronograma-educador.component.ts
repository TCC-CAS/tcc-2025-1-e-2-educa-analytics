import { Component, OnInit } from '@angular/core';
import { CronogramaService, HorarioCronograma } from '../../services/cronograma.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-cronograma-educador',
  templateUrl: './cronograma-educador.component.html',
  styleUrls: ['./cronograma-educador.component.scss']
})
export class CronogramaEducadorComponent implements OnInit {
  horarios: HorarioCronograma[] = [];
  loading: boolean = false;
  idEducador: string = '';
  
  diasSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  gradeSemanal: { [dia: string]: HorarioCronograma[] } = {};

  constructor(
    private cronogramaService: CronogramaService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Pegar ID do educador logado
    const usuario = this.authService.getCurrentUser();
    this.idEducador = usuario?.matricula || '';
    
    if (this.idEducador) {
      this.carregarMeusHorarios();
    }
  }

  carregarMeusHorarios(): void {
    this.loading = true;
    this.cronogramaService.listarCronogramaEducador(this.idEducador).subscribe({
      next: (horarios) => {
        this.horarios = horarios;
        this.organizarPorDia();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar horários', err);
        this.loading = false;
      }
    });
  }

  organizarPorDia(): void {
    this.gradeSemanal = {};
    this.diasSemana.forEach(dia => {
      this.gradeSemanal[dia] = this.horarios
        .filter(h => h.diaSemana === dia)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    });
  }

  getDiaLabel(dia: string): string {
    const labels: { [key: string]: string } = {
      segunda: 'Segunda-feira',
      terca: 'Terça-feira',
      quarta: 'Quarta-feira',
      quinta: 'Quinta-feira',
      sexta: 'Sexta-feira',
      sabado: 'Sábado'
    };
    return labels[dia] || dia;
  }
}
