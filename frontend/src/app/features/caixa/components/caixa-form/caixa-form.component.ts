import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface Lancamento {
  id?: number;
  data: string;
  tipoConta: string;
  descricao: string;
  fornecedor: string;
  valor: number;
}

@Component({
  selector: 'app-caixa-form',
  templateUrl: './caixa-form.component.html',
  styleUrls: ['./caixa-form.component.scss']
})
export class CaixaFormComponent implements OnInit {
  lancamentoId: number | null = null;
  isEdicao: boolean = false;
  
  lancamento: Lancamento = {
    data: '',
    tipoConta: '',
    descricao: '',
    fornecedor: '',
    valor: 0
  };

  fornecedores: string[] = [
    'Papelaria Central',
    'Cemig',
    'Copasa',
    'Supermercado Atacadão',
    'Livraria Cultura',
    'N/A'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.lancamento.data = new Date().toISOString().split('T')[0];
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.lancamentoId = parseInt(id);
      this.isEdicao = true;
      this.carregarLancamento();
    }
  }

  carregarLancamento(): void {
    // Mock - substituir por chamada à API
    this.lancamento = {
      id: this.lancamentoId!,
      data: '2026-02-20',
      tipoConta: 'credito',
      descricao: 'Mensalidade Fevereiro - João Silva',
      fornecedor: 'N/A',
      valor: 450.00
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
    } else {
      console.log('Criar novo lançamento:', this.lancamento);
      alert('Lançamento registrado com sucesso!');
    }

    this.voltar();
  }

  voltar(): void {
    this.router.navigate(['/caixa']);
  }
}
