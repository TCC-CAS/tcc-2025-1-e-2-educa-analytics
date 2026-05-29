import { Component, OnInit } from '@angular/core';
import { CronogramaService, HorarioCronograma, Atividade } from '../../services/cronograma.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-cronograma-educando',
  templateUrl: './cronograma-educando.component.html',
  styleUrls: ['./cronograma-educando.component.scss']
})
export class CronogramaEducandoComponent implements OnInit {
  horarios: HorarioCronograma[] = [];
  atividades: Atividade[] = [];
  loading: boolean = false;
  idMatricula: string = '';
  turmaInfo: any = null;
  
  diasSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  gradeSemanal: { [dia: string]: HorarioCronograma[] } = {};

  constructor(
    private cronogramaService: CronogramaService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const usuario = this.authService.getCurrentUser();
    this.idMatricula = usuario?.matricula || '';
    
    if (this.idMatricula) {
      this.carregarMeuCronograma();
      this.carregarAtividades();
    }
  }

  carregarMeuCronograma(): void {
    this.loading = true;
    this.cronogramaService.listarCronogramaEducando(this.idMatricula).subscribe({
      next: (response) => {
        this.horarios = response.horarios || [];
        this.turmaInfo = response.turma;
        this.organizarPorDia();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar cronograma', err);
        this.loading = false;
      }
    });
  }

  carregarAtividades(): void {
    // Carrega apenas atividades publicadas
    this.cronogramaService.listarAtividades({ status: 'publicada' }).subscribe({
      next: (response) => {
        this.atividades = response.atividades.slice(0, 5); // Apenas 5 mais recentes
      },
      error: (err) => console.error('Erro ao carregar atividades', err)
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
      segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
      quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb'
    };
    return labels[dia] || dia;
  }
}
