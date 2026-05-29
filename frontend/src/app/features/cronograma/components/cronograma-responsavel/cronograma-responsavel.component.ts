import { Component, OnInit } from '@angular/core';
import { CronogramaService, HorarioCronograma } from '../../services/cronograma.service';
import { AuthService } from '../../../../core/services/auth.service';

interface FilhoInfo {
  filho: { idMatricula: string; nomeCompleto: string };
  turma: { idTurma: number; codTurma: string; nomeTurma: string };
  horarios: HorarioCronograma[];
}

@Component({
  selector: 'app-cronograma-responsavel',
  templateUrl: './cronograma-responsavel.component.html',
  styleUrls: ['./cronograma-responsavel.component.scss']
})
export class CronogramaResponsavelComponent implements OnInit {
  filhos: FilhoInfo[] = [];
  filhoSelecionado: FilhoInfo | null = null;
  loading: boolean = false;
  idResponsavel: string = '';
  
  diasSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  gradeSemanal: { [dia: string]: HorarioCronograma[] } = {};

  constructor(
    private cronogramaService: CronogramaService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const usuario = this.authService.getCurrentUser();
    this.idResponsavel = usuario?.matricula || '';
    
    if (this.idResponsavel) {
      this.carregarCronogramaFilhos();
    }
  }

  carregarCronogramaFilhos(): void {
    this.loading = true;
    this.cronogramaService.listarCronogramaResponsavel(this.idResponsavel).subscribe({
      next: (response) => {
        this.filhos = response.filhos || [];
        
        // Selecionar primeiro filho automaticamente
        if (this.filhos.length > 0) {
          this.selecionarFilho(this.filhos[0]);
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar cronograma dos filhos', err);
        this.loading = false;
      }
    });
  }

  selecionarFilho(filho: FilhoInfo): void {
    this.filhoSelecionado = filho;
    this.organizarPorDia(filho.horarios);
  }

  organizarPorDia(horarios: HorarioCronograma[]): void {
    this.gradeSemanal = {};
    this.diasSemana.forEach(dia => {
      this.gradeSemanal[dia] = horarios
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
