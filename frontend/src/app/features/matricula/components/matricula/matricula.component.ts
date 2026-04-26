import { Component, AfterViewInit, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
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
  vagasOcupadas: number[];
}

interface TurmaBackend {
  idTurma: number;
  codTurma: string;
  nomeTurma: string;
  periodo: string;
  anoLetivo: string;
  serie: string;
  qldVagas: number;
  dataInicio: string;
  dataFim: string;
  status: string;
  idSala: number | null;
  nomeSala: string | null;
  vagasOcupadas: number[];
  vagasDisponiveis: number;
}

@Component({
  selector: 'app-matricula',
  templateUrl: './matricula.component.html',
  styleUrls: ['./matricula.component.scss']
})
export class MatriculaComponent implements OnInit, AfterViewInit {
  activeTab: MatriculaTab = 'dados';
  useSameAddress = false;

  // Gênero 
  alunoGeneroSelecionado = '';
  alunoGeneroOutro = false;
  alunoGeneroCustom = '';
  alunoCorRaca = '';

  respGeneroSelecionado = '';
  respGeneroOutro = false;
  respGeneroCustom = '';
  respCorRaca = '';

  // Rematrícula 
  modoRematricula = false;
  rematriculaOriginalId = '';

  // ID Matrícula 
  matriculaId = this.gerarMatriculaId();
  respMatriculaId = this.gerarMatriculaId();

  // Campos não ligados aos outros grupos 
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

  // Validação 
  errosValidacao: { tab: MatriculaTab; tabLabel: string; campos: string[] }[] = [];
  mostrarErros = false;

  // Modal de confirmação 
  modalConfirmacaoAberto = false;
  emailEnviando = false;
  matriculaRealizada = false;
  emailErro = false;
  emailErrMsg = '';

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

    // Dados Escolares
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

    const enderecoResp = this.useSameAddress
      ? { ...this.alunoEndereco }
      : { ...this.respEndereco };

    const payload = {
      educando: {
        idMatricula:   this.matriculaId,
        nomeCompleto:  this.alunoNome,
        email:         this.alunoEmail,
        cpf:           this.alunoCpf,
        tipoUsuario:   'educando',
        nacionalidade: this.alunoNacionalidade,
        genero:        this.alunoGeneroOutro ? this.alunoGeneroCustom : this.alunoGeneroSelecionado,
        cor:           this.alunoCorRaca,
        dataNascimento: this.alunoNascimento,
        telefone:      this.alunoTelefone,
        rg:            this.alunoRg,
        orgaoEmissor:  this.alunoOrgaoEmissor,
        estadoEmissor: this.alunoEstadoEmissor,
        endereco: { ...this.alunoEndereco },
      },
      responsavel: {
        idMatricula:   this.respMatriculaId,
        nomeCompleto:  this.respNome,
        email:         this.respEmail,
        cpf:           this.respCpf,
        tipoUsuario:   'responsavel',
        nacionalidade: this.respNacionalidade,
        genero:        this.respGeneroOutro ? this.respGeneroCustom : this.respGeneroSelecionado,
        cor:           this.respCorRaca,
        dataNascimento: this.respNascimento,
        telefone:      this.respTelefone,
        rg:            this.respRg,
        orgaoEmissor:  this.respOrgaoEmissor,
        estadoEmissor: this.respEstadoEmissor,
        endereco: enderecoResp,
      },
      dadosEscolares: {
        anoLetivo: this.anoLetivo,
        serie:     this.serie,
        periodo:   this.periodo,
        codTurma:  this.codigoTurma,
      },
    };

