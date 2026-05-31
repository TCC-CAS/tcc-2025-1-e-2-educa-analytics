import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Fornecedor {
  id: number;
  tipo: 'PF' | 'PJ';
  nome: string;
  razaoSocial?: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  centroCusto: string;
  categoria: string;
  tipoDespesa: string;
  ativo: boolean;
  ultimoPagamento?: string;
  valorMensalMedio: number;
  qtdContratos: number;
  scoreEntrega: number;
  scorePontualidade: number;
  scoreQualidade: number;
  observacoes?: string;
}

@Injectable({ providedIn: 'root' })
export class FornecedoresService {
  private apiUrl = `${environment.apiUrl}/fornecedores`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Fornecedor[]> {
    return this.http.get<Fornecedor[]>(this.apiUrl);
  }

  buscar(id: number): Observable<Fornecedor> {
    return this.http.get<Fornecedor>(`${this.apiUrl}/${id}`);
  }

  criar(fornecedor: Partial<Fornecedor>): Observable<Fornecedor> {
    return this.http.post<Fornecedor>(this.apiUrl, fornecedor);
  }

  atualizar(id: number, fornecedor: Partial<Fornecedor>): Observable<Fornecedor> {
    return this.http.put<Fornecedor>(`${this.apiUrl}/${id}`, fornecedor);
  }

  excluir(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  alterarStatus(id: number, ativo: boolean): Observable<Fornecedor> {
    return this.http.patch<Fornecedor>(`${this.apiUrl}/${id}/status`, { ativo });
  }

  alterarStatusLote(ids: number[], ativo: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/lote/status`, { ids, ativo });
  }

  excluirLote(ids: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/lote/excluir`, { ids });
  }

  buscarCep(cep: string): Observable<any> {
    return this.http.get(`https://viacep.com.br/ws/${cep}/json/`);
  }
}
