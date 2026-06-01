import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface Disciplina {
  id: number;
  codigo: string;
  nome: string;
  cargaHoraria?: number;
  areaConhecimento: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DisciplinasService {

  constructor(private api: ApiService) { }

  listarDisciplinas(status: 'ativa' | 'inativa' = 'ativa'): Observable<Disciplina[]> {
    return this.api.get<Disciplina[]>(`/cronograma/disciplinas?status=${status}`);
  }

  buscarDisciplina(id: number): Observable<Disciplina> {
    return this.api.get<Disciplina>(`/cronograma/disciplinas/${id}`);
  }
}
