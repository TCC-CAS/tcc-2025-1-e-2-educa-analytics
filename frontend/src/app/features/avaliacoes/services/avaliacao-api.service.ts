import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

export interface AvaliacaoRespondida {
  tipo: string;
  dataResposta: string | null;
}

export interface ParticipacaoPorTipo {
  [tipoUsuario: string]: { responderam: number };
}

export interface FormularioCustomizado {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  cor: string;
  publico: string[];
  perguntas?: { id: string; texto: string; tipo: string; obrigatoria: boolean }[];
  criado_em?: string;
}

export interface DashboardPapel {
  responderam: number;
  media: number;
}

export interface DashboardFormulario {
  tipo: string;
  titulo: string;
  icone: string;
  media_geral: number;
  total_respondentes: number;
  por_papel: { [papel: string]: DashboardPapel };
  por_pergunta: { [perguntaId: string]: number };
}

export interface DiversidadeItem   { label: string; total: number; pct: number; }
export interface DiversidadeFaixa  { faixa: string; masculino: number; feminino: number; outro: number; }
export interface DiversidadeData {
  total:         number;
  por_tipo?:     DiversidadeItem[];
  cor_raca:      DiversidadeItem[];
  genero:        DiversidadeItem[];
  faixas:        DiversidadeFaixa[];
  nacionalidade: DiversidadeItem[];
}

export interface DashboardTurma {
  id: number;
  nome: string;
  total_educandos: number;
  responderam: number;
  media: number;
  pct: number;
}

export interface DashboardEscolarData {
  formularios: DashboardFormulario[];
  totais: {
    total_respondentes: number;
    por_papel: { [papel: string]: number };
  };
  totais_instituicao?: { [papel: string]: number };
  por_turma?: DashboardTurma[];
  diversidade?: DiversidadeData;
}

@Injectable({
  providedIn: 'root'
})
export class AvaliacaoApiService {

  constructor(private api: ApiService) {}

  /** Retorna lista de formulários já respondidos pelo usuário logado. */
  getRespondidas(): Observable<{ respondidas: AvaliacaoRespondida[] }> {
    return this.api.get<{ respondidas: AvaliacaoRespondida[] }>('/avaliacoes/respondidas').pipe(
      catchError(() => of({ respondidas: [] }))
    );
  }

  /** Envia as respostas de um formulário. O tipo de usuário é extraído no backend via JWT. */
  enviar(tipo: string, respostas: { [key: string]: any }): Observable<any> {
    return this.api.post('/avaliacoes/enviar', { tipo, respostas });
  }

  /**
   * Retorna participação anônima por papel (educando/educador/responsavel).
   * Nunca expõe quem respondeu individualmente.
   */
  getParticipacao(tipo: string): Observable<ParticipacaoPorTipo> {
    return this.api.get<ParticipacaoPorTipo>(`/avaliacoes/participacao/${tipo}`).pipe(
      catchError(() => of({}))
    );
  }

  /** Retorna estatísticas agregadas e anônimas para o Dashboard Escolar. */
  getDashboard(): Observable<DashboardEscolarData> {
    return this.api.get<DashboardEscolarData>('/dashboard-escolar').pipe(
      catchError(() => of({
        formularios: [],
        totais: { total_respondentes: 0, por_papel: {} }
      }))
    );
  }

  /** Cria um novo formulário customizado (gestor/colaborador). */
  criarFormulario(dados: {
    titulo: string;
    descricao: string;
    icone: string;
    cor: string;
    publico: string[];
    perguntas: { texto: string; tipo: string; obrigatoria: boolean }[];
  }): Observable<{ id: string; titulo: string }> {
    return this.api.post<{ id: string; titulo: string }>('/formularios', dados);
  }

  /** Lista formulários customizados visíveis para o usuário autenticado. */
  getFormulariosCustomizados(): Observable<{ formularios: FormularioCustomizado[] }> {
    return this.api.get<{ formularios: FormularioCustomizado[] }>('/formularios').pipe(
      catchError(() => of({ formularios: [] }))
    );
  }

  /** Busca um formulário customizado completo pelo ID. */
  getFormularioById(id: string): Observable<FormularioCustomizado | null> {
    return this.api.get<FormularioCustomizado>(`/formularios/${id}`).pipe(
      catchError(() => of(null))
    );
  }
}
