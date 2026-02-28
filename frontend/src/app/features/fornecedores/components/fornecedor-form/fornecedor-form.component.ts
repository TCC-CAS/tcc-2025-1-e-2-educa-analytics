import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface Fornecedor {
  id?: number;
  tipo: 'PF' | 'PJ' | '';
  nome: string;
  razaoSocial: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
}

@Component({
  selector: 'app-fornecedor-form',
  templateUrl: './fornecedor-form.component.html',
  styleUrls: ['./fornecedor-form.component.scss']
})
export class FornecedorFormComponent implements OnInit {
  fornecedorId: number | null = null;
  isEdicao: boolean = false;
  
  fornecedor: Fornecedor = {
    tipo: '',
    nome: '',
    razaoSocial: '',
    cpfCnpj: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fornecedorId = parseInt(id);
      this.isEdicao = true;
      this.carregarFornecedor();
    }
  }

  carregarFornecedor(): void {
    // Mock - substituir por chamada à API
    this.fornecedor = {
      id: this.fornecedorId!,
      tipo: 'PJ',
      nome: 'Papelaria Central',
      razaoSocial: 'Papelaria Central Ltda',
      cpfCnpj: '12.345.678/0001-90',
      email: 'contato@papelariacentral.com.br',
      telefone: '(31) 3456-7890',
      cep: '30130-000',
      endereco: 'Av. Afonso Pena, 1500'
    };
  }

  get mostrarRazaoSocial(): boolean {
    return this.fornecedor.tipo === 'PJ';
  }

  get labelNome(): string {
    return this.fornecedor.tipo === 'PF' ? 'Nome Completo' : 'Nome Fantasia';
  }

  get labelDocumento(): string {
    return this.fornecedor.tipo === 'PF' ? 'CPF' : 'CNPJ';
  }

  salvar(form: any): void {
    if (!form.valid) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validações específicas
    if (this.fornecedor.tipo === 'PF' && this.fornecedor.cpfCnpj.replace(/\D/g, '').length !== 11) {
      alert('CPF deve ter 11 dígitos');
      return;
    }

    if (this.fornecedor.tipo === 'PJ' && this.fornecedor.cpfCnpj.replace(/\D/g, '').length !== 14) {
      alert('CNPJ deve ter 14 dígitos');
      return;
    }

    if (this.isEdicao) {
      console.log('Atualizar fornecedor:', this.fornecedor);
      alert('Fornecedor atualizado com sucesso!');
      // Implementar chamada à API
    } else {
      console.log('Criar novo fornecedor:', this.fornecedor);
      alert('Fornecedor cadastrado com sucesso!');
      // Implementar chamada à API
    }

    this.voltar();
  }

  voltar(): void {
    this.router.navigate(['/fornecedores']);
  }
}
