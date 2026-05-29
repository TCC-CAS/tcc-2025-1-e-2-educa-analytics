import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Lancamento {
  id?: number;
  data: string;
  tipoConta: string;
  formaPagamento: string;
  tipoDespesa: string;
  centroCusto: string;
  descricao: string;
  fornecedor: string;
  valor: number;
  usuario: string;
  /** true = projeção futura (aparece no Fluxo Projetado) */
  projetado?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CaixaService {
  private apiUrl = `${environment.apiUrl}/caixa`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Lancamento[]> {
    return this.http.get<Lancamento[]>(this.apiUrl);
  }

  listarFluxoProjetado(dias: number = 30): Observable<Lancamento[]> {
    return this.http.get<Lancamento[]>(`${this.apiUrl}/fluxo-projetado?dias=${dias}`);
  }

  buscar(id: number): Observable<Lancamento> {
    return this.http.get<Lancamento>(`${this.apiUrl}/${id}`);
  }

  criar(lancamento: Omit<Lancamento, 'id'>): Observable<Lancamento> {
    return this.http.post<Lancamento>(this.apiUrl, lancamento);
  }

  atualizar(id: number, lancamento: Partial<Lancamento>): Observable<Lancamento> {
    return this.http.put<Lancamento>(`${this.apiUrl}/${id}`, lancamento);
  }

  excluir(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  excluirLote(ids: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/lote/excluir`, { ids });
  }
}
