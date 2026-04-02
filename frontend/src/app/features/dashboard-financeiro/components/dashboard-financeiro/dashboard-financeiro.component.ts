import { Component, OnInit } from '@angular/core';

interface KpiCard {
  titulo: string;
  valor: number;
  formato: 'moeda' | 'percentual' | 'numero';
  cor: 'verde' | 'azul' | 'amarelo' | 'vermelho';
  icone: string;
}

interface MovimentacaoMensal {
  mes: string;
  receita: number;
  despesa: number;
}

@Component({
  selector: 'app-dashboard-financeiro',
  templateUrl: './dashboard-financeiro.component.html',
  styleUrls: ['./dashboard-financeiro.component.scss']
})
export class DashboardFinanceiroComponent implements OnInit {
  periodo: string = 'mes'; // 'mes' ou 'ano'
  mesAtual: string = 'Fevereiro/2026';

  // KPIs
  kpis: KpiCard[] = [
    {
      titulo: 'Receita Total',
      valor: 125450.00,
      formato: 'moeda',
      cor: 'verde',
      icone: '📈'
    },
    {
      titulo: 'Despesa Total',
      valor: 87230.50,
      formato: 'moeda',
      cor: 'vermelho',
      icone: '📉'
    },
    {
      titulo: 'Saldo Atual',
      valor: 38219.50,
      formato: 'moeda',
      cor: 'azul',
      icone: '💰'
    },
    {
      titulo: 'Taxa de Inadimplência',
      valor: 5.2,
      formato: 'percentual',
      cor: 'amarelo',
      icone: '⚠️'
    }
  ];

  // Dados gráfico de movimentação mensal
  movimentacoes: MovimentacaoMensal[] = [];

  // Dados de receitas por categoria
  receitasPorCategoria: any[] = [];

  // Dados de despesas por categoria
  despesasPorCategoria: any[] = [];

  // Lista de últimas transações
  ultimasTransacoes: any[] = [];

  constructor() {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregarMovimentacoes();
    this.carregarCategorias();
    this.carregarTransacoes();
  }

  carregarMovimentacoes(): void {
    // Mock data para os últimos 6 meses
    this.movimentacoes = [
      { mes: 'Ago', receita: 110000, despesa: 82000 },
      { mes: 'Set', receita: 115000, despesa: 85000 },
      { mes: 'Out', receita: 120000, despesa: 88000 },
      { mes: 'Nov', receita: 122000, despesa: 86000 },
      { mes: 'Dez', receita: 130000, despesa: 92000 },
      { mes: 'Jan', receita: 118000, despesa: 84000 },
      { mes: 'Fev', receita: 125450, despesa: 87230 }
    ];
  }

  carregarCategorias(): void {
    // Receitas por categoria
    this.receitasPorCategoria = [
      { categoria: 'Mensalidades', percentual: 85, valor: 106632.50 },
      { categoria: 'Projetos Especiais', percentual: 10, valor: 12545.00 },
      { categoria: 'Doações', percentual: 5, valor: 6272.50 }
    ];

    // Despesas por categoria
    this.despesasPorCategoria = [
      { categoria: 'Folha de Pagamento', percentual: 60, valor: 52338.30 },
      { categoria: 'Manutenção', percentual: 15, valor: 13084.58 },
      { categoria: 'Utilidades', percentual: 15, valor: 13084.58 },
      { categoria: 'Material Didático', percentual: 10, valor: 8723.05 }
    ];
  }

  carregarTransacoes(): void {
    this.ultimasTransacoes = [
      {
        data: '25/02/2026',
        descricao: 'Pagamento - Folha de Pessoal',
        tipo: 'debito',
        valor: 45000.00
      },
      {
        data: '24/02/2026',
        descricao: 'Recebimento - Mensalidades Fevereiro',
        tipo: 'credito',
        valor: 85450.00
      },
      {
        data: '23/02/2026',
        descricao: 'Pagamento - Fornecedor Alimentos',
        tipo: 'debito',
        valor: 8230.50
      },
      {
        data: '22/02/2026',
        descricao: 'Recebimento - Projeto Especial',
        tipo: 'credito',
        valor: 12000.00
      },
      {
        data: '20/02/2026',
        descricao: 'Pagamento - Conta de Energia',
        tipo: 'debito',
        valor: 3500.00
      }
    ];
  }

  mudarPeriodo(novoPeriodo: string): void {
    this.periodo = novoPeriodo;
    // Recarregar dados para o período selecionado
    this.carregarDados();
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  formatarPercentual(valor: number): string {
    return valor.toFixed(2).replace('.', ',') + '%';
  }

  exportarPDF(): void {
    console.log('Exportando relatório em PDF...');
    alert('Relatório PDF será gerado e baixado');
  }

  exportarExcel(): void {
    console.log('Exportando dados em Excel...');
    alert('Dados serão exportados para Excel');
  }
}
