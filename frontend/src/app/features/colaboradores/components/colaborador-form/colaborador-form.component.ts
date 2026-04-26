import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

type ColaboradorTab = 'dados' | 'formacao';

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

@Component({
  selector: 'app-colaborador-form',
  templateUrl: './colaborador-form.component.html',
  styleUrls: ['./colaborador-form.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class ColaboradorFormComponent implements OnInit {

  colaboradorId: number | null = null;
  isEdicao = false;
  activeTab: ColaboradorTab = 'dados';

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
  cargo = '';
  departamento = '';

  // Formacoes
  formacoes: FormacaoAcademica[] = [];
  novaFormacao: FormacaoAcademica = { grau: '', instituicao: '', areaEstudo: '', dataInicio: '', dataTermino: '', situacao: 'concluido' };
  mostrarFormFormacao = false;

  // Validacao
  mostrarErros = false;
  errosValidacao: { tab: ColaboradorTab; tabLabel: string; campos: string[] }[] = [];

  // Modal
  confirm = { visible: false, title: '', message: '', danger: false, callback: () => {} };

  // Estado
  salvando = false;
  erroSalvar = '';

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.colaboradorId = parseInt(id);
      this.isEdicao = true;
      this.carregarColaborador(id);
    } else {
      this.matriculaFuncional = 'COL-' + Math.floor(10000 + Math.random() * 90000);
    }
  }

  carregarColaborador(id: string): void {
    this.http.get<any>(`${environment.apiUrl}/colaboradores/${id}`).subscribe({
      next: (dados) => {
        this.matriculaFuncional = dados.matriculaFuncional || dados.idMatricula;
        this.nomeCompleto       = dados.nomeCompleto || '';
        this.nacionalidade      = dados.nacionalidade || '';
        this.generoSelecionado  = dados.genero || '';
        this.generoOutro        = dados.genero === 'outro';
        this.corRaca            = dados.corRaca || '';
        this.dataNascimento     = dados.dataNascimento || '';
        this.idade              = dados.idade ?? null;
        this.telefone           = dados.telefone || '';
        this.email              = dados.email || '';
        this.rg                 = dados.rg || '';
        this.orgaoEmissor       = dados.orgaoEmissor || '';
        this.estadoEmissor      = dados.estadoEmissor || '';
        this.cpf                = dados.cpf || '';
        this.cargo              = dados.cargo || '';
        this.departamento       = dados.departamento || '';
        if (dados.endereco) { this.endereco = { ...dados.endereco }; }
        if (dados.formacoes) { this.formacoes = dados.formacoes; }
      },
      error: () => alert('Erro ao carregar dados do colaborador.')
    });
  }

  setTab(tab: ColaboradorTab): void { this.activeTab = tab; }
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
    if (!this.cargo) f.push('Cargo');
    if (f.length) this.errosValidacao.push({ tab: 'formacao', tabLabel: 'Formacao Academica', campos: f });
    return this.errosValidacao.length === 0;
  }

  abrirConfirmacao(): void {
    this.mostrarErros = true;
    if (!this.validar()) return;
    this.openConfirm(
      this.isEdicao ? 'Atualizar colaborador' : 'Cadastrar colaborador',
      `Confirma o cadastro de "${this.nomeCompleto}"?`,
      false, () => this.salvar()
    );
  }

  salvar(): void {
    const payload = {
      matriculaFuncional: this.matriculaFuncional,
      nomeCompleto:   this.nomeCompleto,
      nacionalidade:  this.nacionalidade,
      genero:         this.generoOutro ? this.generoCustom : this.generoSelecionado,
      corRaca:        this.corRaca,
      dataNascimento: this.dataNascimento || null,
      telefone:       this.telefone,
      email:          this.email,
      rg:             this.rg,
      orgaoEmissor:   this.orgaoEmissor,
      estadoEmissor:  this.estadoEmissor,
      cpf:            this.cpf,
      cargo:          this.cargo,
      departamento:   this.departamento,
      endereco:       this.endereco,
      formacoes:      this.formacoes,
    };

    this.salvando = true;
    this.erroSalvar = '';

    const req$ = this.isEdicao
      ? this.http.put(`${environment.apiUrl}/colaboradores/${this.matriculaFuncional}`, payload)
      : this.http.post(`${environment.apiUrl}/colaboradores`, payload);

    req$.subscribe({
      next: () => { this.salvando = false; this.router.navigate(['/colaboradores']); },
      error: (err) => {
        this.salvando = false;
        this.erroSalvar = err?.error?.error || 'Erro ao salvar. Verifique os dados e tente novamente.';
      }
    });
  }

  voltar(): void { this.router.navigate(['/colaboradores']); }

  openConfirm(title: string, message: string, danger: boolean, callback: () => void): void {
    this.confirm = { visible: true, title, message, danger, callback };
  }
  confirmAction(): void { this.confirm.visible = false; this.confirm.callback(); }
  cancelConfirm(): void  { this.confirm.visible = false; }
}
