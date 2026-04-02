import { Component, AfterViewInit } from '@angular/core';

type FrequenciaStatus = 'presente' | 'ausente' | 'justificado';

interface FrequenciaAluno {
  alunoId: number;
  nome: string;
  status: FrequenciaStatus;
}

interface RegistroFrequencia {
  data: string;
  turmaId: number;
  disciplina: string;
  registros: FrequenciaAluno[];
}

interface TurmaDisciplina {
  disciplina: string;
  area: string;
  aulasSemanais: number;
}

interface MinhasTurmasItem {
  id: number;
  codigo: string;
  nome: string;
  serie: string;
  turno: string;
  anoLetivo: string;
  sala: string;
  vagas: number;
  vagasOcupadas: number;
  status: 'ativa' | 'inativa' | 'concluida';
  disciplinas: TurmaDisciplina[];
}

interface Educando {
  id: number;
  nome: string;
  serie: string;
  status: 'Ativa' | 'Trancada' | 'Cancelada';
}

type TipoAtividade = 'Prova' | 'Trabalho' | 'Apresentação';

interface Atividade {
  id: number;
  turmaId: number;
  disciplina: string;
  nome: string;
  tipo: TipoAtividade;
  data: string;
  notaMaxima: number;
}

interface LancamentoNota {
  alunoId: number;
  nome: string;
  nota: number | null;
}

interface ItemRelatorioFreq {
  alunoId: number;
  nome: string;
  total: number;
  presentes: number;
  ausentes: number;
  justificados: number;
  pct: number;
}

@Component({
  selector: 'app-minhas-turmas',
  templateUrl: './minhas-turmas.component.html',
  styleUrls: ['./minhas-turmas.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;box-sizing:border-box;' }
})
export class MinhasTurmasComponent implements AfterViewInit {

  // Dados simulados — substituir por chamada ao backend com o ID do educador logado
  readonly turmas: MinhasTurmasItem[] = [
    {
      id: 1,
      codigo: '1A',
      nome: '1A — Primeiro Ano A',
      serie: '1º Ano',
      turno: 'Manhã',
      anoLetivo: '2026',
      sala: 'Sala 101',
      vagas: 30,
      vagasOcupadas: 23,
      status: 'ativa',
      disciplinas: [
        { disciplina: 'Matemática',  area: 'Ciências Exatas',   aulasSemanais: 5 },
        { disciplina: 'Física',      area: 'Ciências da Natureza', aulasSemanais: 3 },
      ]
    },
    {
      id: 2,
      codigo: '2B',
      nome: '2B — Segundo Ano B',
      serie: '2º Ano',
      turno: 'Tarde',
      anoLetivo: '2026',
      sala: 'Sala 202',
      vagas: 30,
      vagasOcupadas: 28,
      status: 'ativa',
      disciplinas: [
        { disciplina: 'Matemática',  area: 'Ciências Exatas',   aulasSemanais: 5 },
      ]
    },
    {
      id: 3,
      codigo: '3A',
      nome: '3A — Terceiro Ano A',
      serie: '3º Ano',
      turno: 'Noite',
      anoLetivo: '2026',
      sala: 'Sala 301',
      vagas: 25,
      vagasOcupadas: 14,
      status: 'inativa',
      disciplinas: [
        { disciplina: 'Matemática',  area: 'Ciências Exatas',      aulasSemanais: 5 },
        { disciplina: 'Geometria',   area: 'Ciências Exatas',      aulasSemanais: 2 },
        { disciplina: 'Estatística', area: 'Ciências Exatas',      aulasSemanais: 2 },
      ]
    },
  ];

  private readonly educandosMock: Record<number, Educando[]> = {
    1: [
      { id: 1, nome: 'Ana Paula Ferreira',    serie: '1º Ano', status: 'Ativa' },
      { id: 2, nome: 'Bruno Lima Souza',       serie: '1º Ano', status: 'Ativa' },
      { id: 3, nome: 'Carla Mendes Rodrigues', serie: '1º Ano', status: 'Trancada' },
    ],
    2: [
      { id: 4, nome: 'Daniel Costa Alves',   serie: '2º Ano', status: 'Ativa' },
      { id: 5, nome: 'Elisa Torres Martins', serie: '2º Ano', status: 'Ativa' },
    ],
    3: [
      { id: 6, nome: 'Felipe Ramos de Oliveira', serie: '3º Ano', status: 'Ativa' },
      { id: 7, nome: 'Gabriela Nunes Pereira',   serie: '3º Ano', status: 'Cancelada' },
      { id: 8, nome: 'Hugo Carvalho Silva',       serie: '3º Ano', status: 'Ativa' },
      { id: 9, nome: 'Isadora Brandão Campos',    serie: '3º Ano', status: 'Ativa' },
    ],
  };