    this.http.post(`${environment.apiUrl}/matricula`, payload).subscribe({
      next: () => {
        this.emailEnviando = false;
        this.matriculaRealizada = true;
      },
      error: (err) => {
        this.emailEnviando = false;
        this.emailErro = true;
        const body = err?.error;
        this.emailErrMsg = body?.error || 'Verifique se o servidor está rodando e tente novamente.';
        console.error('[Educa Analytics] Erro ao realizar matrícula:', err);
      },
    });
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
    this.emailErrMsg = '';
    this.setTab('dados');
  }

  // Nascimento / Idade ─
  alunoNascimento = '';
  alunoIdade: number | null = null;

  respNascimento = '';
  respIdade: number | null = null;

  // Dados Escolares 
  serie = '';
  codigoTurma = '';
  turmaSelecionada = '';
  anoLetivo = new Date().getFullYear().toString();
  dataInicio = '';
  dataTermino = '';
  periodo = '';
  sala = '';

  // Modal de vagas 
  modalAberto = false;
  turmaModalTemp = '';
  vagasModal: Vaga[] = [];
  readonly TOTAL_VAGAS = 30;
  readonly COLUNAS = 6;
  readonly LINHAS = ['A', 'B', 'C', 'D', 'E'];

  turmas: TurmaDetalhe[] = [];
  turmasCarregando = false;

  private readonly periodosLabel: Record<string, string> = {
    matutino: 'Manhã', vespertino: 'Tarde', noturno: 'Noite', integral: 'Integral'
  };

  anosLetivos: string[] = Array.from({ length: 6 }, (_, i) =>
    (new Date().getFullYear() - 1 + i).toString()
  );

  seriesDisponiveis: string[] = [];
  periodosDisponiveis: { value: string; label: string }[] = [];

  private computarSeries(): void {
    if (!this.anoLetivo) { this.seriesDisponiveis = []; return; }
    this.http.get<string[]>(`${environment.apiUrl}/matricula/series?anoLetivo=${this.anoLetivo}`)
      .subscribe({ next: (series) => { this.seriesDisponiveis = series; } });
  }

  private computarPeriodos(): void {
    if (!this.anoLetivo || !this.serie) { this.periodosDisponiveis = []; return; }
    const params = `anoLetivo=${encodeURIComponent(this.anoLetivo)}&serie=${encodeURIComponent(this.serie)}`;
    this.http.get<string[]>(`${environment.apiUrl}/matricula/periodos?${params}`)
      .subscribe({
        next: (periodos) => {
          this.periodosDisponiveis = periodos.map(p => ({ value: p, label: this.periodosLabel[p] ?? p }));
        },
      });
  }

  private carregarTurmas(): void {
    if (!this.anoLetivo || !this.serie || !this.periodo) { this.turmas = []; return; }
    this.turmasCarregando = true;
    const params = `anoLetivo=${encodeURIComponent(this.anoLetivo)}&serie=${encodeURIComponent(this.serie)}&periodo=${encodeURIComponent(this.periodo)}`;
    this.http.get<TurmaBackend[]>(`${environment.apiUrl}/matricula/turmas?${params}`)
      .subscribe({
        next: (turmasBackend) => {
          this.turmas = turmasBackend.map(t => ({
            codigo:       t.codTurma,
            nome:         t.nomeTurma,
            anoLetivo:    String(t.anoLetivo),
            serie:        t.serie,
            periodo:      t.periodo,
            sala:         t.nomeSala ?? '',
            dataInicio:   t.dataInicio ?? '',
            dataTermino:  t.dataFim ?? '',
            vagasOcupadas: t.vagasOcupadas ?? [],
          }));
          this.turmasCarregando = false;
        },
        error: () => { this.turmasCarregando = false; },
      });
  }

  get turmasFiltradas(): TurmaDetalhe[] {
    return this.turmas;
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
    this.turmas = [];
    this.computarSeries();
    this.periodosDisponiveis = [];
  }

  onSerieChange(_: string): void {
    this.periodo = '';
    this.turmaSelecionada = ''; this.turmaModalTemp = '';
    this.codigoTurma = ''; this.dataInicio = ''; this.dataTermino = ''; this.sala = '';
    this.turmas = [];
    this.computarPeriodos();
  }

  onPeriodoChange(_: string): void {
    this.turmaSelecionada = ''; this.turmaModalTemp = '';
    this.codigoTurma = ''; this.dataInicio = ''; this.dataTermino = ''; this.sala = '';
    this.carregarTurmas();
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

  // CEP ───
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

  voltarParaLista(): void {
    this.router.navigate(['/matricula/lista']);  // voltarParaLista
  }

  constructor(private http: HttpClient, private router: Router) {
    // Lê o estado da navegação no construtor (getCurrentNavigation só está disponível aqui)
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { rematricula?: MatriculaRegistro } | undefined;
    if (state?.rematricula) {
      this.preencherDadosRematricula(state.rematricula);
    }
  }

  ngOnInit(): void {
    this.computarSeries();
  }

  private preencherDadosRematricula(m: MatriculaRegistro): void {
    this.modoRematricula = true;
    this.rematriculaOriginalId = String(m.id);

    // Educando
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

    // Responsável
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

  // Gênero 
  onAlunoGeneroChange(valor: string): void {
    this.alunoGeneroOutro = valor === 'outro';
    if (!this.alunoGeneroOutro) this.alunoGeneroCustom = '';
  }

  onRespGeneroChange(valor: string): void {
    this.respGeneroOutro = valor === 'outro';
    if (!this.respGeneroOutro) this.respGeneroCustom = '';
  }

  // Idade
  readonly maxDataNasc = new Date().toISOString().split('T')[0];
  readonly minDataNasc = '1900-01-01';

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
    return (idade >= 0 && idade <= 120) ? idade : null;
  }

  onAlunoNascimentoChange(data: string): void {
    this.alunoIdade = this.calcularIdade(data);
  }

  onRespNascimentoChange(data: string): void {
    this.respIdade = this.calcularIdade(data);
  }

  mascaraCpf(event: Event): void {
    const el = event.target as HTMLInputElement;
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    el.value = v;
    if (el.name === 'alunoCpf') this.alunoCpf = v;
    else if (el.name === 'respCpf') this.respCpf = v;
  }

  mascaraRg(event: Event): void {
    const el = event.target as HTMLInputElement;
    let v = el.value.replace(/[^\dXx]/g, '').slice(0, 9);
    if (v.length > 8) v = v.replace(/(\d{2})(\d{3})(\d{3})([\dXx])/, '$1.$2.$3-$4');
    else if (v.length > 5) v = v.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,3})/, '$1.$2');
    el.value = v;
    if (el.name === 'alunoRg') this.alunoRg = v;
    else if (el.name === 'respRg') this.respRg = v;
  }

  mascaraTelefone(event: Event): void {
    const el = event.target as HTMLInputElement;
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length === 11) v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else if (v.length === 10) v = v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    el.value = v;
    if (el.name === 'alunoTelefone') this.alunoTelefone = v;
    else if (el.name === 'respTelefone') this.respTelefone = v;
  }

  // CEP
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
