import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface EventoEscolar {
  idEvento?: number;
  titulo: string;
  descricao: string;
  tipoEvento: 'prova' | 'simulado' | 'reuniao' | 'passeio' | 'feira' | 
              'palestra' | 'feriado' | 'evento_institucional' | 'outro';
  dataInicio: string;
  dataFim: string;
  diaInteiro: boolean;
  turma?: string;
  disciplina?: string;
  educador?: string;
  sala?: string;
  cor: string;
  status: 'planejado' | 'confirmado' | 'cancelado' | 'concluido';
  observacoes?: string;
}

export interface CriarEventoRequest {
  titulo: string;
  descricao: string;
  tipoEvento: string;
  dataInicio: string;
  dataFim: string;
  diaInteiro: boolean;
  idTurma?: number;
  idDisciplina?: number;
  idEducador?: number;
  idSala?: number;
  cor: string;
  status: string;
  notificar: boolean;
  observacoes?: string;
}

export interface CalendarioMensal {
  eventos: EventoEscolar[];
  aulas_recorrentes: any[];
  mes: number;
  ano: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventosService {
  private apiUrl = `${environment.apiUrl}/eventos`;

  constructor(private http: HttpClient) {}

  // ==================== CRUD BÁSICO ====================

  /**
   * Lista eventos escolares com filtros
   */
  listar(filtros?: {
    tipo?: string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Observable<{
    success: boolean;
    data: EventoEscolar[];
    message: string;
  }> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.tipo) params = params.set('tipo', filtros.tipo);
      if (filtros.status) params = params.set('status', filtros.status);
      if (filtros.dataInicio) params = params.set('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params = params.set('dataFim', filtros.dataFim);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  /**
   * Lista eventos de uma turma específica
   */
  listarPorTurma(idTurma: number): Observable<{
    success: boolean;
    data: EventoEscolar[];
    message: string;
  }> {
    return this.http.get<any>(`${this.apiUrl}/turma/${idTurma}`);
  }

  /**
   * Retorna calendário mensal com eventos e aulas
   */
  buscarCalendarioMensal(ano: number, mes: number, idTurma?: number): Observable<{
    success: boolean;
    data: CalendarioMensal;
    message: string;
  }> {
    let url = `${this.apiUrl}/calendario/${ano}/${mes}`;
    
    if (idTurma) {
      const params = new HttpParams().set('idTurma', idTurma.toString());
      return this.http.get<any>(url, { params });
    }

    return this.http.get<any>(url);
  }

  /**
   * Cria um novo evento
   */
  criar(evento: CriarEventoRequest): Observable<{
    success: boolean;
    data: { id: number };
    message: string;
  }> {
    return this.http.post<any>(this.apiUrl, evento);
  }

  /**
   * Atualiza um evento
   */
  atualizar(idEvento: number, evento: CriarEventoRequest): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.put<any>(`${this.apiUrl}/${idEvento}`, evento);
  }

  /**
   * Remove um evento
   */
  deletar(idEvento: number): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.delete<any>(`${this.apiUrl}/${idEvento}`);
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Retorna ícone baseado no tipo de evento
   */
  getIconePorTipo(tipo: string): string {
    const icones: { [key: string]: string } = {
      'prova': 'assignment',
      'simulado': 'quiz',
      'reuniao': 'groups',
      'passeio': 'directions_bus',
      'feira': 'store',
      'palestra': 'mic',
      'feriado': 'event_busy',
      'evento_institucional': 'account_balance',
      'outro': 'event'
    };
    return icones[tipo] || 'event';
  }

  /**
   * Retorna cor padrão baseada no tipo de evento
   */
  getCorPorTipo(tipo: string): string {
    const cores: { [key: string]: string } = {
      'prova': '#FF5722',
      'simulado': '#FF9800',
      'reuniao': '#2196F3',
      'passeio': '#4CAF50',
      'feira': '#9C27B0',
      'palestra': '#00BCD4',
      'feriado': '#F44336',
      'evento_institucional': '#3F51B5',
      'outro': '#9E9E9E'
    };
    return cores[tipo] || '#2196F3';
  }

  /**
   * Formata tipo de evento para exibição
   */
  formatarTipo(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'prova': 'Prova',
      'simulado': 'Simulado',
      'reuniao': 'Reunião',
      'passeio': 'Passeio',
      'feira': 'Feira',
      'palestra': 'Palestra',
      'feriado': 'Feriado',
      'evento_institucional': 'Evento Institucional',
      'outro': 'Outro'
    };
    return tipos[tipo] || tipo;
  }

  /**
   * Formata status para exibição
   */
  formatarStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'planejado': 'Planejado',
      'confirmado': 'Confirmado',
      'cancelado': 'Cancelado',
      'concluido': 'Concluído'
    };
    return statusMap[status] || status;
  }

  /**
   * Converte eventos para formato do FullCalendar
   */
  converterParaCalendario(eventos: EventoEscolar[]): any[] {
    return eventos.map(e => ({
      id: e.idEvento?.toString(),
      title: e.titulo,
      start: e.dataInicio,
      end: e.dataFim,
      allDay: e.diaInteiro,
      backgroundColor: e.cor || this.getCorPorTipo(e.tipoEvento),
      borderColor: e.cor || this.getCorPorTipo(e.tipoEvento),
      extendedProps: {
        tipo: e.tipoEvento,
        descricao: e.descricao,
        turma: e.turma,
        disciplina: e.disciplina,
        educador: e.educador,
        sala: e.sala,
        status: e.status,
        observacoes: e.observacoes
      }
    }));
  }

  /**
   * Verifica se evento está próximo (menos de 24h)
   */
  isEventoProximo(dataInicio: string): boolean {
    const agora = new Date();
    const inicio = new Date(dataInicio);
    const diferencaMs = inicio.getTime() - agora.getTime();
    const diferencaHoras = diferencaMs / (1000 * 60 * 60);
    
    return diferencaHoras > 0 && diferencaHoras <= 24;
  }

  /**
   * Verifica se evento já passou
   */
  isEventoPassado(dataFim: string): boolean {
    const agora = new Date();
    const fim = new Date(dataFim);
    return fim < agora;
  }

  /**
   * Verifica se evento está acontecendo agora
   */
  isEventoEmAndamento(dataInicio: string, dataFim: string): boolean {
    const agora = new Date();
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    return agora >= inicio && agora <= fim;
  }

  /**
   * Agrupa eventos por tipo
   */
  agruparPorTipo(eventos: EventoEscolar[]): { [tipo: string]: EventoEscolar[] } {
    return eventos.reduce((acc, evento) => {
      const tipo = evento.tipoEvento;
      if (!acc[tipo]) {
        acc[tipo] = [];
      }
      acc[tipo].push(evento);
      return acc;
    }, {} as { [tipo: string]: EventoEscolar[] });
  }

  /**
   * Agrupa eventos por status
   */
  agruparPorStatus(eventos: EventoEscolar[]): { [status: string]: EventoEscolar[] } {
    return eventos.reduce((acc, evento) => {
      const status = evento.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(evento);
      return acc;
    }, {} as { [status: string]: EventoEscolar[] });
  }

  /**
   * Filtra eventos por data
   */
  filtrarPorPeriodo(eventos: EventoEscolar[], dataInicio: Date, dataFim: Date): EventoEscolar[] {
    return eventos.filter(e => {
      const eventoInicio = new Date(e.dataInicio);
      const eventoFim = new Date(e.dataFim);
      
      return (eventoInicio >= dataInicio && eventoInicio <= dataFim) ||
             (eventoFim >= dataInicio && eventoFim <= dataFim) ||
             (eventoInicio <= dataInicio && eventoFim >= dataFim);
    });
  }

  /**
   * Exporta eventos para formato CSV
   */
  exportarCSV(eventos: EventoEscolar[]): string {
    const headers = ['Título', 'Tipo', 'Data Início', 'Data Fim', 'Turma', 'Status'];
    const rows = eventos.map(e => [
      e.titulo,
      this.formatarTipo(e.tipoEvento),
      e.dataInicio,
      e.dataFim,
      e.turma || '-',
      this.formatarStatus(e.status)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Baixa arquivo CSV
   */
  downloadCSV(eventos: EventoEscolar[], filename: string = 'eventos.csv'): void {
    const csv = this.exportarCSV(eventos);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
