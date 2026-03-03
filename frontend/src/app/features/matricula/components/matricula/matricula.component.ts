import { Component, AfterViewInit, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatriculaRegistro } from '../lista-matriculas/lista-matriculas.component';

type MatriculaTab = 'dados' | 'responsaveis' | 'escolar';

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface Vaga {
  numero: number;
  linha: string;
  coluna: number;
  ocupada: boolean;
}

interface TurmaDetalhe {
  codigo: string;
  nome: string;
  anoLetivo: string;
  serie: string;
  periodo: string;
  sala: string;
  dataInicio: string;
  dataTermino: string;
  vagasOcupadas: number[]; // números das vagas já ocupadas (1-30)
}

@Component({
  selector: 'app-matricula',
  templateUrl: './matricula.component.html',
  styleUrls: ['./matricula.component.scss']
})
export class MatriculaComponent implements OnInit, AfterViewInit {
  activeTab: MatriculaTab = 'dados';
  useSameAddress = false;

  // ── Gênero ─────────────────────────────────────────────────
  alunoGeneroSelecionado = '';
  alunoGeneroOutro = false;
  alunoGeneroCustom = '';
  alunoCorRaca = '';

  respGeneroSelecionado = '';
  respGeneroOutro = false;
  respGeneroCustom = '';
  respCorRaca = '';

  // ── Rematrícula ─────────────────────────────────────────────────
  modoRematricula = false;
  rematriculaOriginalId = '';

  // ── ID Matrícula ───────────────────────────────────────────────
  matriculaId = this.gerarMatriculaId();
  respMatriculaId = this.gerarMatriculaId();

  // ── Campos não ligados aos outros grupos ────────────────────────
  alunoNome = '';
  alunoNacionalidade = '';
  alunoTelefone = '';
  alunoEmail = '';
  alunoRg = '';
  alunoOrgaoEmissor = '';
  alunoEstadoEmissor = '';
  alunoCpf = '';

  respNome = '';
  respNacionalidade = '';
  respTelefone = '';
  respEmail = '';
  respRg = '';
  respOrgaoEmissor = '';
  respEstadoEmissor = '';
  respCpf = '';

  // ── Validação ───────────────────────────────────────────────
  errosValidacao: { tab: MatriculaTab; tabLabel: string; campos: string[] }[] = [];
  mostrarErros = false;

  // ── Modal de confirmação ─────────────────────────────────────
  modalConfirmacaoAberto = false;
  emailEnviando = false;
  matriculaRealizada = false;
  emailErro = false;

