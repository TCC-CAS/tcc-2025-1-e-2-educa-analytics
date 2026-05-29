import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface MatrizCurricular {
  id?: number;
  serie: string;
  idDisciplina: number;
  cargaHorariaSemanal: number;
  cargaHorariaAnual?: number;
  anoLetivo: number;
  status: 'ativa' | 'inativa';
  observacoes?: string;
  disciplina?: {
    id: number;
    codigo: string;
    nome: string;
    areaConhecimento?: string;
  };
}

export interface CreateMatrizCurricular {
  serie: string;
  idDisciplina: number;
  cargaHorariaSemanal: number;
  anoLetivo: number;
  status?: 'ativa' | 'inativa';
  observacoes?: string;
  motivoAlteracao?: string;
}

export interface UpdateMatrizCurricular {
  serie: string;
  idDisciplina: number;
  cargaHorariaSemanal: number;
  anoLetivo: number;
  status?: 'ativa' | 'inativa';
  observacoes?: string;
  motivoAlteracao?: string;
}

export interface MatrizHistorico {
  id: number;
  idMatriz: number | null;
  serie: string;
  idDisciplina: number;
  nomeDisciplina: string;
  codDisciplina: string;
  cargaHorariaSemanal: number;
  cargaHorariaAnual: number;
  anoLetivo: number;
  status: 'ativa' | 'inativa';
  acao: 'criado' | 'atualizado' | 'excluido';
  motivoAlteracao?: string;
  registradoEm: string;
}

export interface ItemSerie {
  idDisciplina: number;
  cargaHorariaSemanal: number;
  observacoes?: string;
}

export interface SalvarSerieRequest {
  serie: string;
  anoLetivo: number;
  disciplinas: ItemSerie[];
  motivoAlteracao?: string;
}

export interface SalvarSerieResult {
  criados: number;
  atualizados: number;
  inativados: number;
  message: string;
}

export interface CopiarMatrizRequest {
  anoOrigem: number;
  anoDestino: number;
  series?: string[];
}

export interface CopiarMatrizResult {
  copiadas: number;
  ignoradas: number;
  message: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

@Injectable({
  providedIn: 'root'
})
export class MatrizCurricularService {
  private readonly baseUrl = `${environment.apiUrl}/matriz-curricular`;

  constructor(private http: HttpClient) {}

  /** Lista toda a matriz curricular, opcionalmente filtrada por ano letivo e/ou série */
  listar(params?: { anoLetivo?: number; serie?: string }): Observable<MatrizCurricular[]> {
    let httpParams = new HttpParams();
    if (params?.anoLetivo) {
      httpParams = httpParams.set('anoLetivo', params.anoLetivo.toString());
    }
    if (params?.serie) {
      httpParams = httpParams.set('serie', params.serie);
    }
    return this.http.get<MatrizCurricular[]>(this.baseUrl, { params: httpParams });
  }

  /** Busca uma entrada específica pelo ID */
  buscar(id: number): Observable<MatrizCurricular> {
    return this.http.get<MatrizCurricular>(`${this.baseUrl}/${id}`);
  }

  /** Cria uma nova entrada na matriz curricular */
  criar(dados: CreateMatrizCurricular): Observable<any> {
    return this.http.post<any>(this.baseUrl, dados);
  }

  /** Atualiza uma entrada da matriz curricular */
  atualizar(id: number, dados: UpdateMatrizCurricular): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, dados);
  }

  /** Exclui uma entrada da matriz curricular */
  excluir(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  /** Lista todas as séries disponíveis para um ano letivo */
  listarSeries(anoLetivo: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/series/${anoLetivo}`);
  }

  /** Salva (cria/atualiza) a grade completa de uma série */
  salvarSerie(dados: SalvarSerieRequest): Observable<SalvarSerieResult> {
    return this.http.put<SalvarSerieResult>(`${this.baseUrl}/serie`, dados);
  }

  /** Lista todos os anos letivos que possuem entradas na matriz */
  listarAnosLetivos(): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/anos-letivos`);
  }

  /** Copia a matriz de um ano letivo para outro */
  copiarParaAno(dados: CopiarMatrizRequest): Observable<CopiarMatrizResult> {
    return this.http.post<CopiarMatrizResult>(`${this.baseUrl}/copiar`, dados);
  }

  /** Lista o histórico de alterações */
  listarHistorico(params?: {
    serie?: string;
    anoLetivo?: number;
    idMatriz?: number;
    limit?: number;
  }): Observable<MatrizHistorico[]> {
    let httpParams = new HttpParams();
    if (params?.serie)      httpParams = httpParams.set('serie', params.serie);
    if (params?.anoLetivo)  httpParams = httpParams.set('anoLetivo', params.anoLetivo.toString());
    if (params?.idMatriz)   httpParams = httpParams.set('idMatriz', params.idMatriz.toString());
    if (params?.limit)      httpParams = httpParams.set('limit', params.limit.toString());
    return this.http.get<MatrizHistorico[]>(`${this.baseUrl}/historico`, { params: httpParams });
  }

  /** Lista disciplinas de uma série específica */
  listarPorSerie(serie: string, anoLetivo: number): Observable<MatrizCurricular[]> {
    return this.listar({ anoLetivo, serie });
  }
}
