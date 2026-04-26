import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

type EducadorTab = 'dados' | 'formacao';

interface ViaCepResponse {
  cep: string; logradouro: string; complemento: string;
  bairro: string; localidade: string; uf: string; erro?: boolean;
}

interface Endereco {
  cep: string; logradouro: string; numero: string;
  complemento: string; bairro: string; uf: string; cidade: string;
}

interface FormacaoAcademica {
  id?: number;
  grau: string;
  instituicao: string;
  areaEstudo: string;
  dataInicio: string;
  dataTermino: string;
  situacao: string;
}

interface Disciplina {
  idDisciplina: number;
  codDisciplina: string;
  nomeDisciplina: string;
  areaConhecimento: string;
}

@Component({
  selector: 'app-educador-form',
  templateUrl: './educador-form.component.html',
  styleUrls: ['./educador-form.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class EducadorFormComponent implements OnInit {

  isEdicao = false;
  activeTab: EducadorTab = 'dados';

  // Identificacao
  matriculaFuncional = '';
  nomeCompleto = '';
  nacionalidade = '';
  generoSelecionado = '';
  generoOutro = false;
  generoCustom = '';
  corRaca = '';
  dataNascimento = '';
  idade: number | null = null;

  // Endereco
  endereco: Endereco = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', uf: '', cidade: '' };
  cepLoading = false;
  cepErro = false;

  // Contato
  telefone = '';
  email = '';

  // Documentos
  rg = '';
  orgaoEmissor = '';
  estadoEmissor = '';
  cpf = '';

  // Dados Profissionais
  disciplinasSelecionadas: number[] = [];
  periodosSelecionados: string[] = [];

  // Catálogo de disciplinas da API
  disciplinasDisponiveis: Disciplina[] = [];
  readonly periodosDisponiveis = [
    { value: 'matutino',   label: 'Matutino' },
    { value: 'vespertino', label: 'Vespertino' },
    { value: 'noturno',    label: 'Noturno' },
    { value: 'integral',   label: 'Integral' },
  ];

  // Formacoes
  formacoes: FormacaoAcademica[] = [];
  novaFormacao: FormacaoAcademica = { grau: '', instituicao: '', areaEstudo: '', dataInicio: '', dataTermino: '', situacao: 'concluido' };
  mostrarFormFormacao = false;

  // Validacao
  mostrarErros = false;
  errosValidacao: { tab: EducadorTab; tabLabel: string; campos: string[] }[] = [];

  // Modal de confirmação
  modalConfirmacaoAberto = false;
  emailEnviando = false;
  educadorRealizado = false;
  emailErro = false;
  emailErrMsg = '';
  educadorCadastradoId = '';

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.carregarDisciplinas();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdicao = true;
      this.carregarEducador(id);
    } else {
      this.matriculaFuncional = 'EDU-' + Math.floor(10000 + Math.random() * 90000);
    }
  }

  carregarDisciplinas(): void {
    this.http.get<Disciplina[]>(`${environment.apiUrl}/disciplinas`).subscribe({
      next: (lista) => { this.disciplinasDisponiveis = lista; },
      error: () => {} // silencioso — não bloqueia o form
    });
  }

  toggleDisciplina(id: number): void {
    const idx = this.disciplinasSelecionadas.indexOf(id);
    if (idx >= 0) {
      this.disciplinasSelecionadas = this.disciplinasSelecionadas.filter(d => d !== id);
    } else {
      this.disciplinasSelecionadas = [...this.disciplinasSelecionadas, id];
    }
  }

  isDisciplinaSelecionada(id: number): boolean {
    return this.disciplinasSelecionadas.includes(id);
  }

  togglePeriodo(value: string): void {
    const idx = this.periodosSelecionados.indexOf(value);
    if (idx >= 0) {
      this.periodosSelecionados = this.periodosSelecionados.filter(p => p !== value);
    } else {
      this.periodosSelecionados = [...this.periodosSelecionados, value];
    }
  }

  isPeriodoSelecionado(value: string): boolean {
    return this.periodosSelecionados.includes(value);
  }

  // ── Máscaras ──────────────────────────────────────────────────────────────

  onRgInput(event: Event): void {
    let v = (event.target as HTMLInputElement).value.replace(/\D/g, '');
    if (v.length > 9) v = v.slice(0, 9);
    if (v.length > 8) v = v.slice(0, 2) + '.' + v.slice(2, 5) + '.' + v.slice(5, 8) + '-' + v.slice(8);
    else if (v.length > 5) v = v.slice(0, 2) + '.' + v.slice(2, 5) + '.' + v.slice(5);
    else if (v.length > 2) v = v.slice(0, 2) + '.' + v.slice(2);
    this.rg = v;
  }

  onCpfInput(event: Event): void {
    let v = (event.target as HTMLInputElement).value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 9) v = v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6, 9) + '-' + v.slice(9);
    else if (v.length > 6) v = v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6);
    else if (v.length > 3) v = v.slice(0, 3) + '.' + v.slice(3);
    this.cpf = v;
  }

  onTelefoneInput(event: Event): void {
    let v = (event.target as HTMLInputElement).value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length === 11) {
      v = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
    } else if (v.length === 10) {
      v = '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
    } else if (v.length > 6) {
      v = '(' + v.slice(0, 2) + ') ' + v.slice(2);
    } else if (v.length > 2) {
      v = '(' + v.slice(0, 2) + ') ' + v.slice(2);
    }
    this.telefone = v;
  }

  carregarEducador(id: string): void {
    this.http.get<any>(`${environment.apiUrl}/educadores/${id}`).subscribe({
      next: (dados) => {
        this.matriculaFuncional    = dados.matriculaFuncional || dados.idMatricula;
        this.nomeCompleto          = dados.nomeCompleto || '';
        this.nacionalidade         = dados.nacionalidade || '';
        this.generoSelecionado     = dados.genero || '';
        this.generoOutro           = dados.genero === 'outro';
        this.corRaca               = dados.corRaca || '';
        this.dataNascimento        = dados.dataNascimento || '';
        this.idade                 = dados.idade ?? null;
        this.telefone              = dados.telefone || '';
        this.email                 = dados.email || '';
        this.rg                    = dados.rg || '';
        this.orgaoEmissor          = dados.orgaoEmissor || '';
        this.estadoEmissor         = dados.estadoEmissor || '';
        this.cpf                   = dados.cpf || '';
        this.disciplinasSelecionadas = dados.disciplinas || [];
        this.periodosSelecionados    = dados.periodos || [];
        if (dados.endereco) { this.endereco = { ...dados.endereco }; }
        if (dados.formacoes) { this.formacoes = dados.formacoes; }
      },
      error: () => alert('Erro ao carregar dados do educador.')
    });
  }

  setTab(tab: EducadorTab): void { this.activeTab = tab; }
  nextTab(): void { this.activeTab = 'formacao'; }

  onGeneroChange(value: string): void {
    this.generoOutro = value === 'outro';
    if (!this.generoOutro) this.generoCustom = '';
  }

  onNascimentoChange(value: string): void {
    if (!value) { this.idade = null; return; }
    const hoje = new Date(); const nasc = new Date(value);
    let anos = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
    this.idade = anos >= 0 ? anos : null;
  }

  buscarCep(): void {
    const cep = this.endereco.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    this.cepLoading = true; this.cepErro = false;
    this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: (res) => {
        this.cepLoading = false;
        if (res.erro) { this.cepErro = true; return; }
        this.endereco.logradouro = res.logradouro;
        this.endereco.complemento = res.complemento;
        this.endereco.bairro = res.bairro;
        this.endereco.uf = res.uf;
        this.endereco.cidade = res.localidade;
      },
      error: () => { this.cepLoading = false; this.cepErro = true; }
    });
  }

  abrirFormFormacao(): void {
    this.novaFormacao = { grau: '', instituicao: '', areaEstudo: '', dataInicio: '', dataTermino: '', situacao: 'concluido' };
    this.mostrarFormFormacao = true;
  }

  adicionarFormacao(): void {
    if (!this.novaFormacao.grau || !this.novaFormacao.instituicao || !this.novaFormacao.areaEstudo) return;
    this.formacoes.push({ ...this.novaFormacao, id: Date.now() });
    this.mostrarFormFormacao = false;
  }

  cancelarFormacao(): void { this.mostrarFormFormacao = false; }

  removerFormacao(id: number | undefined): void {
    this.formacoes = this.formacoes.filter(f => f.id !== id);
  }

  validar(): boolean {
    this.errosValidacao = [];
    const d: string[] = [];
    if (!this.nomeCompleto) d.push('Nome completo');
    if (!this.nacionalidade) d.push('Nacionalidade');
    if (!this.generoSelecionado) d.push('Genero');
    if (!this.corRaca) d.push('Cor / Raca');
    if (!this.dataNascimento) d.push('Data de nascimento');
    if (!this.endereco.cep) d.push('CEP');
    if (!this.endereco.logradouro) d.push('Endereco');
    if (!this.endereco.numero) d.push('Numero');
    if (!this.telefone) d.push('Telefone');
    if (!this.email) d.push('E-mail');
    if (!this.rg) d.push('RG');
    if (!this.cpf) d.push('CPF');
    if (d.length) this.errosValidacao.push({ tab: 'dados', tabLabel: 'Dados Pessoais', campos: d });
    const f: string[] = [];
    if (this.disciplinasSelecionadas.length === 0) f.push('Pelo menos uma disciplina');
    if (this.periodosSelecionados.length === 0) f.push('Pelo menos um período');
    if (f.length) this.errosValidacao.push({ tab: 'formacao', tabLabel: 'Formacao Academica', campos: f });
    return this.errosValidacao.length === 0;
  }

  abrirConfirmacao(): void {
    this.mostrarErros = true;
    if (!this.validar()) return;
    this.emailErro = false;
    this.modalConfirmacaoAberto = true;
  }

  fecharModal(): void {
    if (this.emailEnviando) return;
    this.modalConfirmacaoAberto = false;
  }

  confirmarCadastro(): void {
    const payload = {
      matriculaFuncional:        this.matriculaFuncional,
      nomeCompleto:              this.nomeCompleto,
      nacionalidade:             this.nacionalidade,
      genero:                    this.generoOutro ? this.generoCustom : this.generoSelecionado,
      corRaca:                   this.corRaca,
      dataNascimento:            this.dataNascimento || null,
      telefone:                  this.telefone,
      email:                     this.email,
      rg:                        this.rg,
      orgaoEmissor:              this.orgaoEmissor,
      estadoEmissor:             this.estadoEmissor,
      cpf:                       this.cpf,
      disciplinas:               this.disciplinasSelecionadas,
      periodos:                  this.periodosSelecionados,
      endereco:                  this.endereco,
      formacoes:                 this.formacoes,
    };

    this.emailEnviando = true;
    this.emailErro = false;

    const req$ = this.isEdicao
      ? this.http.put<any>(`${environment.apiUrl}/educadores/${this.matriculaFuncional}`, payload)
      : this.http.post<any>(`${environment.apiUrl}/educadores`, payload);

    req$.subscribe({
      next: (res: any) => {
        this.emailEnviando = false;
        this.educadorCadastradoId = res?.idMatricula || this.matriculaFuncional;
        this.educadorRealizado = true;
      },
      error: (err: any) => {
        this.emailEnviando = false;
        this.emailErro = true;
        this.emailErrMsg = err?.error?.error || 'Erro ao salvar. Verifique os dados e tente novamente.';
      }
    });
  }

  voltar(): void { this.router.navigate(['/colaboradores']); }
  voltarParaLista(): void { this.router.navigate(['/colaboradores']); }
}