  private validarFormulario(): { tab: MatriculaTab; tabLabel: string; campos: string[] }[] {
    const erros: { tab: MatriculaTab; tabLabel: string; campos: string[] }[] = [];

    // ― Educando
    const ce: string[] = [];
    if (!this.alunoNome)             ce.push('Nome completo');
    if (!this.alunoNacionalidade)    ce.push('Nacionalidade');
    if (!this.alunoGeneroSelecionado) ce.push('Gênero');
    if (this.alunoGeneroOutro && !this.alunoGeneroCustom) ce.push('Especifique o gênero');
    if (!this.alunoCorRaca)          ce.push('Cor / Raça');
    if (!this.alunoNascimento)       ce.push('Data de nascimento');
    if (!this.alunoEndereco.cep)     ce.push('CEP');
    if (!this.alunoEndereco.logradouro) ce.push('Endereço');
    if (!this.alunoEndereco.numero)  ce.push('Número');
    if (!this.alunoEndereco.bairro)  ce.push('Bairro');
    if (!this.alunoEndereco.uf)      ce.push('UF');
    if (!this.alunoEndereco.cidade)  ce.push('Cidade');
    if (!this.alunoTelefone)         ce.push('Telefone');
    if (!this.alunoEmail)            ce.push('Email');
    if (!this.alunoRg)               ce.push('RG');
    if (!this.alunoOrgaoEmissor)     ce.push('Órgão emissor');
    if (!this.alunoEstadoEmissor)    ce.push('Estado emissor');
    if (!this.alunoCpf)              ce.push('CPF');
    if (ce.length) erros.push({ tab: 'dados', tabLabel: 'Educando(a)', campos: ce });

    // ― Responsável
    const cr: string[] = [];
    if (!this.respNome)              cr.push('Nome completo');
    if (!this.respNacionalidade)     cr.push('Nacionalidade');
    if (!this.respGeneroSelecionado) cr.push('Gênero');
    if (this.respGeneroOutro && !this.respGeneroCustom) cr.push('Especifique o gênero');
    if (!this.respCorRaca)           cr.push('Cor / Raça');
    if (!this.respNascimento)        cr.push('Data de nascimento');
    if (!this.useSameAddress) {
      if (!this.respEndereco.cep)      cr.push('CEP');
      if (!this.respEndereco.logradouro) cr.push('Endereço');
      if (!this.respEndereco.numero)   cr.push('Número');
      if (!this.respEndereco.bairro)   cr.push('Bairro');
      if (!this.respEndereco.uf)       cr.push('UF');
      if (!this.respEndereco.cidade)   cr.push('Cidade');
    }
    if (!this.respTelefone)          cr.push('Telefone');
    if (!this.respEmail)             cr.push('Email');
    if (!this.respRg)                cr.push('RG');
    if (!this.respOrgaoEmissor)      cr.push('Órgão emissor');
    if (!this.respEstadoEmissor)     cr.push('Estado emissor');
    if (!this.respCpf)               cr.push('CPF');
    if (cr.length) erros.push({ tab: 'responsaveis', tabLabel: 'Responsável', campos: cr });

    // ― Dados Escolares
    const cs: string[] = [];
    if (!this.serie)            cs.push('Série');
    if (!this.periodo)          cs.push('Período');
    if (!this.turmaSelecionada) cs.push('Turma (confirme pelo mapa de vagas)');
    if (cs.length) erros.push({ tab: 'escolar', tabLabel: 'Dados Escolares', campos: cs });

    return erros;
  }

  private gerarMatriculaId(): string {
    // 9 dígitos: primeiro dígito de 1-9 para evitar zero à esquerda
    const primeiro = Math.floor(Math.random() * 9) + 1;
    const restante = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
    return `${primeiro}${restante}`;
  }

  abrirConfirmacao(): void {
    this.errosValidacao = this.validarFormulario();
    this.mostrarErros = true;
    if (this.errosValidacao.length > 0) return;
    this.emailErro = false;
    this.modalConfirmacaoAberto = true;
  }

  fecharConfirmacao(): void {
    if (this.emailEnviando) return;
    this.modalConfirmacaoAberto = false;
  }

  confirmarMatricula(): void {
    this.emailEnviando = true;
    this.emailErro = false;

    // Simula envio de e-mail (substituir por chamada HTTP real ao backend)
    const token = btoa(`${this.matriculaId}:${Date.now()}`).replace(/=/g, '');
    const linkAluno = `https://educa-analytics.com/criar-senha?token=${token}&tipo=aluno`;
    const linkResp  = `https://educa-analytics.com/criar-senha?token=${token}&tipo=responsavel`;

    console.log('[Educa Analytics] E-mail enviado para o educando:');
    console.log(`  Para: ${this.alunoEmail}`);
    console.log(`  Link: ${linkAluno}`);
    console.log('[Educa Analytics] E-mail enviado para o responsável:');
    console.log(`  Para: ${this.respEmail}`);
    console.log(`  Link: ${linkResp}`);

    setTimeout(() => {
      this.emailEnviando = false;
      this.matriculaRealizada = true;
    }, 1500);
  }

  novaMatriculaAposConclusao(): void {
    this.modalConfirmacaoAberto = false;
    this.matriculaRealizada = false;
    this.mostrarErros = false;
    this.errosValidacao = [];
    this.modoRematricula = false;
    this.rematriculaOriginalId = '';
    this.matriculaId = this.gerarMatriculaId();
    this.respMatriculaId = this.gerarMatriculaId();
    this.setTab('dados');
  }

  // ── Nascimento / Idade ──────────────────────────────────────
  alunoNascimento = '';
  alunoIdade: number | null = null;

