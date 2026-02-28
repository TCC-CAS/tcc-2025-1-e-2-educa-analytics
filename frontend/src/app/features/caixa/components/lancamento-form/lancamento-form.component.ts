import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface Lancamento {
  id?: number;
  data: string;
  tipoConta: 'Crédito' | 'Débito' | '';
  descricao: string;
  fornecedorId: string;
  fornecedorNome?: string;
  valor: number;
}

@Component({
  selector: 'app-lancamento-form',
  templateUrl: './lancamento-form.component.html',
  styleUrls: ['./lancamento-form.component.scss']
})
export class LancamentoFormComponent implements OnInit {
  lancamentoId: number | null = null;
  isEdicao: boolean = false;
  
  lancamento: Lancamento = {
    data: '',
    tipoConta: '',
    descricao: '',
    fornecedorId: '',
    valor: 0
  };

  fornecedores: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.lancamento.data = new Date().toISOString().split('T')[0];
    this.carregarFornecedores();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.lancamentoId = parseInt(id);
      this.isEdicao = true;
      this.carregarLancamento();
    }
  }

  carregarFornecedores(): void {
    // Mock data - substituir por chamada à API
    this.fornecedores = [
      { id: '1', nome: 'Receitas Escolares' },
      { id: '2', nome: 'Companhia de Energia' },
      { id: '3', nome: 'Papelaria Central' },
      { id: '4', nome: 'Fornecedor de Alimentos' },
      { id: '5', nome: 'Serviços de Limpeza' }
    ];
  }

  carregarLancamento(): void {
    // Mock - substituir por chamada à API
    this.lancamento = {
      id: this.lancamentoId!,
      data: '2026-02-20',
      tipoConta: 'Crédito',
      descricao: 'Mensalidade - Turma 6A',
      fornecedorId: '1',
      valor: 15000.00
    };
  }

  salvar(form: any): void {
    if (!form.valid) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (this.lancamento.valor <= 0) {
      alert('O valor deve ser maior que zero');
      return;
    }

    if (this.isEdicao) {
      console.log('Atualizar lançamento:', this.lancamento);
      alert('Lançamento atualizado com sucesso!');
      // Implementar chamada à API
    } else {
      console.log('Criar novo lançamento:', this.lancamento);
      alert('Lançamento registrado com sucesso!');
      // Implementar chamada à API
    }

    this.voltar();
  }

  voltar(): void {
    this.router.navigate(['/caixa']);
  }
}
