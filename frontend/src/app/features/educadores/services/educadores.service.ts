import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface TurmaEducador {
  idTurma: number;
  codigo?: string;
  codigo_automatico?: string;
  nome?: string;
  nome_completo?: string;
  serie?: string;
  periodo?: string;
  turno?: string;
  anoLetivo?: string | number;
  sala?: string;
  nomeSala?: string;
  vagas?: number;
  capacidade_maxima?: number;
  vagasOcupadas?: number;
  capacidade_atual?: number;
  status?: string;
  disciplinas?: DisciplinaEducador[];
}

export interface DisciplinaEducador {
  idDisciplina: number;
  nomeDisciplina: string;
  codDisciplina?: string;
  area?: string;
  aulasSemanais?: number;
  carga_horaria_semanal?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EducadoresService {

  constructor(private api: ApiService) { }

  /**
   * Busca as turmas que o educador leciona
   * @param matricula Matrícula do educador
   */
  listarTurmasEducador(matricula: string): Observable<TurmaEducador[]> {
    return this.api.get<TurmaEducador[]>(`/educador/${matricula}/turmas`);
  }
}