  // Filtros
  filtroAno    = '';
  filtroTurno  = '';
  filtroSerie  = '';
  filtroStatus = '';

  get turmasFiltradas(): MinhasTurmasItem[] {
    return this.turmas.filter(t =>
      (!this.filtroAno    || t.anoLetivo === this.filtroAno) &&
      (!this.filtroTurno  || t.turno     === this.filtroTurno) &&
      (!this.filtroSerie  || t.serie     === this.filtroSerie) &&
      (!this.filtroStatus || t.status    === this.filtroStatus)
    );
  }

  // Turma selecionada no painel lateral
  turmaModal: MinhasTurmasItem | null = null;
  abaAtiva: 'educandos' | 'frequencia' | 'relatorio' | 'notas' | null = null;

  // Disciplina selecionada dentro da turma
  disciplinaSelecionada: TurmaDisciplina | null = null;

  // Controle de frequência
  frequenciaData: string = new Date().toISOString().split('T')[0];
  frequenciaRegistros: FrequenciaAluno[] = [];
  frequenciaMensagem = '';
  private historicoFrequencia: Record<string, RegistroFrequencia[]> = {};

  private discKey(): string {
    return `${this.turmaModal!.id}_${this.disciplinaSelecionada!.disciplina}`;
  }

  // Mock de atividades (keyed by "turmaId_disciplina")
  private _atividadesStore: Record<string, Atividade[]> = {
    '1_Matemática': [
      { id: 1, turmaId: 1, disciplina: 'Matemática', nome: 'Prova 1 — Álgebra',  tipo: 'Prova',    data: '2026-03-15', notaMaxima: 10 },
      { id: 2, turmaId: 1, disciplina: 'Matemática', nome: 'Trabalho em Grupo', tipo: 'Trabalho', data: '2026-03-20', notaMaxima: 10 },
    ],
    '1_Física': [],
    '2_Matemática': [
      { id: 3, turmaId: 2, disciplina: 'Matemática', nome: 'Prova 1 — Funções', tipo: 'Prova', data: '2026-03-18', notaMaxima: 10 },
    ],
    '3_Matemática':  [],
    '3_Geometria':   [],
    '3_Estatística': [],
  };
  // Notas por atividadeId => LancamentoNota[]
  private _notasStore: Record<number, LancamentoNota[]> = {
    1: [
      { alunoId: 1, nome: 'Ana Paula Ferreira',    nota: 8.5  },
      { alunoId: 2, nome: 'Bruno Lima Souza',       nota: 7.0  },
      { alunoId: 3, nome: 'Carla Mendes Rodrigues', nota: null },
    ],
  };
  private _atividadeIdSeq = 10;

  // Estado: listagem de notas
  atividadesTurma: Atividade[] = [];
  atividadeSelecionada: Atividade | null = null;
  notasLancamento: LancamentoNota[] = [];
  notasMensagem = '';
  notasErro = '';

  // Estado: nova atividade
  modoNovaAtividade = false;
  novaAtividade: { nome: string; tipo: TipoAtividade; data: string; notaMaxima: number } =
    { nome: '', tipo: 'Prova', data: '', notaMaxima: 10 };

  get educandosModal(): Educando[] {
    return this.turmaModal ? (this.educandosMock[this.turmaModal.id] ?? []) : [];
  }

  selecionarTurma(turma: MinhasTurmasItem): void {
    this.turmaModal            = turma;
    this.disciplinaSelecionada = null;
    this.abaAtiva              = null;
    this.resetEstadoAba();
  }

  selecionarDisciplina(d: TurmaDisciplina): void {
    this.disciplinaSelecionada = d;
    this.abaAtiva              = 'educandos';
    this.resetEstadoAba();
  }

