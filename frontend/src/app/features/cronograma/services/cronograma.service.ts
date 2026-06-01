import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES - CRONOGRAMA (GRADE HORÁRIA)
// ═══════════════════════════════════════════════════════════════════════════

export interface Sala {
  id: number;
  codigo: string;
  nome: string;
  capacidade: number;
  tipoSala: string;
  recursos: string[];
}

export interface HorarioCronograma {
  id?: number;
  idCronograma?: number;
  idTurma: number;
  idDisciplina: number;
  idEducador: string;
  idSala?: number;
  idPeriodo?: number;
  diaSemana: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';
  horaInicio: string;
  horaFim: string;
  duracao?: number;
  recorrente?: boolean;
  dataUnica?: string;
  status?: 'ativa' | 'cancelada' | 'reposta' | 'suspensa';
  cor?: string;
  notificado?: boolean;
  confirmado?: boolean;
  observacoes?: string;
  
  // Informações expandidas (retornadas pelo GET)
  turma?: {
    codigo: string;
    nome: string;
    codTurma?: string;
    nomeTurma?: string;
    vagas: number;
  };
  disciplina?: {
    codigo: string;
    nome: string;
    codDisciplina?: string;
    nomeDisciplina?: string;
    cargaHoraria?: number;
  };
  educador?: {
    matricula: string;
    nome: string;
    nomeCompleto?: string;
    email?: string;
  };
  sala?: Sala & {
    codSala?: string;
    nomeSala?: string;
    salaCapacidade?: number;
  };
  periodoLetivo?: {
    idPeriodo: number;
    nome: string;
  };
}

export interface CriarAulaRequest {
  idTurma: number;
  idDisciplina: number;
  idEducador: string;
  idSala?: number;
  idPeriodo?: number;
  diaSemana: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';
  horaInicio: string;
  horaFim: string;
  recorrente?: boolean;
  dataUnica?: string;
  cor?: string;
  observacoes?: string;
}

export interface ValidacaoHorario {
  valido: boolean;
  erros: string[];
  dados?: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES - EVENTOS ESCOLARES
// ═══════════════════════════════════════════════════════════════════════════

export interface EventoEscolar {
  idEvento?: number;
  titulo: string;
  descricao?: string;
  tipoEvento: 'prova' | 'simulado' | 'reuniao' | 'passeio' | 'feira' | 'palestra' | 'feriado' | 'evento_institucional';
  dataInicio: string;
  dataFim: string;
  diaInteiro: boolean;
  idTurma?: number;
  idDisciplina?: number;
  idEducador?: string;
  idSala?: number;
  cor?: string;
  publico_alvo?: 'todos' | 'educadores' | 'educandos' | 'responsaveis' | 'gestao' | 'especifico';
  status?: 'planejado' | 'confirmado' | 'realizado' | 'cancelado' | 'adiado';
  exigeConfirmacao?: boolean;
  limiteParticipantes?: number;
  notificar?: boolean;
  observacoes?: string;
  
