import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FornecedoresService } from '../../services/fornecedores.service';

interface FornecedorForm {
  id?: number;
  tipo: 'PF' | 'PJ' | '';
  nome: string;
  razaoSocial: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  centroCusto: string;
  tipoDespesa: string;
}

@Component({
  selector: 'app-fornecedor-form',
  templateUrl: './fornecedor-form.component.html',
  styleUrls: ['./fornecedor-form.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class FornecedorFormComponent implements OnInit {
  fornecedorId: number | null = null;
  isEdicao = false;
  salvando = false;
  buscandoCep = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  fornecedor: FornecedorForm = {
    tipo: '',
    nome: '',
    razaoSocial: '',
    cpfCnpj: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    centroCusto: '',
    tipoDespesa: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fornecedoresService: FornecedoresService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fornecedorId = parseInt(id, 10);
      this.isEdicao = true;
      this.carregarFornecedor();
    }
  }

  carregarFornecedor(): void {
    this.fornecedoresService.buscar(this.fornecedorId!).subscribe({
      next: (dados) => {
        this.fornecedor = {
          id: dados.id,
          tipo: dados.tipo,
          nome: dados.nome,
          razaoSocial: dados.razaoSocial || '',
          cpfCnpj: dados.cpfCnpj,
          email: dados.email,
          telefone: dados.telefone,
          cep: dados.cep,
          endereco: dados.endereco,
          centroCusto: dados.centroCusto || '',
          tipoDespesa: dados.tipoDespesa || dados.categoria
        };
      },
      error: () => this.showMessage('Erro ao carregar dados do fornecedor.', 'error')
    });
  }

  buscarCep(): void {
    const cep = (this.fornecedor.cep || '').replace(/\D/g, '');
    if (cep.length !== 8) return;

    this.buscandoCep = true;
    this.fornecedoresService.buscarCep(cep).subscribe({
      next: (dados: any) => {
        this.buscandoCep = false;
        if (dados.erro) {
          this.showMessage('CEP não encontrado.', 'error');
          return;
        }
        const partes = [dados.logradouro, dados.bairro, `${dados.localidade} - ${dados.uf}`]
          .filter(Boolean).join(', ');
        this.fornecedor.endereco = partes;
      },
      error: () => {
        this.buscandoCep = false;
        this.showMessage('Erro ao buscar CEP. Verifique e preencha o endereço manualmente.', 'error');
      }
    });
  }

  get mostrarRazaoSocial(): boolean { return this.fornecedor.tipo === 'PJ'; }
  get labelNome(): string { return this.fornecedor.tipo === 'PF' ? 'Nome Completo' : 'Nome Fantasia'; }
  get labelDocumento(): string { return this.fornecedor.tipo === 'PF' ? 'CPF' : 'CNPJ'; }

  salvar(form: any): void {
    if (!form.valid) {
      this.showMessage('Preencha todos os campos obrigatórios antes de continuar.', 'error');
      return;
    }

    const digitos = this.fornecedor.cpfCnpj.replace(/\D/g, '');
    if (this.fornecedor.tipo === 'PF' && digitos.length !== 11) {
      this.showMessage('CPF inválido — deve ter 11 dígitos.', 'error');
      return;
    }
    if (this.fornecedor.tipo === 'PJ' && digitos.length !== 14) {
      this.showMessage('CNPJ inválido — deve ter 14 dígitos.', 'error');
      return;
    }

    this.salvando = true;
    const payload = {
      tipo: this.fornecedor.tipo as 'PF' | 'PJ',
      nome: this.fornecedor.nome,
      razaoSocial: this.fornecedor.razaoSocial || '',
      cpfCnpj: this.fornecedor.cpfCnpj,
      email: this.fornecedor.email,
      telefone: this.fornecedor.telefone,
      cep: this.fornecedor.cep,
      endereco: this.fornecedor.endereco,
      centroCusto: this.fornecedor.centroCusto,
      tipoDespesa: this.fornecedor.tipoDespesa,
      categoria: this.fornecedor.tipoDespesa
    };

    const request$ = this.isEdicao
      ? this.fornecedoresService.atualizar(this.fornecedorId!, payload)
      : this.fornecedoresService.criar(payload);

    request$.subscribe({
      next: () => {
        this.salvando = false;
        this.router.navigate(['/fornecedores']);
      },
      error: (err) => {
        this.salvando = false;
        this.showMessage(err?.error?.error || 'Erro ao salvar. Tente novamente.', 'error');
      }
    });
  }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => { this.message = ''; }, 5000);
  }

  voltar(): void {
    this.router.navigate(['/fornecedores']);
  }
}
