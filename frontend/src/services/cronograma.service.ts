import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Cronograma {
  id?: number;
  turma: { id: number; codigo: string; nome: string };
  disciplina: { id: number; codigo: string; nome: string };
  educador: { id: number; nome: string };
  sala: { id: number; codigo: string; nome: string; capacidade: number };
  diaSemana: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';
  horaInicio: string;
  horaFim: string;
  status: 'ativa' | 'cancelada' | 'reposta' | 'suspensa';
  observacoes?: string;
}

export interface CriarAulaRequest {
  idTurma: number;
  idDisciplina: number;
  idEducador: number;
  idSala: number;
  idPeriodo?: number;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  recorrente?: boolean;
  observacoes?: string;
}

export interface GerarGradeRequest {
  idTurma: number;
  idPeriodo: number;
}

export interface GerarGradeResponse {
  success: boolean;
  aulas_criadas: number;
  conflitos: any[];
  avisos: string[];
  message: string;
}

export interface Conflito {
  idConflito: number;
  tipoConflito: 'educador_duplicado' | 'sala_duplicada' | 'turma_duplicada' | 
                'indisponibilidade' | 'capacidade_sala' | 'carga_horaria';
  descricao: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  diaSemana: string;
  horaInicio: string;
  resolvido: boolean;
  detectedAt: string;
}

export interface SugestaoHorario {
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  motivo: string;
}

export interface AuditoriaCronograma {
  idAuditoria: number;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE';
  campoAlterado: string;
  valorAnterior: string;
  valorNovo: string;
  nomeUsuario: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CronogramaService {
  private apiUrl = `${environment.apiUrl}/cronograma`;

  constructor(private http: HttpClient) {}

  // ==================== CRUD BÁSICO ====================

  /**
   * Lista horários com filtros opcionais
   */
  listar(filtros?: {
    idTurma?: number;
    idEducador?: number;
    diaSemana?: string;
  }): Observable<{ success: boolean; data: Cronograma[]; message: string }> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.idTurma) params = params.set('idTurma', filtros.idTurma.toString());
      if (filtros.idEducador) params = params.set('idEducador', filtros.idEducador.toString());
      if (filtros.diaSemana) params = params.set('diaSemana', filtros.diaSemana);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  /**
   * Busca um horário específico por ID
   */
  buscarPorId(id: number): Observable<{ success: boolean; data: Cronograma }> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cria um novo horário na grade
   */
  criar(dados: CriarAulaRequest): Observable<{ success: boolean; data: { id: number }; message: string }> {
    return this.http.post<any>(this.apiUrl, dados);
  }

