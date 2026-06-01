import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface Educador {
  id: number;
  matricula: string;
  nome: string;
  email: string;
  telefone?: string;
  especialidade: string;
  status: 'ativo' | 'inativo';
}

@Injectable({
  providedIn: 'root'
})
export class EducadoresService {

  constructor(private api: ApiService) { }

  listarEducadores(status: 'ativo' | 'inativo' = 'ativo'): Observable<Educador[]> {
    return this.api.get<Educador[]>(`/cronograma/educadores?status=${status}`);
  }

  listarEducadoresPorDisciplina(disciplinaId: number, status: 'ativo' | 'inativo' = 'ativo'): Observable<Educador[]> {
    return this.api.get<Educador[]>(`/cronograma/educadores?disciplinaId=${disciplinaId}&status=${status}`);
  }

  buscarEducador(id: number): Observable<Educador> {
    return this.api.get<Educador>(`/cronograma/educadores/${id}`);
  }
}
