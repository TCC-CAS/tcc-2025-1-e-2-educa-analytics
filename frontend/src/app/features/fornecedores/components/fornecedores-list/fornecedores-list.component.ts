import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Fornecedor {
  id: number;
  tipo: 'PF' | 'PJ';
  nome: string;
  razaoSocial?: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  ativo: boolean;
}

@Component({
  selector: 'app-fornecedores-list',
  templateUrl: './fornecedores-list.component.html',
  styleUrls: ['./fornecedores-list.component.scss']
})
export class FornecedoresListComponent implements OnInit {
  fornecedores: Fornecedor[] = [];
  fornecedoresFiltrados: Fornecedor[] = [];
  
  // Filtros
  filtroTipo: string = '';
  filtroNome: string = '';
  filtroStatus: string = '';
  
  // Seleção
  selecionados: Set<number> = new Set();

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.carregarFornecedores();
  }

  carregarFornecedores(): void {
    // Mock data - substituir por chamada à API
    this.fornecedores = [
      {
        id: 1,
        tipo: 'PJ',
        nome: 'Papelaria Central',
        razaoSocial: 'Papelaria Central Ltda',
        cpfCnpj: '12.345.678/0001-90',
        email: 'contato@papelariacentral.com.br',
        telefone: '(31) 3456-7890',
        cep: '30130-000',
        endereco: 'Av. Afonso Pena, 1500',
        ativo: true
      },
      {
        id: 2,
        tipo: 'PJ',
        nome: 'Companhia de Energia',
        razaoSocial: 'CEMIG Distribuição S.A.',
        cpfCnpj: '06.981.176/0001-16',
        email: 'atendimento@cemig.com.br',
        telefone: '(31) 3506-1500',
        cep: '30190-922',
        endereco: 'Av. Barbacena, 1200',
        ativo: true
      },
      {
        id: 3,
        tipo: 'PF',
        nome: 'João Carlos Silva',
        cpfCnpj: '123.456.789-00',
        email: 'joao.silva@email.com',
        telefone: '(31) 98765-4321',
        cep: '30140-071',
        endereco: 'Rua Rio de Janeiro, 1000',
        ativo: true
      },
      {
        id: 4,
        tipo: 'PJ',
        nome: 'Fornecedor de Alimentos',
        razaoSocial: 'Alimentos BH Ltda',
        cpfCnpj: '98.765.432/0001-10',
        email: 'vendas@alimentosbh.com.br',
        telefone: '(31) 3200-5500',
        cep: '31110-000',
        endereco: 'Rua dos Goi  tácazes, 500',
        ativo: false
      }
    ];
    
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.fornecedoresFiltrados = this.fornecedores.filter(fornecedor => {
      const matchTipo = !this.filtroTipo || fornecedor.tipo === this.filtroTipo;
      const matchNome = !this.filtroNome || 
        fornecedor.nome.toLowerCase().includes(this.filtroNome.toLowerCase()) ||
        (fornecedor.razaoSocial && fornecedor.razaoSocial.toLowerCase().includes(this.filtroNome.toLowerCase()));
      const matchStatus = !this.filtroStatus || 
        (this.filtroStatus === 'ativo' && fornecedor.ativo) ||
        (this.filtroStatus === 'inativo' && !fornecedor.ativo);
      
      return matchTipo && matchNome && matchStatus;
    });
  }

  limparFiltros(): void {
    this.filtroTipo = '';
    this.filtroNome = '';
    this.filtroStatus = '';
    this.aplicarFiltros();
  }

  toggleSelecao(id: number): void {
    if (this.selecionados.has(id)) {
      this.selecionados.delete(id);
    } else {
      this.selecionados.add(id);
    }
  }

  toggleTodos(event: any): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.fornecedoresFiltrados.forEach(f => this.selecionados.add(f.id));
    } else {
      this.selecionados.clear();
    }
  }

  get quantidadeSelecionados(): number {
    return this.selecionados.size;
  }

  ativarSelecionados(): void {
    if (this.quantidadeSelecionados === 0) {
      alert('Selecione pelo menos um fornecedor');
      return;
    }
    
    if (confirm(`Tem certeza que deseja ativar ${this.quantidadeSelecionados} fornecedor(es)?`)) {
      // Implementar chamada à API
      this.fornecedores.forEach(f => {
        if (this.selecionados.has(f.id)) {
          f.ativo = true;
        }
      });
      this.selecionados.clear();
      this.aplicarFiltros();
    }
  }

  desativarSelecionados(): void {
    if (this.quantidadeSelecionados === 0) {
      alert('Selecione pelo menos um fornecedor');
      return;
    }
    
    if (confirm(`Tem certeza que deseja desativar ${this.quantidadeSelecionados} fornecedor(es)?`)) {
      // Implementar chamada à API
      this.fornecedores.forEach(f => {
        if (this.selecionados.has(f.id)) {
          f.ativo = false;
        }
      });
      this.selecionados.clear();
      this.aplicarFiltros();
    }
  }

  excluirSelecionados(): void {
    if (this.quantidadeSelecionados === 0) {
      alert('Selecione pelo menos um fornecedor');
      return;
    }
    
    if (confirm(`Tem certeza que deseja excluir ${this.quantidadeSelecionados} fornecedor(es)? Esta ação não pode ser desfeita.`)) {
      // Implementar chamada à API
      this.fornecedores = this.fornecedores.filter(f => !this.selecionados.has(f.id));
      this.selecionados.clear();
      this.aplicarFiltros();
    }
  }

  novo(): void {
    this.router.navigate(['/fornecedores/novo']);
  }

  editar(id: number): void {
    this.router.navigate([`/fornecedores/${id}/editar`]);
  }

  excluir(fornecedor: Fornecedor): void {
    if (confirm(`Tem certeza que deseja excluir o fornecedor "${fornecedor.nome}"?`)) {
      // Implementar chamada à API
      this.fornecedores = this.fornecedores.filter(f => f.id !== fornecedor.id);
      this.aplicarFiltros();
    }
  }
}