  mudarAba(aba: 'educandos' | 'frequencia' | 'relatorio' | 'notas'): void {
    this.abaAtiva = aba;
    if (aba === 'frequencia') {
      this.frequenciaData     = new Date().toISOString().split('T')[0];
      this.frequenciaMensagem = '';
      if (this.turmaModal) this.carregarRegistroDodia(this.turmaModal.id);
    }
    if (aba === 'relatorio') {
      this.relEditData      = null;
      this.relEditRegistros = [];
      this.relEditMensagem  = '';
    }
    if (aba === 'notas' && this.turmaModal && this.disciplinaSelecionada) {
      this.atividadesTurma      = [...(this._atividadesStore[this.discKey()] ?? [])];
      this.atividadeSelecionada = null;
      this.notasLancamento      = [];
      this.notasMensagem        = '';
      this.notasErro            = '';
      this.modoNovaAtividade    = false;
    }
  }

  private resetEstadoAba(): void {
    this.frequenciaRegistros  = [];
    this.frequenciaMensagem   = '';
    this.atividadeSelecionada = null;
    this.notasLancamento      = [];
    this.notasMensagem        = '';
    this.notasErro            = '';
    this.modoNovaAtividade    = false;
    this.relEditData          = null;
    this.relEditRegistros     = [];
    this.relEditMensagem      = '';
  }

  onFrequenciaDataChange(): void {
    if (this.turmaModal) this.carregarRegistroDodia(this.turmaModal.id);
  }

  private carregarRegistroDodia(turmaId: number): void {
    if (!this.disciplinaSelecionada) return;
    const existing = (this.historicoFrequencia[this.discKey()] ?? []).find(r => r.data === this.frequenciaData);
    const alunos = this.educandosMock[turmaId] ?? [];
    if (existing) {
      this.frequenciaRegistros = existing.registros.map(r => ({ ...r }));
    } else {
      this.frequenciaRegistros = alunos.map(a => ({ alunoId: a.id, nome: a.nome, status: 'presente' as FrequenciaStatus }));
    }
  }

  setPresenca(alunoId: number, status: FrequenciaStatus): void {
    const reg = this.frequenciaRegistros.find(r => r.alunoId === alunoId);
    if (reg) reg.status = status;
  }

  salvarFrequencia(): void {
    if (!this.turmaModal || !this.disciplinaSelecionada) return;
    const key        = this.discKey();
    const turmaId    = this.turmaModal.id;
    const disciplina = this.disciplinaSelecionada.disciplina;
    if (!this.historicoFrequencia[key]) this.historicoFrequencia[key] = [];
    const idx = this.historicoFrequencia[key].findIndex(r => r.data === this.frequenciaData);
    const registro: RegistroFrequencia = { data: this.frequenciaData, turmaId, disciplina, registros: [...this.frequenciaRegistros] };
    if (idx !== -1) this.historicoFrequencia[key][idx] = registro;
    else this.historicoFrequencia[key].push(registro);
    this.frequenciaMensagem = 'Frequência registrada com sucesso!';
    setTimeout(() => { this.frequenciaMensagem = ''; }, 2500);
  }

  contarPresentes():    number { return this.frequenciaRegistros.filter(r => r.status === 'presente').length; }
  contarAusentes():     number { return this.frequenciaRegistros.filter(r => r.status === 'ausente').length; }
  contarJustificados(): number { return this.frequenciaRegistros.filter(r => r.status === 'justificado').length; }

  get dateJaRegistrada(): boolean {
    if (!this.turmaModal || !this.disciplinaSelecionada) return false;
    return (this.historicoFrequencia[this.discKey()] ?? []).some(r => r.data === this.frequenciaData);
  }

  // ─── Relatório de Frequência ──────────────────────────────────────

  // estado da sub-vista de edição dentro do relatório
  relEditData: string | null = null;
  relEditRegistros: FrequenciaAluno[] = [];
  relEditMensagem = '';

  datasRegistradas(): string[] {
    if (!this.turmaModal || !this.disciplinaSelecionada) return [];
    return (this.historicoFrequencia[this.discKey()] ?? [])
      .map(r => r.data)
      .sort();
  }

  abrirEdicaoData(data: string): void {
    if (!this.turmaModal || !this.disciplinaSelecionada) return;
    this.relEditData = data;
    this.relEditMensagem = '';
    const existing = (this.historicoFrequencia[this.discKey()] ?? []).find(r => r.data === data);
    this.relEditRegistros = existing ? existing.registros.map(r => ({ ...r })) : [];
  }

