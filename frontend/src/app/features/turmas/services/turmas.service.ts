import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Turma {
  id: number;
  codigo: string;
  nome: string;
  turno: string;
  anoLetivo: string;
  serie: string;
  sala: string;
  idSala?: number | null;
  status: string;
  vagas: number;
  vagasOcupadas?: number;
  inicioAulas: string;
  fimAulas: string;
  educandos?: Educando[];
}

export interface Educando {
  idMatricula: string;
  nome: string;
  serie: string;
  status: string;
}

export interface Sala {
  id: number;
  nome: string;
  codigo: string;
  tipo: string;
  status: string;
  capacidade: number;
  bloco: string;
  andar: string;
  recursos?: any;
  projetor?: boolean;
  arCondicionado?: boolean;
  ventilador?: boolean;
  computadores?: boolean;
  acessibilidade?: boolean;
  observacoes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TurmasService {
  private apiUrl = `${environment.apiUrl}/turmas`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Turma[]> {
    return this.http.get<Turma[]>(this.apiUrl);
  }

  buscar(id: number): Observable<Turma> {
    return this.http.get<Turma>(`${this.apiUrl}/${id}`);
  }

  criar(turma: Partial<Turma>): Observable<Turma> {
    return this.http.post<Turma>(this.apiUrl, turma);
  }

  atualizar(id: number, turma: Partial<Turma>): Observable<Turma> {
    return this.http.put<Turma>(`${this.apiUrl}/${id}`, turma);
  }

  deletar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  alterarStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status });
  }

  alterarStatusLote(ids: number[], status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/lote/status`, { ids, status });
  }

  listarEducandos(idTurma: number): Observable<Educando[]> {
    return this.http.get<Educando[]>(`${this.apiUrl}/${idTurma}/educandos`);
  }

  listarSalas(): Observable<Sala[]> {
    return this.http.get<Sala[]>(`${environment.apiUrl}/salas`);
  }
}
