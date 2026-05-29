import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface AreaConhecimento {
  id: number;
  nome: string;
  sigla: string;
  descricao?: string;
  cor?: string;
  ordem?: number;
}

export interface TipoDisciplina {
  id: number;
  nome: string;
  codigo: string;
  descricao?: string;
  cor?: string;
  ordem?: number;
}

export interface EtapaEnsino {
  id: number;
  nome: string;
  codigo: string;
  descricao?: string;
  ordem?: number;
}

export interface Disciplina {
  id?: number;
  codigo: string;
  nome: string;
  cargaHoraria: number;
  cargaHorariaAnual?: number;
  cargaHorariaTeorica?: number;
  cargaHorariaPratica?: number;
  descricao?: string;
  status: 'ativa' | 'inativa';
  
  // Relacionamentos
  areaConhecimento?: {
    id: number;
    nome: string;
    sigla: string;
    cor?: string;
  } | null;
  
  tipoDisciplina?: {
    id: number;
    nome: string;
    codigo: string;
    cor?: string;
  } | null;
  
  etapaEnsino?: {
    id: number;
    nome: string;
    codigo: string;
  } | null;
  
  // Configurações pedagógicas
  notaMinima?: number;
  frequenciaMinima?: number;
  permiteRecuperacao?: boolean;
  pesoAvaliacao?: number;
  
  // Competências BNCC
  competenciasBNCC?: string;
  objetivosAprendizagem?: string;
  preRequisitos?: string;
}

export interface OfertaDisciplina {
  id?: number;
  idTurma: number;
  idDisciplina: number;
  idEducador?: string;
  codTurma?: string;
  nomeTurma?: string;
  codDisciplina?: string;
  nomeDisciplina?: string;
  nomeEducador?: string;
  areaConhecimento?: string;
  tipoDisciplina?: string;
  cargaHorariaSemanal?: number;
  cargaHorariaTotal?: number;
  semanasLetivas?: number;
  aulasPorSemana?: number;
  duracaoAulaMinutos?: number;
  cargaHorariaTeorica?: number;
  cargaHorariaPratica?: number;
  diaSemana?: string;
  horario?: string;
  status?: 'planejada' | 'em_andamento' | 'concluida' | 'cancelada';
  observacoes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DisciplinasService {
  private readonly baseUrl = environment.apiUrl;
  private readonly disciplinasUrl = `${this.baseUrl}/disciplinas`;
  private readonly areasUrl = `${this.baseUrl}/areas-conhecimento`;
  private readonly tiposUrl = `${this.baseUrl}/tipos-disciplina`;
  private readonly etapasUrl = `${this.baseUrl}/etapas-ensino`;
  private readonly ofertasUrl = `${this.baseUrl}/ofertas`;

  constructor(private http: HttpClient) { }

  // ══════════════════════════════════════════════════════════════════════════
  // ÁREAS DE CONHECIMENTO (BNCC)
  // ══════════════════════════════════════════════════════════════════════════

  listarAreas(): Observable<AreaConhecimento[]> {
    return this.http.get<AreaConhecimento[]>(this.areasUrl);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TIPOS DE DISCIPLINA
  // ══════════════════════════════════════════════════════════════════════════

  listarTipos(): Observable<TipoDisciplina[]> {
    return this.http.get<TipoDisciplina[]>(this.tiposUrl);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ETAPAS DE ENSINO
  // ══════════════════════════════════════════════════════════════════════════

  listarEtapas(): Observable<EtapaEnsino[]> {
    return this.http.get<EtapaEnsino[]>(this.etapasUrl);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DISCIPLINAS (Base Reutilizável)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Lista todas as disciplinas com informações completas
   * @param status Filtro opcional por status ('ativa', 'inativa')
   */
  listar(status?: 'ativa' | 'inativa'): Observable<Disciplina[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Disciplina[]>(this.disciplinasUrl, { params });
  }

  /**
   * Busca uma disciplina por ID
   * @param id ID da disciplina
   */
  buscar(id: number): Observable<Disciplina> {
    return this.http.get<Disciplina>(`${this.disciplinasUrl}/${id}`);
  }

  /**
   * Cria uma nova disciplina
   * @param disciplina Dados da disciplina
   */
  criar(disciplina: Omit<Disciplina, 'id'>): Observable<{ id: number; message?: string }> {
    return this.http.post<{ id: number; message?: string }>(this.disciplinasUrl, disciplina);
  }

  /**
   * Atualiza uma disciplina existente
   * @param id ID da disciplina
   * @param disciplina Dados atualizados
   */
  atualizar(id: number, disciplina: Partial<Disciplina>): Observable<{ id: number; message?: string }> {
    return this.http.put<{ id: number; message?: string }>(`${this.disciplinasUrl}/${id}`, disciplina);
  }

  /**
   * Deleta (inativa) uma disciplina
   * @param id ID da disciplina
   */
  deletar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.disciplinasUrl}/${id}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // OFERTAS DE DISCIPLINAS (turma_disciplinas)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Lista ofertas de disciplinas (opcionalmente por turma)
   * @param idTurma ID da turma para filtrar (opcional)
   */
  listarOfertas(idTurma?: number): Observable<OfertaDisciplina[]> {
    let params = new HttpParams();
    if (idTurma) {
      params = params.set('idTurma', idTurma.toString());
    }
    return this.http.get<OfertaDisciplina[]>(this.ofertasUrl, { params });
  }

  /**
   * Cria uma nova oferta de disciplina
   * @param oferta Dados da oferta
   */
  criarOferta(oferta: Omit<OfertaDisciplina, 'id'>): Observable<{ id: number; message?: string }> {
    return this.http.post<{ id: number; message?: string }>(this.ofertasUrl, oferta);
  }

  /**
   * Atualiza uma oferta existente
   * @param id ID da oferta
   * @param oferta Dados atualizados
   */
  atualizarOferta(id: number, oferta: Partial<OfertaDisciplina>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.ofertasUrl}/${id}`, oferta);
  }

  /**
   * Deleta uma oferta
   * @param id ID da oferta
   */
  deletarOferta(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.ofertasUrl}/${id}`);
  }
}
