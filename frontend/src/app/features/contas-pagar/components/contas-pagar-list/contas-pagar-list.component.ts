import { Component, OnInit } from '@angular/core';

interface ContaPagar {
  id: number;
  descricao: string;
  fornecedor: string;
  centroCusto: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'pago' | 'vencido' | 'parcial';
  formaPagamento?: string;
  recorrente: boolean;
  periodicidade?: 'mensal' | 'trimestral' | 'anual' | 'unico';
  observacoes?: string;
}

@Component({
  selector: 'app-contas-pagar-list',
  templateUrl: './contas-pagar-list.component.html',
  styleUrls: ['./contas-pagar-list.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class ContasPagarListComponent implements OnInit {
  contas: ContaPagar[] = [];
  contasFiltradas: ContaPagar[] = [];

  filtroStatus = '';
  filtroCentroCusto = '';
  filtroFornecedor = '';
  filtroMesVencimento = '';

  message = '';
  messageType: 'success' | 'error' = 'success';

  confirm = { visible: false, title: '', message: '', danger: false, callback: () => {} };

  paginaAtual = 1;
  itensPorPagina = 10;
  readonly Math = Math;

  get totalPaginas(): number {
    return Math.ceil(this.contasFiltradas.length / this.itensPorPagina);
  }

  get contasPaginadas(): ContaPagar[] {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    return this.contasFiltradas.slice(inicio, inicio + this.itensPorPagina);
  }

  get paginasVisiveis(): number[] {
    const total = this.totalPaginas;
    const atual = this.paginaAtual;
    const range: number[] = [];
    for (let i = Math.max(2, atual - 2); i <= Math.min(total - 1, atual + 2); i++) range.push(i);
    if (atual - 2 > 2) range.unshift(-1);
    if (atual + 2 < total - 1) range.push(-1);
    range.unshift(1);
    if (total > 1) range.push(total);
    return range;
  }

  get filtrosAtivos(): number {
    return (this.filtroStatus ? 1 : 0) + (this.filtroCentroCusto ? 1 : 0) +
           (this.filtroFornecedor ? 1 : 0) + (this.filtroMesVencimento ? 1 : 0);
  }

  get totalPendente(): number {
    return this.contas.filter(c => c.status === 'pendente').reduce((a, c) => a + c.valor, 0);
  }

  get totalVencido(): number {
    return this.contas.filter(c => c.status === 'vencido').reduce((a, c) => a + c.valor, 0);
  }

  get totalPago(): number {
    return this.contas.filter(c => c.status === 'pago').reduce((a, c) => a + c.valor, 0);
  }

  get qtdPendentes(): number {
    return this.contas.filter(c => c.status === 'pendente').length;
  }

  get qtdVencidas(): number {
    return this.contas.filter(c => c.status === 'vencido').length;
  }

  get qtdPagas(): number {
    return this.contas.filter(c => c.status === 'pago').length;
  }

  get qtdVencendoBreve(): number {
    const hoje = new Date();
    const em7dias = new Date();
    em7dias.setDate(em7dias.getDate() + 7);
    return this.contas.filter(c => {
      const venc = new Date(c.dataVencimento + 'T00:00:00');
      return c.status === 'pendente' && venc >= hoje && venc <= em7dias;
    }).length;
  }

  ngOnInit(): void {
    this.carregarContas();
  }

  carregarContas(): void {
    this.contas = [
      {
        id: 1,
        descricao: 'Conta de Energia Elétrica',
        fornecedor: 'CEMIG',
        centroCusto: 'Infraestrutura',
        valor: 1250.00,
        dataVencimento: '2026-05-30',
        status: 'pendente',
        recorrente: true,
        periodicidade: 'mensal'
      },
      {
        id: 2,
        descricao: 'Serviço de Internet Fibra',
        fornecedor: 'Vivo Fibra',
        centroCusto: 'Tecnologia',
        valor: 399.90,
        dataVencimento: '2026-05-25',
        status: 'pendente',
        recorrente: true,
        periodicidade: 'mensal'
      },
      {
        id: 3,
        descricao: 'Material de Limpeza - Maio',
        fornecedor: 'CleanMax Ltda',
        centroCusto: 'Administrativo',
        valor: 580.00,
        dataVencimento: '2026-05-10',
        status: 'vencido',
        recorrente: false
      },
      {
        id: 4,
        descricao: 'Merenda Escolar - Abril',
        fornecedor: 'Alimentos BH Ltda',
        centroCusto: 'Alimentação',
        valor: 4200.00,
        dataVencimento: '2026-04-30',
        dataPagamento: '2026-04-28',
        status: 'pago',
        formaPagamento: 'pix',
        recorrente: true,
        periodicidade: 'mensal'
      },
      {
        id: 5,
        descricao: 'Licença Software Educacional',
        fornecedor: 'SoftEdu Tech',
        centroCusto: 'Tecnologia',
        valor: 890.00,
        dataVencimento: '2026-06-15',
        status: 'pendente',
        recorrente: true,
        periodicidade: 'anual'
      },
      {
        id: 6,
        descricao: 'Manutenção Ar-Condicionado',
        fornecedor: 'João Carlos Silva',
        centroCusto: 'Infraestrutura',
        valor: 750.00,
        dataVencimento: '2026-05-20',
        dataPagamento: '2026-05-19',
        status: 'pago',
        formaPagamento: 'dinheiro',
        recorrente: false
      },
      {
        id: 7,
        descricao: 'Transporte Escolar - Maio',
        fornecedor: 'TransEdu Ltda',
        centroCusto: 'Transporte',
        valor: 3800.00,
        dataVencimento: '2026-05-28',
        status: 'pendente',
        recorrente: true,
        periodicidade: 'mensal'
      },
      {
        id: 8,
        descricao: 'Material Pedagógico - Trimestre',
        fornecedor: 'Papelaria Central',
        centroCusto: 'Pedagógico',
        valor: 1450.00,
        dataVencimento: '2026-05-22',
        status: 'vencido',
        recorrente: true,
        periodicidade: 'trimestral'
      }
    ];
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.paginaAtual = 1;
    this.contasFiltradas = this.contas.filter(c => {
      const matchStatus = !this.filtroStatus || c.status === this.filtroStatus;
      const matchCC     = !this.filtroCentroCusto || c.centroCusto === this.filtroCentroCusto;
      const matchForn   = !this.filtroFornecedor ||
        c.fornecedor.toLowerCase().includes(this.filtroFornecedor.toLowerCase()) ||
        c.descricao.toLowerCase().includes(this.filtroFornecedor.toLowerCase());
      const matchMes    = !this.filtroMesVencimento || c.dataVencimento.substring(0, 7) === this.filtroMesVencimento;
      return matchStatus && matchCC && matchForn && matchMes;
    });
  }

  limparFiltros(): void {
    this.filtroStatus = '';
    this.filtroCentroCusto = '';
    this.filtroFornecedor = '';
    this.filtroMesVencimento = '';
    this.aplicarFiltros();
  }

  registrarPagamento(conta: ContaPagar): void {
    this.openConfirm(
      'Registrar Pagamento',
      `Confirmar pagamento de R$ ${conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para "${conta.descricao}"?`,
      false,
      () => {
        conta.status = 'pago';
        conta.dataPagamento = new Date().toISOString().substring(0, 10);
        conta.formaPagamento = 'pix';
        this.aplicarFiltros();
        this.showMessage(`Pagamento de "${conta.descricao}" registrado com sucesso.`, 'success');
      }
    );
  }

  excluir(conta: ContaPagar): void {
    this.openConfirm(
      'Excluir conta',
      `Tem certeza que deseja excluir a conta "${conta.descricao}"? Esta ação não pode ser desfeita.`,
      true,
      () => {
        this.contas = this.contas.filter(c => c.id !== conta.id);
        this.aplicarFiltros();
        this.showMessage(`Conta "${conta.descricao}" excluída com sucesso.`, 'success');
      }
    );
  }

  irParaPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) this.paginaAtual = p;
  }

  onItensPorPaginaChange(): void { this.paginaAtual = 1; }

  trackByIndex(i: number): number { return i; }

  isVencendo(conta: ContaPagar): boolean {
    if (conta.status !== 'pendente') return false;
    const hoje = new Date();
    const em7 = new Date();
    em7.setDate(em7.getDate() + 7);
    const venc = new Date(conta.dataVencimento + 'T00:00:00');
    return venc >= hoje && venc <= em7;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pendente: 'Pendente', pago: 'Pago', vencido: 'Vencido', parcial: 'Parcial'
    };
    return labels[status] ?? status;
  }

  getFormaPagamentoLabel(forma?: string): string {
    if (!forma) return '-';
    const labels: Record<string, string> = {
      dinheiro: 'Dinheiro', pix: 'Pix', credito: 'Crédito', debito: 'Débito', boleto: 'Boleto'
    };
    return labels[forma] ?? forma;
  }

  getPeriodicidadeLabel(p?: string): string {
    if (!p) return '-';
    const labels: Record<string, string> = {
      mensal: 'Mensal', trimestral: 'Trimestral', anual: 'Anual', unico: 'Único'
    };
    return labels[p] ?? p;
  }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => { this.message = ''; }, 4000);
  }

  openConfirm(title: string, message: string, danger: boolean, callback: () => void): void {
    this.confirm = { visible: true, title, message, danger, callback };
  }

  confirmAction(): void { this.confirm.visible = false; this.confirm.callback(); }
  cancelConfirm(): void  { this.confirm.visible = false; }
}
