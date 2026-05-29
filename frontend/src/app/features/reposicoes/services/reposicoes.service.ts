import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ReposicaoAula {
  idReposicao: number;
  dataCancelamento: string;
  motivoCancelamento: string;
  dataReposicao?: string;
  horaInicio?: string;
  horaFim?: string;
  status: 'pendente' | 'agendada' | 'realizada' | 'dispensada';
  turma: string;
  disciplina: string;
  educador: string;
  sala?: string;
  observacoes?: string;
}

export interface RegistrarCancelamentoRequest {
  idCronogramaOriginal: number;
  dataCancelamento: string;
  motivoCancelamento: string;
  observacoes?: string;
}

export interface AgendarReposicaoRequest {
  dataReposicao: string;
  horaInicio: string;
  horaFim: string;
  idSala?: number;
}

export interface SugestaoReposicao {
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  motivo: string;
  idSala?: number;
  nomeSala?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReposicoesService {
  private apiUrl = `${environment.apiUrl}/reposicoes`;

  constructor(private http: HttpClient) {}

  // ==================== CRUD E LISTAGENS ====================

  /**
   * Lista reposições com filtro de status opcional
   */
  listar(status?: 'pendente' | 'agendada' | 'realizada' | 'dispensada'): Observable<{
    success: boolean;
    data: ReposicaoAula[];
    message: string;
  }> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  /**
   * Lista apenas reposições pendentes
   */
  listarPendentes(): Observable<{
    success: boolean;
    data: ReposicaoAula[];
    message: string;
  }> {
    return this.http.get<any>(`${this.apiUrl}/pendentes`);
  }

  /**
   * Registra cancelamento de aula
   */
  registrarCancelamento(dados: RegistrarCancelamentoRequest): Observable<{
    success: boolean;
    data: { id: number };
    message: string;
  }> {
    return this.http.post<any>(`${this.apiUrl}/cancelamento`, dados);
  }

  /**
   * Agenda data/horário da reposição
   */
  agendarReposicao(idReposicao: number, dados: AgendarReposicaoRequest): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.post<any>(`${this.apiUrl}/${idReposicao}/agendar`, dados);
  }

  /**
   * Marca reposição como realizada
   */
  marcarRealizada(idReposicao: number): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.patch<any>(`${this.apiUrl}/${idReposicao}/realizada`, {});
  }

  /**
   * Sugere horários para reposição
   */
  buscarSugestoes(idReposicao: number): Observable<{
    success: boolean;
    data: SugestaoReposicao[];
    message: string;
  }> {
    return this.http.get<any>(`${this.apiUrl}/${idReposicao}/sugestoes`);
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Formata status para exibição
   */
  formatarStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pendente': 'Pendente',
      'agendada': 'Agendada',
      'realizada': 'Realizada',
      'dispensada': 'Dispensada'
    };
    return statusMap[status] || status;
  }

  /**
   * Retorna cor baseada no status
   */
  getCorPorStatus(status: string): string {
    const cores: { [key: string]: string } = {
      'pendente': '#FF9800',
      'agendada': '#2196F3',
      'realizada': '#4CAF50',
      'dispensada': '#9E9E9E'
    };
    return cores[status] || '#2196F3';
  }

  /**
   * Retorna ícone baseado no status
   */
  getIconePorStatus(status: string): string {
    const icones: { [key: string]: string } = {
      'pendente': 'schedule',
      'agendada': 'event_available',
      'realizada': 'check_circle',
      'dispensada': 'cancel'
    };
    return icones[status] || 'event';
  }

  /**
   * Calcula dias desde o cancelamento
   */
  calcularDiasDesdeCancelamento(dataCancelamento: string): number {
    const cancelamento = new Date(dataCancelamento);
    const hoje = new Date();
    const diferencaMs = hoje.getTime() - cancelamento.getTime();
    return Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica se reposição está atrasada (mais de 30 dias pendente)
   */
  isReposicaoAtrasada(reposicao: ReposicaoAula): boolean {
    if (reposicao.status !== 'pendente') {
      return false;
    }
    const dias = this.calcularDiasDesdeCancelamento(reposicao.dataCancelamento);
    return dias > 30;
  }

  /**
   * Agrupa reposições por status
   */
  agruparPorStatus(reposicoes: ReposicaoAula[]): { [status: string]: ReposicaoAula[] } {
    return reposicoes.reduce((acc, reposicao) => {
      const status = reposicao.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(reposicao);
      return acc;
    }, {} as { [status: string]: ReposicaoAula[] });
  }

  /**
   * Filtra reposições por educador
   */
  filtrarPorEducador(reposicoes: ReposicaoAula[], educador: string): ReposicaoAula[] {
    return reposicoes.filter(r => 
      r.educador.toLowerCase().includes(educador.toLowerCase())
    );
  }

  /**
   * Calcula estatísticas das reposições
   */
  calcularEstatisticas(reposicoes: ReposicaoAula[]): any {
    return {
      total: reposicoes.length,
      pendentes: reposicoes.filter(r => r.status === 'pendente').length,
      agendadas: reposicoes.filter(r => r.status === 'agendada').length,
      realizadas: reposicoes.filter(r => r.status === 'realizada').length,
      dispensadas: reposicoes.filter(r => r.status === 'dispensada').length
    };
  }

  /**
   * Exporta reposições para CSV
   */
  downloadCSV(reposicoes: ReposicaoAula[]): void {
    const headers = ['ID', 'Data Cancelamento', 'Turma', 'Disciplina', 'Educador', 'Status', 'Data Reposição', 'Horário'];
    const rows = reposicoes.map(r => [
      r.idReposicao,
      r.dataCancelamento,
      r.turma,
      r.disciplina,
      r.educador,
      this.formatarStatus(r.status),
      r.dataReposicao || '-',
      r.horaInicio && r.horaFim ? `${r.horaInicio} - ${r.horaFim}` : '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reposicoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
