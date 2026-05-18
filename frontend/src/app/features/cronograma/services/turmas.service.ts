import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface Turma {
  id: number;
  codigo: string;
  nome: string;
  serie: string;
  periodo: 'matutino' | 'vespertino' | 'noturno' | 'integral';
  anoLetivo: number;
  vagas: number;
  dataInicio: string;
  dataFim: string;
  status: 'ativa' | 'encerrada' | 'suspensa';
  idSala?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TurmasService {

  constructor(private api: ApiService) { }

  listarAnosLetivos(): Observable<number[]> {
    return this.api.get<number[]>('/anos-letivos');
  }

  listarTurmas(anoLetivo?: number): Observable<Turma[]> {
    const endpoint = anoLetivo 
      ? `/turmas?anoLetivo=${anoLetivo}`
      : '/turmas';
    return this.api.get<Turma[]>(endpoint);
  }

  buscarTurma(id: number): Observable<Turma> {
    return this.api.get<Turma>(`/turmas/${id}`);
  }
}