  voltarRelatorio(): void {
    this.relEditData = null;
    this.relEditRegistros = [];
    this.relEditMensagem = '';
  }

  setPresencaEdit(alunoId: number, status: FrequenciaStatus): void {
    const reg = this.relEditRegistros.find(r => r.alunoId === alunoId);
    if (reg) reg.status = status;
  }

  salvarEdicaoData(): void {
    if (!this.turmaModal || !this.relEditData || !this.disciplinaSelecionada) return;
    const key        = this.discKey();
    const turmaId    = this.turmaModal.id;
    const disciplina = this.disciplinaSelecionada.disciplina;
    if (!this.historicoFrequencia[key]) this.historicoFrequencia[key] = [];
    const idx = this.historicoFrequencia[key].findIndex(r => r.data === this.relEditData);
    const registro: RegistroFrequencia = { data: this.relEditData, turmaId, disciplina, registros: [...this.relEditRegistros] };
    if (idx !== -1) this.historicoFrequencia[key][idx] = registro;
    else this.historicoFrequencia[key].push(registro);
    this.relEditMensagem = 'Lista de presença atualizada!';
    setTimeout(() => this.voltarRelatorio(), 1200);
  }

  // contadores para a lista de datas no relatório
  contarPresentesData(data: string): number {
    if (!this.turmaModal || !this.disciplinaSelecionada) return 0;
    const reg = (this.historicoFrequencia[this.discKey()] ?? []).find(r => r.data === data);
    return reg ? reg.registros.filter(x => x.status === 'presente').length : 0;
  }

  contarAusentesData(data: string): number {
    if (!this.turmaModal || !this.disciplinaSelecionada) return 0;
    const reg = (this.historicoFrequencia[this.discKey()] ?? []).find(r => r.data === data);
    return reg ? reg.registros.filter(x => x.status === 'ausente').length : 0;
  }

  contarJustificadosData(data: string): number {
    if (!this.turmaModal || !this.disciplinaSelecionada) return 0;
    const reg = (this.historicoFrequencia[this.discKey()] ?? []).find(r => r.data === data);
    return reg ? reg.registros.filter(x => x.status === 'justificado').length : 0;
  }

  relatorioFrequencia(): ItemRelatorioFreq[] {
    if (!this.turmaModal || !this.disciplinaSelecionada) return [];
    const turmaId   = this.turmaModal.id;
    const alunos    = this.educandosMock[turmaId] ?? [];
    const registros = this.historicoFrequencia[this.discKey()] ?? [];
    const total = registros.length;
    return alunos.map(a => {
      const presentes    = registros.filter(r => r.registros.find(x => x.alunoId === a.id && x.status === 'presente')).length;
      const justificados = registros.filter(r => r.registros.find(x => x.alunoId === a.id && x.status === 'justificado')).length;
      const ausentes     = total - presentes - justificados;
      const pct = total > 0 ? Math.round(((presentes + justificados) / total) * 100) : 100;
      return { alunoId: a.id, nome: a.nome, total, presentes, ausentes, justificados, pct };
    });
  }

  pctClass(pct: number): string {
    if (pct >= 75) return 'ok';
    if (pct >= 50) return 'warn';
    return 'danger';
  }

  // ─── Lançamento de Notas ─────────────────────────────────────────


  selecionarAtividade(at: Atividade): void {
    this.atividadeSelecionada = at;
    const alunos = this.educandosMock[at.turmaId] ?? [];
    const saved  = this._notasStore[at.id] ?? [];
    this.notasLancamento = alunos.map(a => {
      const existing = saved.find(n => n.alunoId === a.id);
      return { alunoId: a.id, nome: a.nome, nota: existing?.nota ?? null };
    });
    this.notasMensagem = '';
    this.notasErro     = '';
  }

  voltarAtividades(): void {
    this.atividadeSelecionada = null;
    this.notasLancamento      = [];
    this.modoNovaAtividade    = false;
    this.notasMensagem        = '';
    this.notasErro            = '';
  }

  setNota(alunoId: number, valor: string): void {
    const reg = this.notasLancamento.find(n => n.alunoId === alunoId);
    if (!reg) return;
    const parsed = valor.trim() === '' ? null : parseFloat(valor.replace(',', '.'));
    reg.nota = parsed !== null && !isNaN(parsed) ? parsed : null;
  }