  // Informações expandidas
  turma?: {
    codTurma: string;
    nomeTurma: string;
  };
  disciplina?: {
    nomeDisciplina: string;
  };
  educador?: {
    nomeCompleto: string;
  };
  sala?: {
    nomeSala: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES - ATIVIDADES PEDAGÓGICAS
// ═══════════════════════════════════════════════════════════════════════════

export interface Atividade {
  idAtividade?: number;
  titulo: string;
  descricao?: string;
  tipoAtividade: 'tarefa' | 'prova' | 'trabalho' | 'seminario' | 'simulado' | 'projeto' | 'pesquisa' | 'leitura' | 'exercicio' | 'debate' | 'apresentacao';
  idTurma: number;
  idDisciplina: number;
  idEducador: string;
  dataLancamento?: string;
  dataEntrega?: string;
  dataAplicacao?: string;
  horaEntrega?: string;
  permiteAtraso?: boolean;
  diasTolerancia?: number;
  valorNota?: number;
  pesoNota?: number;
  notaMinima?: number;
  anexoURL?: string;
  linkExterno?: string;
  conteudoProgramatico?: string;
  materiaisNecessarios?: string;
  status?: 'rascunho' | 'publicada' | 'em_andamento' | 'encerrada' | 'arquivada';
  visivelEducandos?: boolean;
  visivelResponsaveis?: boolean;
  notificarPublicacao?: boolean;
  cor?: string;
  
  // Informações expandidas
  turma?: {
    codTurma: string;
    nomeTurma: string;
  };
  disciplina?: {
    codDisciplina: string;
    nomeDisciplina: string;
  };
  educador?: {
    nomeCompleto: string;
  };
  totalEntregas?: number;
  entreguesCount?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES - CONFLITOS
// ═══════════════════════════════════════════════════════════════════════════

export interface Conflito {
  idConflito: number;
  tipoConflito: 'educador_duplicado' | 'sala_duplicada' | 'turma_duplicada' | 'indisponibilidade' | 'capacidade_sala' | 'carga_horaria';
  descricao: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  idCronograma1: number;
  idCronograma2?: number;
  resolvido: boolean;
  dataResolucao?: string;
  resolvidoPor?: number;
  detectedAt: string;
  
  // Informações expandidas
  diaSemana?: string;
  horaInicio?: string;
  horaFim?: string;
  turma1?: string;
  disciplina1?: string;
  turma2?: string;
  disciplina2?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

@Injectable({
  providedIn: 'root'
})
export class CronogramaService {

  constructor(private api: ApiService) { }

  // ─────────────────────────────────────────────────────────────────────────
  // TURMAS - Métodos auxiliares específicos para cronograma
  // ─────────────────────────────────────────────────────────────────────────

  listarTurmasPorAno(anoLetivo: number): Observable<any[]> {
    console.log('[CronogramaService] Buscando turmas para ano:', anoLetivo);
    const url = `/turmas?ano_letivo_id=${anoLetivo}`;
    console.log('[CronogramaService] URL:', url);
    
    return this.api.get<any>(url).pipe(
      map((response: any) => {
        console.log('[CronogramaService] Resposta recebida:', response);
        // O backend retorna { sucesso: true, turmas: [...], total: ... }
        if (response && response.turmas) {
          console.log('[CronogramaService] Retornando', response.turmas.length, 'turmas');
          return response.turmas;
        } else if (Array.isArray(response)) {
          console.log('[CronogramaService] Resposta é array com', response.length, 'itens');
          return response;
        }
        console.log('[CronogramaService] Nenhuma turma encontrada na resposta');
        return [];
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CRONOGRAMA - CRUD Básico
  // ─────────────────────────────────────────────────────────────────────────

  listarCronogramaTurma(turmaId: number): Observable<HorarioCronograma[]> {
    return this.api.get<any>(`/cronograma?turmaId=${turmaId}`).pipe(
      map((res: any) => {
        if (Array.isArray(res)) return res;
        return res?.horarios || res?.data || [];
      })
    );
  }

  listarCronogramaEducador(idEducador: string): Observable<HorarioCronograma[]> {
    return this.api.get<HorarioCronograma[]>(`/cronograma/educador/${idEducador}`);
  }

  listarCronogramaSala(idSala: number): Observable<HorarioCronograma[]> {
    return this.api.get<HorarioCronograma[]>(`/cronograma/sala/${idSala}`);
  }

  criarAula(aula: CriarAulaRequest): Observable<any> {
    return this.api.post('/cronograma', aula);
  }

  atualizarAula(id: number, aula: Partial<CriarAulaRequest>): Observable<any> {
    return this.api.put(`/cronograma/${id}`, aula);
  }

  deletarAula(id: number): Observable<any> {
    return this.api.delete(`/cronograma/${id}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CRONOGRAMA POR PERFIL
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Visão completa do gestor - todos os horários
   * Suporta filtros: ?idTurma=X&idEducador=Y&idSala=Z
   */
  listarCronogramaGestor(filtros?: {
    idTurma?: number;
    idEducador?: string;
    idSala?: number;
  }): Observable<{ horarios: HorarioCronograma[]; total: number }> {
    let url = '/cronograma/gestor';
    const params: string[] = [];
    
    if (filtros?.idTurma) params.push(`idTurma=${filtros.idTurma}`);
    if (filtros?.idEducador) params.push(`idEducador=${filtros.idEducador}`);
    if (filtros?.idSala) params.push(`idSala=${filtros.idSala}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.api.get<{ horarios: HorarioCronograma[]; total: number }>(url);
  }

  /**
   * Visão do educando - grade da sua turma
   */
  listarCronogramaEducando(idMatricula: string): Observable<{
    horarios: HorarioCronograma[];
    turma?: { idTurma: number; codTurma: string; nomeTurma: string };
    message?: string;
  }> {
    return this.api.get<any>(`/cronograma/educando/${idMatricula}`);
  }

  /**
   * Visão do responsável - grade dos filhos
   */
  listarCronogramaResponsavel(idResponsavel: string): Observable<{
    filhos: Array<{
      filho: { idMatricula: string; nomeCompleto: string };
      turma: { idTurma: number; codTurma: string; nomeTurma: string };
      horarios: HorarioCronograma[];
    }>;
    total: number;
  }> {
    return this.api.get<any>(`/cronograma/responsavel/${idResponsavel}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VALIDAÇÃO E CONFLITOS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Valida um horário SEM SALVAR (preview de conflitos)
   */
  validarHorario(dados: Partial<CriarAulaRequest & { idCronograma?: number }>): Observable<ValidacaoHorario> {
    return this.api.post<ValidacaoHorario>('/cronograma/validar', dados);
  }

  /**
   * Lista todos os conflitos detectados
   */
  listarConflitos(): Observable<any> {
    return this.api.get<any>('/cronograma/conflitos');
  }

  /**
   * Sugere horários livres
   */
  sugerirHorariosLivres(dados: {
    idEducador?: string;
    idSala?: number;
    idTurma?: number;
  }): Observable<any> {
    return this.api.post<any>('/cronograma/sugerir-horarios', dados);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVENTOS ESCOLARES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Lista eventos com filtros opcionais
   */
  listarEventos(filtros?: {
    tipo?: string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Observable<EventoEscolar[]> {
    let url = '/eventos';
    const params: string[] = [];
    
    if (filtros?.tipo) params.push(`tipo=${filtros.tipo}`);
    if (filtros?.status) params.push(`status=${filtros.status}`);
    if (filtros?.dataInicio) params.push(`dataInicio=${filtros.dataInicio}`);
    if (filtros?.dataFim) params.push(`dataFim=${filtros.dataFim}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.api.get<EventoEscolar[]>(url);
  }

  /**
   * Lista eventos de uma turma específica
   */
  listarEventosTurma(idTurma: number): Observable<EventoEscolar[]> {
    return this.api.get<EventoEscolar[]>(`/eventos/turma/${idTurma}`);
  }

  /**
   * Calendário mensal com eventos e aulas
   */
  calendarioMensal(ano: number, mes: number, idTurma?: number): Observable<any> {
    let url = `/eventos/calendario/${ano}/${mes}`;
    if (idTurma) {
      url += `?idTurma=${idTurma}`;
    }
    return this.api.get<any>(url);
  }

  /**
   * Cria um novo evento escolar
   */
  criarEvento(evento: Partial<EventoEscolar>): Observable<any> {
    return this.api.post<any>('/eventos', evento);
  }

  /**
   * Atualiza um evento existente
   */
  atualizarEvento(idEvento: number, evento: Partial<EventoEscolar>): Observable<any> {
    return this.api.put<any>(`/eventos/${idEvento}`, evento);
  }

  /**
   * Remove um evento
   */
  deletarEvento(idEvento: number): Observable<any> {
    return this.api.delete<any>(`/eventos/${idEvento}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ATIVIDADES PEDAGÓGICAS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Lista atividades com filtros
   */
  listarAtividades(filtros?: {
    idTurma?: number;
    idEducador?: string;
    status?: string;
  }): Observable<{ atividades: Atividade[]; total: number }> {
    let url = '/atividades';
    const params: string[] = [];
    
    if (filtros?.idTurma) params.push(`idTurma=${filtros.idTurma}`);
    if (filtros?.idEducador) params.push(`idEducador=${filtros.idEducador}`);
    if (filtros?.status) params.push(`status=${filtros.status}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.api.get<{ atividades: Atividade[]; total: number }>(url);
  }

  /**
   * Cria uma nova atividade pedagógica
   */
  criarAtividade(atividade: Partial<Atividade>): Observable<any> {
    return this.api.post<any>('/atividades', atividade);
  }

  /**
   * Atualiza uma atividade existente
   */
  atualizarAtividade(idAtividade: number, atividade: Partial<Atividade>): Observable<any> {
    return this.api.put<any>(`/atividades/${idAtividade}`, atividade);
  }

  /**
   * Remove uma atividade
   */
  deletarAtividade(idAtividade: number): Observable<any> {
    return this.api.delete<any>(`/atividades/${idAtividade}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REPOSIÇÕES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Lista reposições com filtro opcional
   */
  listarReposicoes(status?: string): Observable<any> {
    let url = '/reposicoes';
    if (status) {
      url += `?status=${status}`;
    }
    return this.api.get<any>(url);
  }

  /**
   * Registra cancelamento de aula
   */
  registrarCancelamento(dados: {
    idCronograma: number;
    dataCancelamento: string;
    motivoCancelamento: string;
  }): Observable<any> {
    return this.api.post<any>('/reposicoes/cancelamento', dados);
  }

  /**
   * Agenda uma reposição
   */
  agendarReposicao(idReposicao: number, dados: {
    dataReposicao: string;
    horaInicio: string;
    horaFim: string;
    idSalaReposicao?: number;
  }): Observable<any> {
    return this.api.post<any>(`/reposicoes/${idReposicao}/agendar`, dados);
  }

  /**
   * Marca reposição como realizada
   */
  marcarReposicaoRealizada(idReposicao: number): Observable<any> {
    return this.api.patch<any>(`/reposicoes/${idReposicao}/realizada`, {});
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITÁRIOS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Histórico de auditoria de uma aula
   */
  historicoAuditoria(idCronograma: number): Observable<any> {
    return this.api.get<any>(`/cronograma/${idCronograma}/auditoria`);
  }

  /**
   * Gera grade horária automaticamente
   */
  gerarGradeAutomatica(idTurma: number, idPeriodo: number): Observable<any> {
    return this.api.post<any>('/cronograma/gerar-automatico', {
      idTurma,
      idPeriodo
    });
  }

  /**
   * Otimiza uma grade existente
   */
  otimizarGrade(idTurma: number): Observable<any> {
    return this.api.post<any>('/cronograma/otimizar', { idTurma });
  }
}
