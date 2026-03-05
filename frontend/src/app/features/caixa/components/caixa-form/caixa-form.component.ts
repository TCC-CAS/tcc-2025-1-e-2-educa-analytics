import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface Lancamento {
  id?: number;
  data: string;
  tipoConta: string;
  formaPagamento: string;
  tipoDespesa: string;
  descricao: string;
  fornecedor: string;
  valor: number;
}

@Component({
  selector: 'app-caixa-form',
  templateUrl: './caixa-form.component.html',
  styleUrls: ['./caixa-form.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class CaixaFormComponent implements OnInit {
  lancamentoId: number | null = null;
  isEdicao: boolean = false;

  // Modal de confirmação
  confirm = {
    visible: false,
    title: '',
    message: '',
    danger: false,
    callback: () => {}
  };
  
  lancamento: Lancamento = {
    data: '',
    tipoConta: '',
    formaPagamento: '',
    tipoDespesa: '',
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
      tipoConta: 'entrada',
      formaPagamento: 'pix',
      tipoDespesa: 'N/A',
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
      this.openConfirm(
        'Atualizar lançamento',
        `Tem certeza que deseja atualizar o lançamento "${this.lancamento.descricao}"?`,
        false,
        () => {
          console.log('Atualizar lançamento:', this.lancamento);
          this.voltar();
        }
      );
    } else {
      console.log('Criar novo lançamento:', this.lancamento);
      this.voltar();
    }
  }

  openConfirm(title: string, message: string, danger: boolean, callback: () => void): void {
    this.confirm = { visible: true, title, message, danger, callback };
  }

  confirmAction(): void { this.confirm.visible = false; this.confirm.callback(); }
  cancelConfirm(): void  { this.confirm.visible = false; }

  voltar(): void {
    this.router.navigate(['/caixa']);
  }
}