  salvarNotas(): void {
    if (!this.atividadeSelecionada || !this.turmaModal) return;
    const max = this.atividadeSelecionada.notaMaxima;
    const invalida = this.notasLancamento.find(n => n.nota !== null && (n.nota < 0 || n.nota > max));
    if (invalida) {
      this.notasErro = `Nota deve estar entre 0 e ${max}.`;
      return;
    }
    this.notasErro = '';
    this._notasStore[this.atividadeSelecionada.id] = [...this.notasLancamento];
    this.notasMensagem = 'Notas salvas com sucesso!';
    setTimeout(() => { this.notasMensagem = ''; }, 2000);
  }

  mostrarNovaAtividade(): void {
    this.modoNovaAtividade = true;
    this.novaAtividade = { nome: '', tipo: 'Prova', data: new Date().toISOString().split('T')[0], notaMaxima: 10 };
    this.notasErro = '';
  }

  cancelarNovaAtividade(): void {
    this.modoNovaAtividade = false;
    this.notasErro = '';
  }

  salvarNovaAtividade(): void {
    if (!this.turmaModal || !this.disciplinaSelecionada) return;
    if (!this.novaAtividade.nome.trim()) { this.notasErro = 'Informe o nome da atividade.'; return; }
    if (!this.novaAtividade.data)        { this.notasErro = 'Informe a data da atividade.'; return; }
    const id  = ++this._atividadeIdSeq;
    const key = this.discKey();
    const nova: Atividade = { id, turmaId: this.turmaModal.id, disciplina: this.disciplinaSelecionada.disciplina, ...this.novaAtividade };
    if (!this._atividadesStore[key]) this._atividadesStore[key] = [];
    this._atividadesStore[key].push(nova);
    this.atividadesTurma = [...this._atividadesStore[key]];
    this.modoNovaAtividade = false;
    this.notasErro = '';
  }

  mediaTurma(at: Atividade): string {
    const notas = (this._notasStore[at.id] ?? []).map(n => n.nota).filter((n): n is number => n !== null);
    if (!notas.length) return '—';
    return (notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1);
  }

  notaAluno(at: Atividade, alunoId: number): string {
    const n = (this._notasStore[at.id] ?? []).find(x => x.alunoId === alunoId);
    return n?.nota != null ? String(n.nota) : '—';
  }

  // média geral do educando nas atividades da disciplina selecionada
  mediaGeralAluno(alunoId: number): string {
    if (!this.turmaModal || !this.disciplinaSelecionada) return '\u2014';
    const atividades = this._atividadesStore[this.discKey()] ?? [];
    const notas = atividades
      .flatMap(at => (this._notasStore[at.id] ?? []).filter(n => n.alunoId === alunoId && n.nota !== null))
      .map(n => n.nota as number);
    if (!notas.length) return '\u2014';
    return (notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1);
  }

  // percentual de frequência do educando (reutiliza relatorioFrequencia)
  freqPctAluno(alunoId: number): number {
    return this.relatorioFrequencia().find(r => r.alunoId === alunoId)?.pct ?? 100;
  }

  fecharModal(): void {
    // stub mantido para compatibilidade interna
  }

  labelStatus(status: string): string {
    if (status === 'ativa')    return 'Ativa';
    if (status === 'concluida') return 'Concluída';
    return 'Inativa';
  }

  vagasLivres(t: MinhasTurmasItem): number {
    return t.vagas - t.vagasOcupadas;
  }

  disciplinasNomes(t: MinhasTurmasItem): string {
    return t.disciplinas.map(d => d.disciplina).join(', ');
  }

  resetFiltros(): void {
    this.filtroAno    = '';
    this.filtroTurno  = '';
    this.filtroSerie  = '';
    this.filtroStatus = '';
  }

  ngAfterViewInit(): void {
    this.forceLeft();
    const t0 = performance.now();
    const loop = () => { this.forceLeft(); if (performance.now() - t0 < 1200) requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  private forceLeft(): void {
    const host = document.querySelector('app-minhas-turmas') as HTMLElement;
    if (!host) return;
    const set = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.setProperty('text-align', 'left', 'important');
      el.style.setProperty('align-items', 'flex-start', 'important');
    };
    set(host);
    host.querySelectorAll<HTMLElement>('.mt-page, .page-header, .page-header h1, .page-header p, .filters, .field, label').forEach(set);
  }
}
