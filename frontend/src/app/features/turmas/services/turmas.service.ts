import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  // Novos campos da estrutura profissional
  idTurma?: number;
  codigo_automatico?: string;
  nome_completo?: string;
  nomeTurma?: string;
  idSerie?: number;
  idPeriodo?: number;
  idAnoLetivo?: number;
  capacidade_maxima?: number;
  capacidade_atual?: number;
  vagas_disponiveis?: number;
  percentual_ocupacao?: number;
  idCoordenador?: string;
  observacoes?: string;
  serie_nome?: string;
  serie_codigo?: string;
  periodo_nome?: string;
  periodo_codigo?: string;
  ano_letivo?: string | number;
  ano_letivo_status?: string;
  coordenador_nome?: string;
  nomeSala?: string;
  sala_capacidade?: number;
  hora_inicio?: string;
  hora_fim?: string;
  disciplinas?: TurmaDisciplina[];
}

export interface TurmaDisciplina {
  idDisciplina: number;
  nomeDisciplina: string;
  idEducador?: string;
  educador_nome?: string;
  carga_horaria_semanal: number;
}

export interface Serie {
  idSerie: number;
  codigo: string;
  nome: string;
  nivel_ensino: string;
  ano_escolar: number;
  descricao?: string;
}

export interface Periodo {
  idPeriodo: number;
  codigo: string;
  nome: string;
  hora_inicio: string;
  hora_fim: string;
  descricao?: string;
}

export interface AnoLetivo {
  idAnoLetivo: number;
  ano: number;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  status: 'planejamento' | 'em_andamento' | 'encerrado';
}

export interface HistoricoEvento {
  idHistorico: number;
  tipo_evento: string;
  descricao: string;
  usuario?: string;
  data_evento: string;
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
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        const turmas = response.turmas || response || [];
        // Mapear codTurma para codigo para compatibilidade
        return turmas.map((turma: any) => ({
          ...turma,
          codigo: turma.codTurma || turma.codigo
        }));
      })
    );
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
    return this.http.get<Sala[]>(`${environment.apiUrl}/salas`).pipe(
      map((response: any) => {
        console.log('[TURMAS-SERVICE] Resposta bruta da API /salas:', response);
        console.log('[TURMAS-SERVICE] Tipo da resposta:', typeof response);
        console.log('[TURMAS-SERVICE] É array?', Array.isArray(response));
        
        // Verificar se a resposta veio encapsulada em { data: [] } ou diretamente como array
        const salas = Array.isArray(response) ? response : (response?.data || response || []);
        
        console.log('[TURMAS-SERVICE] Salas após processamento:', salas);
        console.log('[TURMAS-SERVICE] Total de salas:', salas.length);
        if (salas.length > 0) {
          console.log('[TURMAS-SERVICE] Primeira sala:', salas[0]);
          console.log('[TURMAS-SERVICE] Status das salas:', salas.map((s: any) => s.status));
        }
        
        return salas;
      })
    );
  }

  // Novos métodos da estrutura profissional

  listarSeries(): Observable<{ sucesso: boolean; series: Serie[]; total: number }> {
    return this.http.get<{ sucesso: boolean; series: Serie[]; total: number }>(`${environment.apiUrl}/series`);
  }

  listarPeriodos(): Observable<{ sucesso: boolean; periodos: Periodo[]; total: number }> {
    return this.http.get<{ sucesso: boolean; periodos: Periodo[]; total: number }>(`${environment.apiUrl}/periodos`);
  }

  listarAnosLetivos(): Observable<{ sucesso: boolean; anos_letivos: AnoLetivo[]; total: number }> {
    return this.http.get<{ sucesso: boolean; anos_letivos: AnoLetivo[]; total: number }>(`${environment.apiUrl}/anos-letivos`);
  }

  buscarAnoLetivoAtual(): Observable<{ sucesso: boolean; ano_letivo: AnoLetivo }> {
    return this.http.get<{ sucesso: boolean; ano_letivo: AnoLetivo }>(`${environment.apiUrl}/anos-letivos/atual`);
  }

  listarDisciplinasSerie(idSerie: number): Observable<{ sucesso: boolean; disciplinas: any[]; total: number }> {
    return this.http.get<{ sucesso: boolean; disciplinas: any[]; total: number }>(`${environment.apiUrl}/series/${idSerie}/disciplinas`);
  }

  buscarHistoricoTurma(idTurma: number): Observable<{ sucesso: boolean; historico: HistoricoEvento[]; total: number }> {
    return this.http.get<{ sucesso: boolean; historico: HistoricoEvento[]; total: number }>(`${this.apiUrl}/${idTurma}/historico`);
  }

  validarOcupacaoSala(salaId: number, periodoId: number, anoLetivoId: number, turmaId?: number): Observable<{ disponivel: boolean; turma_existente?: any }> {
    let params = `sala_id=${salaId}&periodo_id=${periodoId}&ano_letivo_id=${anoLetivoId}`;
    if (turmaId) {
      params += `&turma_id=${turmaId}`;
    }
    return this.http.get<{ disponivel: boolean; turma_existente?: any }>(`${this.apiUrl}/validar-sala?${params}`);
  }

  relatorioOcupacaoSalas(anoLetivoId?: number): Observable<{ sucesso: boolean; salas: any[] }> {
    const params = anoLetivoId ? `?ano_letivo_id=${anoLetivoId}` : '';
    return this.http.get<{ sucesso: boolean; salas: any[] }>(`${this.apiUrl}/relatorio-ocupacao${params}`);
  }
}