  /**
   * Atualiza um horário existente
   */
  atualizar(id: number, dados: CriarAulaRequest): Observable<{ success: boolean; message: string }> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dados);
  }

  /**
   * Remove um horário
   */
  deletar(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // ==================== FUNCIONALIDADES AVANÇADAS ====================

  /**
   * Gera grade horária completa automaticamente
   */
  gerarGradeAutomatica(dados: GerarGradeRequest): Observable<GerarGradeResponse> {
    return this.http.post<GerarGradeResponse>(`${this.apiUrl}/gerar-automatico`, dados);
  }

  /**
   * Analisa e otimiza grade existente
   */
  otimizarGrade(idTurma: number): Observable<{
    success: boolean;
    analise: {
      janelas_vagas: number;
      dias_sobrecarregados: string[];
      dias_ociosos: string[];
    };
    total_aulas: number;
    recomendacoes: string[];
  }> {
    return this.http.post<any>(`${this.apiUrl}/otimizar`, { idTurma });
  }

  /**
   * Lista todos os conflitos detectados
   */
  listarConflitos(): Observable<{
    success: boolean;
    total: number;
    conflitos: Conflito[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/conflitos`);
  }

  /**
   * Sugere horários disponíveis
   */
  sugerirHorarios(dados: {
    idEducador?: number;
    idSala?: number;
    idTurma?: number;
  }): Observable<{
    success: boolean;
    data: SugestaoHorario[];
    message: string;
  }> {
    return this.http.post<any>(`${this.apiUrl}/sugerir-horarios`, dados);
  }

  /**
   * Lista todos os horários de um educador
   */
  listarPorEducador(idEducador: number): Observable<{
    success: boolean;
    data: Cronograma[];
    message: string;
  }> {
    return this.http.get<any>(`${this.apiUrl}/educador/${idEducador}`);
  }

  /**
   * Lista todos os horários de uma sala
   */
  listarPorSala(idSala: number): Observable<{
    success: boolean;
    data: Cronograma[];
    message: string;
  }> {
    return this.http.get<any>(`${this.apiUrl}/sala/${idSala}`);
  }

  /**
   * Retorna histórico de alterações de uma aula
   */
  buscarAuditoria(idCronograma: number): Observable<{
    success: boolean;
    data: AuditoriaCronograma[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/${idCronograma}/auditoria`);
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Converte array de horários em estrutura de calendário
   */
  converterParaCalendario(horarios: Cronograma[]): any[] {
    return horarios.map(h => ({
      id: h.id,
      title: `${h.disciplina.codigo} - ${h.turma.codigo}`,
      start: this.calcularDataHora(h.diaSemana, h.horaInicio),
      end: this.calcularDataHora(h.diaSemana, h.horaFim),
      backgroundColor: this.getCorPorStatus(h.status),
      extendedProps: {
        educador: h.educador.nome,
        sala: h.sala.codigo,
        turma: h.turma.nome,
        disciplina: h.disciplina.nome,
        status: h.status,
        observacoes: h.observacoes
      }
    }));
  }

  /**
   * Calcula data/hora a partir do dia da semana e hora
   */
  private calcularDataHora(diaSemana: string, hora: string): Date {
    const hoje = new Date();
    const diaSemanaAtual = hoje.getDay();
    
    const diasSemanaMap: { [key: string]: number } = {
      'domingo': 0,
      'segunda': 1,
      'terca': 2,
      'quarta': 3,
      'quinta': 4,
      'sexta': 5,
      'sabado': 6
    };
    
    const diaDestino = diasSemanaMap[diaSemana.toLowerCase()];
    const diferenca = diaDestino - diaSemanaAtual;
    
    const data = new Date(hoje);
    data.setDate(hoje.getDate() + diferenca);
    
    const [horas, minutos] = hora.split(':').map(Number);
    data.setHours(horas, minutos, 0, 0);
    
    return data;
  }

  /**
   * Retorna cor baseada no status
   */
  private getCorPorStatus(status: string): string {
    const cores: { [key: string]: string } = {
      'ativa': '#4CAF50',
      'cancelada': '#F44336',
      'reposta': '#FF9800',
      'suspensa': '#9E9E9E'
    };
    return cores[status] || '#2196F3';
  }

  /**
   * Valida se há conflito de horário
   */
  validarConflito(aula1: Cronograma, aula2: Cronograma): boolean {
    if (aula1.diaSemana !== aula2.diaSemana) {
      return false;
    }

    const inicio1 = this.converterHoraParaMinutos(aula1.horaInicio);
    const fim1 = this.converterHoraParaMinutos(aula1.horaFim);
    const inicio2 = this.converterHoraParaMinutos(aula2.horaInicio);
    const fim2 = this.converterHoraParaMinutos(aula2.horaFim);

    return (inicio1 < fim2 && fim1 > inicio2);
  }

  /**
   * Converte hora (HH:MM:SS) para minutos
   */
  private converterHoraParaMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  /**
   * Formata dia da semana para exibição
   */
  formatarDiaSemana(dia: string): string {
    const dias: { [key: string]: string } = {
      'segunda': 'Segunda-feira',
      'terca': 'Terça-feira',
      'quarta': 'Quarta-feira',
      'quinta': 'Quinta-feira',
      'sexta': 'Sexta-feira',
      'sabado': 'Sábado'
    };
    return dias[dia] || dia;
  }
}
