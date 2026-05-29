import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

export interface Sala {
  id: number;
  codigo: string;
  nome: string;
  tipo: string;
  capacidade: number;
  bloco?: string;
  andar?: string;
  projetor: boolean;
  arCondicionado: boolean;
  ventilador: boolean;
  computadores: boolean;
  acessibilidade: boolean;
  status: 'disponivel' | 'em-manutencao' | 'reservada' | 'interditada' | 'ativa' | 'inativa'; // Inclui legacy
  observacoes?: string;
}

export interface SalaForm extends Omit<Sala, 'id'> {
  id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SalasService {
  private endpoint = '/salas';

  constructor(private api: ApiService) { }

  listarSalas(): Observable<{ data: Sala[] }> {
    return this.api.get<Sala[]>(this.endpoint).pipe(
      map(salas => ({ data: salas }))
    );
  }

  buscarSala(id: number): Observable<{ data: Sala }> {
    return this.api.get<Sala>(`${this.endpoint}/${id}`).pipe(
      map(sala => ({ data: sala }))
    );
  }

  criarSala(sala: Omit<Sala, 'id'>): Observable<{ data: Sala }> {
    return this.api.post<Sala>(this.endpoint, sala).pipe(
      map(sala => ({ data: sala }))
    );
  }

  atualizarSala(id: number, sala: Omit<Sala, 'id'>): Observable<{ data: Sala }> {
    return this.api.put<Sala>(`${this.endpoint}/${id}`, sala).pipe(
      map(sala => ({ data: sala }))
    );
  }

  excluirSala(id: number): Observable<{ data: { deleted: number } }> {
    return this.api.delete<{ deleted: number }>(`${this.endpoint}/${id}`).pipe(
      map(result => ({ data: result }))
    );
  }

  atualizarStatus(id: number, status: 'disponivel' | 'em-manutencao' | 'reservada' | 'interditada'): Observable<{ data: { id: number; status: string } }> {
    return this.api.patch<{ id: number; status: string }>(`${this.endpoint}/${id}/status`, { status }).pipe(
      map(result => ({ data: result }))
    );
  }

  atualizarStatusLote(ids: number[], status: 'disponivel' | 'em-manutencao' | 'reservada' | 'interditada'): Observable<{ data: { atualizados: number } }> {
    return this.api.patch<{ atualizados: number }>(`${this.endpoint}/lote/status`, { ids, status }).pipe(
      map(result => ({ data: result }))
    );
  }
}