  respNascimento = '';
  respIdade: number | null = null;

  // ── Dados Escolares ─────────────────────────────────────────
  serie = '';
  codigoTurma = '';
  turmaSelecionada = '';
  anoLetivo = new Date().getFullYear().toString();
  dataInicio = '';
  dataTermino = '';
  periodo = '';
  sala = '';

  // ── Modal de vagas ──────────────────────────────────────────
  modalAberto = false;
  turmaModalTemp = '';
  vagasModal: Vaga[] = [];
  readonly TOTAL_VAGAS = 30;
  readonly COLUNAS = 6;
  readonly LINHAS = ['A', 'B', 'C', 'D', 'E'];

  turmas: TurmaDetalhe[] = [
    // 2026 – 1º Ano
    { codigo: '1A', nome: '1A - Primeiro Ano A', anoLetivo: '2026', serie: '1º Ano', periodo: 'matutino',   sala: 'Sala 101', dataInicio: '2026-02-02', dataTermino: '2026-12-18', vagasOcupadas: [1,3,5,8,12,15,18,21,24,27] },
    { codigo: '1B', nome: '1B - Primeiro Ano B', anoLetivo: '2026', serie: '1º Ano', periodo: 'vespertino', sala: 'Sala 101', dataInicio: '2026-02-02', dataTermino: '2026-12-18', vagasOcupadas: [2,4,6,9,11,14,17,20,23,26,29,30] },
    // 2026 – 2º Ano
    { codigo: '2A', nome: '2A - Segundo Ano A',  anoLetivo: '2026', serie: '2º Ano', periodo: 'matutino',   sala: 'Sala 201', dataInicio: '2026-02-02', dataTermino: '2026-12-18', vagasOcupadas: [1,2,3,7,13,19,25,28] },
    { codigo: '2B', nome: '2B - Segundo Ano B',  anoLetivo: '2026', serie: '2º Ano', periodo: 'vespertino', sala: 'Sala 202', dataInicio: '2026-02-02', dataTermino: '2026-12-18', vagasOcupadas: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30] },
    // 2026 – 3º Ano
    { codigo: '3A', nome: '3A - Terceiro Ano A', anoLetivo: '2026', serie: '3º Ano', periodo: 'matutino',   sala: 'Sala 301', dataInicio: '2026-02-02', dataTermino: '2026-12-18', vagasOcupadas: [4,8,16,22] },
    { codigo: '3B', nome: '3B - Terceiro Ano B', anoLetivo: '2026', serie: '3º Ano', periodo: 'vespertino', sala: 'Sala 302', dataInicio: '2026-02-02', dataTermino: '2026-12-18', vagasOcupadas: [] },
    // 2025 – 1º Ano
    { codigo: '1A', nome: '1A - Primeiro Ano A', anoLetivo: '2025', serie: '1º Ano', periodo: 'matutino',   sala: 'Sala 101', dataInicio: '2025-02-03', dataTermino: '2025-12-19', vagasOcupadas: [1,3,5,8,12,15,18,21,24,27,28,29,30] },
    { codigo: '1B', nome: '1B - Primeiro Ano B', anoLetivo: '2025', serie: '1º Ano', periodo: 'vespertino', sala: 'Sala 101', dataInicio: '2025-02-03', dataTermino: '2025-12-19', vagasOcupadas: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30] },
    // 2025 – 2º Ano
    { codigo: '2A', nome: '2A - Segundo Ano A',  anoLetivo: '2025', serie: '2º Ano', periodo: 'matutino',   sala: 'Sala 201', dataInicio: '2025-02-03', dataTermino: '2025-12-19', vagasOcupadas: [1,2,3,7,13,19,25,28] },
    { codigo: '2B', nome: '2B - Segundo Ano B',  anoLetivo: '2025', serie: '2º Ano', periodo: 'vespertino', sala: 'Sala 202', dataInicio: '2025-02-03', dataTermino: '2025-12-19', vagasOcupadas: [] },
  ];

  private readonly ordemSeries = [
    '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano',
    '6º Ano', '7º Ano', '8º Ano', '9º Ano',
    '1ª Série EM', '2ª Série EM', '3ª Série EM',
  ];

  private readonly periodosLabel: Record<string, string> = {
    matutino: 'Matutino', vespertino: 'Vespertino', noturno: 'Noturno', integral: 'Integral'
  };

  anosLetivos: string[] = Array.from({ length: 6 }, (_, i) =>
    (new Date().getFullYear() - 1 + i).toString()
  );

  get seriesDisponiveis(): string[] {
    const found = new Set(this.turmas
      .filter(t => !this.anoLetivo || t.anoLetivo === this.anoLetivo)
      .map(t => t.serie));
    return this.ordemSeries.filter(s => found.has(s));
  }

  get periodosDisponiveis(): { value: string; label: string }[] {
    const found = new Set(this.turmas
      .filter(t =>
        (!this.anoLetivo || t.anoLetivo === this.anoLetivo) &&
        (!this.serie     || t.serie     === this.serie)
      )
      .map(t => t.periodo));
    return ['matutino', 'vespertino', 'noturno', 'integral']
      .filter(p => found.has(p))
      .map(p => ({ value: p, label: this.periodosLabel[p] }));
  }

  get turmasFiltradas(): TurmaDetalhe[] {
    return this.turmas.filter(t =>
      (!this.anoLetivo || t.anoLetivo === this.anoLetivo) &&
      (!this.serie     || t.serie     === this.serie) &&
      (!this.periodo   || t.periodo   === this.periodo)
    );
  }

  vagasLivres(turma: TurmaDetalhe): number {
    return this.TOTAL_VAGAS - turma.vagasOcupadas.length;
  }

  get turmaModalNome(): string {
    return this.turmas.find(t => t.codigo === this.turmaModalTemp)?.nome ?? '';
  }

  get turmaAtual(): TurmaDetalhe | undefined {
    return this.turmasFiltradas.find(t => t.codigo === this.turmaModalTemp);
  }

  get turmaConfirmada(): TurmaDetalhe | undefined {
    return this.turmasFiltradas.find(t => t.codigo === this.turmaSelecionada);
  }

  get vagasDisponiveis(): number {
    return this.TOTAL_VAGAS - (this.turmaAtual?.vagasOcupadas.length ?? 0);
  }

  get vagasDisponiveisConfirmadas(): number {
    return this.TOTAL_VAGAS - (this.turmaConfirmada?.vagasOcupadas.length ?? 0);
  }

  onAnoLetivoChange(_: string): void {
    this.serie = ''; this.periodo = '';
    this.turmaSelecionada = ''; this.turmaModalTemp = '';
    this.codigoTurma = ''; this.dataInicio = ''; this.dataTermino = ''; this.sala = '';
  }

  onSerieChange(_: string): void {
    this.periodo = '';
    this.turmaSelecionada = ''; this.turmaModalTemp = '';
    this.codigoTurma = ''; this.dataInicio = ''; this.dataTermino = ''; this.sala = '';
  }

  onPeriodoChange(_: string): void {
    this.turmaSelecionada = ''; this.turmaModalTemp = '';
    this.codigoTurma = ''; this.dataInicio = ''; this.dataTermino = ''; this.sala = '';
  }

  abrirModal(): void {
    if (!this.periodo) return;
    const alvo = this.turmaModalTemp || this.turmaSelecionada || this.turmasFiltradas[0]?.codigo;
    if (alvo) this.abrirModalVagas(alvo);
  }

  abrirModalVagas(codigo: string): void {
    const turma = this.turmasFiltradas.find(t => t.codigo === codigo);
    if (!turma) return;
    this.turmaModalTemp = codigo;
    this.vagasModal = [];
    this.vagasPorLinhaMap = new Map();
    const ocupadasSet = new Set(turma.vagasOcupadas);
    let num = 1;
    for (const linha of this.LINHAS) {
      const linhaVagas: Vaga[] = [];
      for (let col = 1; col <= this.COLUNAS; col++) {
        const vaga: Vaga = { numero: num, linha, coluna: col, ocupada: ocupadasSet.has(num) };
        this.vagasModal.push(vaga);
        linhaVagas.push(vaga);
        num++;
      }
      this.vagasPorLinhaMap.set(linha, linhaVagas);
    }
    this.modalAberto = true;
  }

  confirmarTurma(): void {
    this.turmaSelecionada = this.turmaModalTemp;
    this.codigoTurma = this.turmaModalTemp;
    const turma = this.turmasFiltradas.find(t => t.codigo === this.turmaModalTemp);
    if (turma) {
      this.sala       = turma.sala;
      this.dataInicio  = turma.dataInicio;
      this.dataTermino = turma.dataTermino;
    }
    this.fecharModal();
  }

  fecharModal(): void {
    this.modalAberto = false;
    // Mantém o que está no select; só restaura se o usuário não tiver selecionado nada ainda
    if (!this.turmaModalTemp) {
      this.turmaModalTemp = this.turmaSelecionada;
    }
  }

  vagasPorLinhaMap: Map<string, Vaga[]> = new Map();

  vagasPorLinha(linha: string): Vaga[] {
    return this.vagasPorLinhaMap.get(linha) ?? [];
  }

  trackByLinha(_: number, linha: string): string { return linha; }
  trackByVaga(_: number, vaga: Vaga): number { return vaga.numero; }
  trackByTurma(_: number, t: TurmaDetalhe): string { return t.anoLetivo + t.codigo; }

  // ── CEP ────────────────────────────────────────────────────
  cepLoadingAluno = false;
  cepErroAluno = false;
  cepLoadingResp = false;
  cepErroResp = false;

  alunoEndereco = {
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', uf: '', cidade: ''
  };

  respEndereco = {
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', uf: '', cidade: ''
  };

  constructor(private http: HttpClient, private router: Router) {
    // Lê o estado da navegação no construtor (getCurrentNavigation só está disponível aqui)
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { rematricula?: MatriculaRegistro } | undefined;
    if (state?.rematricula) {
      this.preencherDadosRematricula(state.rematricula);
    }
  }

  ngOnInit(): void {}

  private preencherDadosRematricula(m: MatriculaRegistro): void {
    this.modoRematricula = true;
    this.rematriculaOriginalId = String(m.id);

    // ── Educando
    this.alunoNome               = m.alunoNome ?? '';
    this.alunoEmail              = m.alunoEmail ?? '';
    this.alunoTelefone           = m.alunoCelular || m.alunoTelefone || '';
    this.alunoRg                 = m.alunoRg ?? '';
    this.alunoCpf                = m.alunoCpf ?? '';
    this.alunoCorRaca            = m.alunoCorRaca ?? '';
    this.alunoNascimento         = m.alunoNascimento ?? '';
    this.alunoIdade              = m.alunoIdade ?? null;
    this.alunoGeneroSelecionado  = m.alunoGenero ?? '';
    this.alunoGeneroOutro        = m.alunoGenero === 'outro';
    this.alunoEndereco           = { ...m.alunoEndereco };

    // ── Responsável
    this.respNome                = m.respNome ?? '';
    this.respEmail               = m.respEmail ?? '';
    this.respTelefone            = m.respCelular || m.respTelefone || '';
    this.respRg                  = m.respRg ?? '';
    this.respCpf                 = m.respCpf ?? '';
    this.respCorRaca             = m.respCorRaca ?? '';
    this.respNascimento          = m.respNascimento ?? '';
    this.respIdade               = m.respIdade ?? null;
    this.respGeneroSelecionado   = m.respGenero ?? '';
    this.respGeneroOutro         = m.respGenero === 'outro';
    this.respEndereco            = { ...m.respEndereco };

    // Dados escolares ficam em branco para nova seleção
    this.serie = ''; this.periodo = ''; this.turmaSelecionada = '';
    this.codigoTurma = ''; this.dataInicio = ''; this.dataTermino = ''; this.sala = '';
  }

  // ── Gênero ─────────────────────────────────────────────────
  onAlunoGeneroChange(valor: string): void {
    this.alunoGeneroOutro = valor === 'outro';
    if (!this.alunoGeneroOutro) this.alunoGeneroCustom = '';
  }

  onRespGeneroChange(valor: string): void {
    this.respGeneroOutro = valor === 'outro';
    if (!this.respGeneroOutro) this.respGeneroCustom = '';
  }

  // ── Idade ───────────────────────────────────────────────────
  private calcularIdade(dataNascimento: string): number | null {
    if (!dataNascimento) return null;
    const nascimento = new Date(dataNascimento);
    if (isNaN(nascimento.getTime())) return null;
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAniversario = nascimento.getMonth() - hoje.getMonth();
    if (mesAniversario > 0 || (mesAniversario === 0 && nascimento.getDate() > hoje.getDate())) {
      idade--;
    }
    return idade >= 0 ? idade : null;
  }

  onAlunoNascimentoChange(data: string): void {
    this.alunoIdade = this.calcularIdade(data);
  }

  onRespNascimentoChange(data: string): void {
    this.respIdade = this.calcularIdade(data);
  }

  // ── CEP ─────────────────────────────────────────────────────
  buscarCepAluno(): void {
    const cep = this.alunoEndereco.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    this.cepLoadingAluno = true;
    this.cepErroAluno = false;
    this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: (data) => {
        this.cepLoadingAluno = false;
        if (data.erro) { this.cepErroAluno = true; return; }
        this.alunoEndereco.logradouro = data.logradouro;
        this.alunoEndereco.bairro     = data.bairro;
        this.alunoEndereco.uf         = data.uf;
        this.alunoEndereco.cidade     = data.localidade;
        if (!this.alunoEndereco.complemento) this.alunoEndereco.complemento = data.complemento;
      },
      error: () => { this.cepLoadingAluno = false; this.cepErroAluno = true; }
    });
  }

  buscarCepResp(): void {
    const cep = this.respEndereco.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    this.cepLoadingResp = true;
    this.cepErroResp = false;
    this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: (data) => {
        this.cepLoadingResp = false;
        if (data.erro) { this.cepErroResp = true; return; }
        this.respEndereco.logradouro = data.logradouro;
        this.respEndereco.bairro     = data.bairro;
        this.respEndereco.uf         = data.uf;
        this.respEndereco.cidade     = data.localidade;
        if (!this.respEndereco.complemento) this.respEndereco.complemento = data.complemento;
      },
      error: () => { this.cepLoadingResp = false; this.cepErroResp = true; }
    });
  }

  toggleSameAddress(): void {
    if (this.useSameAddress) {
      this.respEndereco = { ...this.alunoEndereco };
      this.cepErroResp = false;
      this.cepLoadingResp = false;
    } else {
      this.respEndereco = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', uf: '', cidade: '' };
    }
  }

  setTab(tab: MatriculaTab): void {
    this.activeTab = tab;
    setTimeout(() => this.forceMatriculaStyles(), 50);
  }

  nextTab(): void {
    this.activeTab = 'responsaveis';
    setTimeout(() => this.forceMatriculaStyles(), 50);
  }

  prevTab(): void {
    this.activeTab = 'dados';
    setTimeout(() => this.forceMatriculaStyles(), 50);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.forceMatriculaStyles(), 50);

    // Observa mudancas no DOM e reaplica por 3s (UserWay costuma injetar estilos)
    let mutationDebounce: ReturnType<typeof setTimeout> | null = null;
    const observer = new MutationObserver(() => {
      if (mutationDebounce) clearTimeout(mutationDebounce);
      mutationDebounce = setTimeout(() => this.forceMatriculaStyles(), 300);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: false,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    setTimeout(() => {
      observer.disconnect();
    }, 3000);
  }

  private forceMatriculaStyles(): void {
    const page = document.querySelector('.matricula-page') as HTMLElement;
    if (page) {
      page.style.setProperty('text-align', 'left', 'important');
      page.style.setProperty('width', '100%', 'important');
      page.style.setProperty('margin', '0', 'important');
      page.style.setProperty('display', 'block', 'important');
    }

    const header = document.querySelector('.page-header') as HTMLElement;
    const h1 = document.querySelector('.page-header h1') as HTMLElement;
    if (h1) {
      h1.style.setProperty('text-align', 'left', 'important');
    }
    if (header) {
      header.style.setProperty('display', 'flex', 'important');
      header.style.setProperty('justify-content', 'space-between', 'important');
      header.style.setProperty('align-items', 'center', 'important');
      header.style.setProperty('text-align', 'left', 'important');
    }

    const tabs = document.querySelector('.tabs') as HTMLElement;
    if (tabs) {
      tabs.style.setProperty('display', 'flex', 'important');
      tabs.style.setProperty('justify-content', 'flex-start', 'important');
      tabs.style.setProperty('text-align', 'left', 'important');
    }

    const form = document.querySelector('.form') as HTMLElement;
    if (form) {
      form.style.setProperty('text-align', 'left', 'important');
      form.style.setProperty('width', '100%', 'important');
    }

    const grids = document.querySelectorAll('.field-grid') as NodeListOf<HTMLElement>;
    grids.forEach(grid => {
      grid.style.setProperty('display', 'grid', 'important');
      grid.style.setProperty('justify-items', 'stretch', 'important');
      grid.style.setProperty('text-align', 'left', 'important');
      grid.style.setProperty('width', '100%', 'important');
    });

    const fields = document.querySelectorAll('.field') as NodeListOf<HTMLElement>;
    fields.forEach(field => {
      field.style.setProperty('display', 'flex', 'important');
      field.style.setProperty('flex-direction', 'column', 'important');
      field.style.setProperty('align-items', 'stretch', 'important');
      field.style.setProperty('text-align', 'left', 'important');
      field.style.setProperty('width', '100%', 'important');

      const spans = field.querySelectorAll('span') as NodeListOf<HTMLElement>;
      spans.forEach(span => {
        span.style.setProperty('text-align', 'left', 'important');
        span.style.setProperty('display', 'block', 'important');
        span.style.setProperty('width', '100%', 'important');
      });

      const inputs = field.querySelectorAll('input, select') as NodeListOf<HTMLElement>;
      inputs.forEach(input => {
        input.style.setProperty('width', '100%', 'important');
        input.style.setProperty('text-align', 'left', 'important');
        input.style.setProperty('text-align-last', 'left', 'important');
        input.style.setProperty('display', 'block', 'important');
        input.style.setProperty('box-sizing', 'border-box', 'important');
      });
    });

    const fieldGroups = document.querySelectorAll('.field-group') as NodeListOf<HTMLElement>;
    fieldGroups.forEach(group => {
      group.style.setProperty('display', 'flex', 'important');
      group.style.setProperty('flex-direction', 'column', 'important');
      group.style.setProperty('align-items', 'stretch', 'important');
    });

    const sameAddressCheck = document.querySelector('.same-address-check') as HTMLElement;
    if (sameAddressCheck) {
      sameAddressCheck.style.setProperty('display', 'flex', 'important');
      sameAddressCheck.style.setProperty('flex-direction', 'row', 'important');
      sameAddressCheck.style.setProperty('align-items', 'center', 'important');
      sameAddressCheck.style.setProperty('justify-content', 'flex-start', 'important');
      sameAddressCheck.style.setProperty('width', '100%', 'important');
      sameAddressCheck.style.setProperty('position', 'relative', 'important');
      sameAddressCheck.style.setProperty('margin-left', '0', 'important');
    }

    const groupTitles = document.querySelectorAll('.group-title') as NodeListOf<HTMLElement>;
    groupTitles.forEach(title => {
      title.style.setProperty('text-align', 'left', 'important');
      title.style.setProperty('display', 'block', 'important');
      title.style.setProperty('width', '100%', 'important');
    });

    const formActions = document.querySelector('.form-actions') as HTMLElement;
    if (formActions) {
      formActions.style.setProperty('display', 'flex', 'important');
      formActions.style.setProperty('justify-content', 'space-between', 'important');
      formActions.style.setProperty('align-items', 'center', 'important');
      formActions.style.setProperty('text-align', 'left', 'important');
    }

    const submitBtn = document.querySelector('.form-actions .primary') as HTMLElement;
    if (submitBtn) {
      submitBtn.style.setProperty('margin-left', 'auto', 'important');
    }
  }
}
