import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Lancamento {
  id: number;
  data: string;
  tipoConta: 'entrada' | 'saida';
  formaPagamento: string;
  tipoDespesa: string;
  descricao: string;
  fornecedor: string;
  valor: number;
  usuario: string;
}

@Component({
  selector: 'app-caixa-list',
  templateUrl: './caixa-list.component.html',
  styleUrls: ['./caixa-list.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class CaixaListComponent implements OnInit {
  lancamentos: Lancamento[] = [];
  lancamentosFiltrados: Lancamento[] = [];
  
  // Filtros
  filtroMes: string = '';
  filtroData: string = '';
  filtroTipo: string = '';
  filtroFornecedor: string = '';
  filtroFormaPagamento: string = '';
  filtroTipoDespesa: string = '';
  
  // Totalizadores
  totalEntradas: number = 0;
  totalSaidas: number = 0;
  saldo: number = 0;

  // Mensagem de feedback
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  // Modal de confirmação
  confirm = {
    visible: false,
    title: '',
    message: '',
    danger: false,
    callback: () => {}
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.carregarLancamentos();
  }

  carregarLancamentos(): void {
    // Mock data - substituir por chamada à API
    this.lancamentos = [
      { 
        id: 1, 
        data: '2026-02-20',
        tipoConta: 'entrada',
        formaPagamento: 'pix',
        tipoDespesa: 'N/A',
        descricao: 'Mensalidade Fevereiro - João Silva',
        fornecedor: 'N/A',
        valor: 450.00,
        usuario: 'Maria Costa'
      },
      { 
        id: 2, 
        data: '2026-02-21',
        tipoConta: 'saida',
        formaPagamento: 'debito',
        tipoDespesa: 'Material Escolar',
        descricao: 'Pagamento Material Escolar',
        fornecedor: 'Papelaria Central',
        valor: 850.50,
        usuario: 'João Santos'
      },
      { 
        id: 3, 
        data: '2026-02-22',
        tipoConta: 'entrada',
        formaPagamento: 'dinheiro',
        tipoDespesa: 'N/A',
        descricao: 'Mensalidade Fevereiro - Ana Paula',
        fornecedor: 'N/A',
        valor: 450.00,
        usuario: 'Maria Costa'
      },
      { 
        id: 4, 
        data: '2026-02-23',
        tipoConta: 'saida',
        formaPagamento: 'credito',
        tipoDespesa: 'Energia / Água / Telefone',
        descricao: 'Conta de Energia Elétrica',
        fornecedor: 'Cemig',
        valor: 1200.00,
        usuario: 'João Santos'
      }
    ];
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.lancamentosFiltrados = this.lancamentos.filter(lancamento => {
      const matchMes = !this.filtroMes || lancamento.data.substring(0, 7) === this.filtroMes;
      const matchData = !this.filtroData || lancamento.data === this.filtroData;
      const matchTipo = !this.filtroTipo || lancamento.tipoConta === this.filtroTipo;
      const matchFornecedor = !this.filtroFornecedor || 
        lancamento.fornecedor.toLowerCase().includes(this.filtroFornecedor.toLowerCase());
      const matchFormaPagamento = !this.filtroFormaPagamento || lancamento.formaPagamento === this.filtroFormaPagamento;
      const matchTipoDespesa = !this.filtroTipoDespesa || lancamento.tipoDespesa === this.filtroTipoDespesa;
      
      return matchMes && matchData && matchTipo && matchFornecedor && matchFormaPagamento && matchTipoDespesa;
    });
    
    this.calcularTotais();
  }

  calcularTotais(): void {
    this.totalEntradas = this.lancamentosFiltrados
      .filter(l => l.tipoConta === 'entrada')
      .reduce((acc, l) => acc + l.valor, 0);
      
    this.totalSaidas = this.lancamentosFiltrados
      .filter(l => l.tipoConta === 'saida')
      .reduce((acc, l) => acc + l.valor, 0);
      
    this.saldo = this.totalEntradas - this.totalSaidas;
  }

  limparFiltros(): void {
    this.filtroMes = '';
    this.filtroData = '';
    this.filtroTipo = '';
    this.filtroFornecedor = '';
    this.filtroFormaPagamento = '';
    this.filtroTipoDespesa = '';
    this.aplicarFiltros();
  }

  novo(): void {
    this.router.navigate(['/caixa/novo']);
  }

  editar(lancamento: Lancamento): void {
    this.router.navigate([`/caixa/${lancamento.id}/editar`]);
  }

  excluir(lancamento: Lancamento): void {
    const tipo = lancamento.tipoConta === 'entrada' ? 'entrada' : 'saída';
    this.openConfirm(
      'Excluir lançamento',
      `Tem certeza que deseja excluir o lançamento de ${tipo} "${lancamento.descricao}"? Esta ação não pode ser desfeita.`,
      true,
      () => {
        this.lancamentos = this.lancamentos.filter(l => l.id !== lancamento.id);
        this.aplicarFiltros();
        this.showMessage(`Lançamento "${lancamento.descricao}" excluído com sucesso.`, 'success');
      }
    );
  }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
  }

  openConfirm(title: string, message: string, danger: boolean, callback: () => void): void {
    this.confirm = { visible: true, title, message, danger, callback };
  }

  confirmAction(): void { this.confirm.visible = false; this.confirm.callback(); }
  cancelConfirm(): void  { this.confirm.visible = false; }

  getTipoLabel(tipo: string): string {
    return tipo === 'entrada' ? 'Entrada' : 'Saída';
  }

  getFormaPagamentoLabel(forma: string): string {
    const labels: Record<string, string> = {
      dinheiro: 'Dinheiro',
      pix: 'Pix',
      credito: 'Crédito',
      debito: 'Débito'
    };
    return labels[forma] ?? forma;
  }
}
