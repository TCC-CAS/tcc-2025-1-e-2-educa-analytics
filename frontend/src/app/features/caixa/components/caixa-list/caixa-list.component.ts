import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Lancamento {
  id: number;
  data: string;
  tipoConta: 'credito' | 'debito';
  descricao: string;
  fornecedor: string;
  valor: number;
  usuario: string;
}

@Component({
  selector: 'app-caixa-list',
  templateUrl: './caixa-list.component.html',
  styleUrls: ['./caixa-list.component.scss']
})
export class CaixaListComponent implements OnInit {
  lancamentos: Lancamento[] = [];
  lancamentosFiltrados: Lancamento[] = [];
  
  // Filtros
  filtroData: string = '';
  filtroTipo: string = '';
  filtroFornecedor: string = '';
  
  // Totalizadores
  totalCreditos: number = 0;
  totalDebitos: number = 0;
  saldo: number = 0;

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
        tipoConta: 'credito',
        descricao: 'Mensalidade Fevereiro - João Silva',
        fornecedor: 'N/A',
        valor: 450.00,
        usuario: 'Maria Costa'
      },
      { 
        id: 2, 
        data: '2026-02-21',
        tipoConta: 'debito',
        descricao: 'Pagamento Material Escolar',
        fornecedor: 'Papelaria Central',
        valor: 850.50,
        usuario: 'João Santos'
      },
      { 
        id: 3, 
        data: '2026-02-22',
        tipoConta: 'credito',
        descricao: 'Mensalidade Fevereiro - Ana Paula',
        fornecedor: 'N/A',
        valor: 450.00,
        usuario: 'Maria Costa'
      },
      { 
        id: 4, 
        data: '2026-02-23',
        tipoConta: 'debito',
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
      const matchData = !this.filtroData || lancamento.data === this.filtroData;
      const matchTipo = !this.filtroTipo || lancamento.tipoConta === this.filtroTipo;
      const matchFornecedor = !this.filtroFornecedor || 
        lancamento.fornecedor.toLowerCase().includes(this.filtroFornecedor.toLowerCase());
      
      return matchData && matchTipo && matchFornecedor;
    });
    
    this.calcularTotais();
  }

  calcularTotais(): void {
    this.totalCreditos = this.lancamentosFiltrados
      .filter(l => l.tipoConta === 'credito')
      .reduce((acc, l) => acc + l.valor, 0);
      
    this.totalDebitos = this.lancamentosFiltrados
      .filter(l => l.tipoConta === 'debito')
      .reduce((acc, l) => acc + l.valor, 0);
      
    this.saldo = this.totalCreditos - this.totalDebitos;
  }

  limparFiltros(): void {
    this.filtroData = '';
    this.filtroTipo = '';
    this.filtroFornecedor = '';
    this.aplicarFiltros();
  }

  novo(): void {
    this.router.navigate(['/caixa/novo']);
  }

  editar(id: number): void {
    this.router.navigate([`/caixa/${id}/editar`]);
  }

  excluir(lancamento: Lancamento): void {
    const tipo = lancamento.tipoConta === 'credito' ? 'crédito' : 'débito';
    if (confirm(`Tem certeza que deseja excluir o lançamento de ${tipo} "${lancamento.descricao}"?`)) {
      // Implementar chamada à API
      this.lancamentos = this.lancamentos.filter(l => l.id !== lancamento.id);
      this.aplicarFiltros();
    }
  }

  getTipoLabel(tipo: string): string {
    return tipo === 'credito' ? 'Crédito' : 'Débito';
  }
}
