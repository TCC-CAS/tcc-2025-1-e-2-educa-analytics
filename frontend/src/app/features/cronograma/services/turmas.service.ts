import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

export interface AnoLetivo {
  id: number;    // idAnoLetivo no banco (ex: 2)
  ano: number;   // ano civil (ex: 2026)
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TurmasService {

  constructor(private api: ApiService) { }

  listarAnosLetivos(): Observable<AnoLetivo[]> {
    return this.api.get<any>('/anos-letivos').pipe(
      map((res: any) => {
        const lista: any[] = Array.isArray(res) ? res : (res?.anos_letivos || []);
        return lista.map((a: any) => ({
          id: a.idAnoLetivo as number,
          ano: a.ano as number,
          status: a.status
        }));
      })
    );
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
