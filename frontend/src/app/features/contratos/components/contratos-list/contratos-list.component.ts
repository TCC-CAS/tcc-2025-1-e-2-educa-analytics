import { Component, OnInit } from '@angular/core';

interface Contrato {
  id: number;
  fornecedor: string;
  descricao: string;
  centroCusto: string;
  valorMensal: number;
  dataInicio: string;
  dataFim: string;
  status: 'ativo' | 'vencendo' | 'expirado' | 'suspenso';
  renovacaoAutomatica: boolean;
  periodicidade: 'mensal' | 'trimestral' | 'anual';
  observacoes?: string;
  diasParaVencer?: number;
}

@Component({
  selector: 'app-contratos-list',
  templateUrl: './contratos-list.component.html',
  styleUrls: ['./contratos-list.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class ContratosListComponent implements OnInit {
  contratos: Contrato[] = [];
  contratosFiltrados: Contrato[] = [];

  filtroStatus = '';
  filtroCentroCusto = '';
  filtroFornecedor = '';

  message = '';
  messageType: 'success' | 'error' = 'success';

  confirm = { visible: false, title: '', message: '', danger: false, callback: () => {} };

  paginaAtual = 1;
  itensPorPagina = 10;
  readonly Math = Math;

  get totalPaginas(): number {
    return Math.ceil(this.contratosFiltrados.length / this.itensPorPagina);
  }

  get contratosPaginados(): Contrato[] {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    return this.contratosFiltrados.slice(inicio, inicio + this.itensPorPagina);
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
    return (this.filtroStatus ? 1 : 0) + (this.filtroCentroCusto ? 1 : 0) + (this.filtroFornecedor ? 1 : 0);
  }

  get totalValorMensal(): number {
    return this.contratos.filter(c => c.status === 'ativo' || c.status === 'vencendo')
      .reduce((a, c) => a + c.valorMensal, 0);
  }

  get qtdAtivos(): number { return this.contratos.filter(c => c.status === 'ativo').length; }
  get qtdVencendo(): number { return this.contratos.filter(c => c.status === 'vencendo').length; }
  get qtdExpirados(): number { return this.contratos.filter(c => c.status === 'expirado').length; }

  ngOnInit(): void {
    this.carregarContratos();
  }

  carregarContratos(): void {
    const hoje = new Date();

    const calcDias = (dataFim: string): number => {
      const fim = new Date(dataFim + 'T00:00:00');
      return Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    };

    const calcStatus = (dataFim: string, suspenso = false): 'ativo' | 'vencendo' | 'expirado' | 'suspenso' => {
      if (suspenso) return 'suspenso';
      const dias = calcDias(dataFim);
      if (dias < 0) return 'expirado';
      if (dias <= 30) return 'vencendo';
      return 'ativo';
    };

    this.contratos = [
      {
        id: 1,
        fornecedor: 'CEMIG Distribuição S.A.',
        descricao: 'Fornecimento de Energia Elétrica',
        centroCusto: 'Infraestrutura',
        valorMensal: 1250.00,
        dataInicio: '2025-01-01',
        dataFim: '2026-12-31',
        status: calcStatus('2026-12-31'),
        diasParaVencer: calcDias('2026-12-31'),
        renovacaoAutomatica: true,
        periodicidade: 'mensal'
      },
      {
        id: 2,
        fornecedor: 'Vivo Fibra',
        descricao: 'Serviço de Internet 500MB',
        centroCusto: 'Tecnologia',
        valorMensal: 399.90,
        dataInicio: '2025-03-01',
        dataFim: '2026-06-15',
        status: calcStatus('2026-06-15'),
        diasParaVencer: calcDias('2026-06-15'),
        renovacaoAutomatica: false,
        periodicidade: 'anual'
      },
      {
        id: 3,
        fornecedor: 'TransEdu Ltda',
        descricao: 'Transporte Escolar - Linha Norte',
        centroCusto: 'Transporte',
        valorMensal: 3800.00,
        dataInicio: '2026-01-01',
        dataFim: '2026-12-31',
        status: calcStatus('2026-12-31'),
        diasParaVencer: calcDias('2026-12-31'),
        renovacaoAutomatica: true,
        periodicidade: 'mensal'
      },
      {
        id: 4,
        fornecedor: 'CleanPro Serviços',
        descricao: 'Limpeza e Higienização',
        centroCusto: 'Administrativo',
        valorMensal: 2200.00,
        dataInicio: '2025-06-01',
        dataFim: '2026-05-31',
        status: calcStatus('2026-05-31'),
        diasParaVencer: calcDias('2026-05-31'),
        renovacaoAutomatica: false,
        periodicidade: 'mensal',
        observacoes: 'Contrato com renovação pendente de análise'
      },
      {
        id: 5,
        fornecedor: 'SoftEdu Tech',
        descricao: 'Licença Sistema de Gestão Educacional',
        centroCusto: 'Tecnologia',
        valorMensal: 890.00,
        dataInicio: '2025-06-01',
        dataFim: '2026-06-01',
        status: calcStatus('2026-06-01'),
        diasParaVencer: calcDias('2026-06-01'),
        renovacaoAutomatica: true,
        periodicidade: 'anual'
      },
      {
        id: 6,
        fornecedor: 'Alimentos BH Ltda',
        descricao: 'Fornecimento de Merenda Escolar',
        centroCusto: 'Alimentação',
        valorMensal: 4200.00,
        dataInicio: '2026-01-01',
        dataFim: '2026-12-31',
        status: calcStatus('2026-12-31'),
        diasParaVencer: calcDias('2026-12-31'),
        renovacaoAutomatica: true,
        periodicidade: 'mensal'
      },
      {
        id: 7,
        fornecedor: 'SecureGuard Vigilância',
        descricao: 'Serviço de Segurança e Monitoramento',
        centroCusto: 'Infraestrutura',
        valorMensal: 1800.00,
        dataInicio: '2024-05-01',
        dataFim: '2025-04-30',
        status: 'expirado',
        diasParaVencer: -30,
        renovacaoAutomatica: false,
        periodicidade: 'anual',
        observacoes: 'Contrato expirado - aguardando renovação'
      }
    ];

    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.paginaAtual = 1;
    this.contratosFiltrados = this.contratos.filter(c => {
      const matchStatus = !this.filtroStatus || c.status === this.filtroStatus;
      const matchCC     = !this.filtroCentroCusto || c.centroCusto === this.filtroCentroCusto;
      const matchForn   = !this.filtroFornecedor ||
        c.fornecedor.toLowerCase().includes(this.filtroFornecedor.toLowerCase()) ||
        c.descricao.toLowerCase().includes(this.filtroFornecedor.toLowerCase());
      return matchStatus && matchCC && matchForn;
    });
  }

  limparFiltros(): void {
    this.filtroStatus = '';
    this.filtroCentroCusto = '';
    this.filtroFornecedor = '';
    this.aplicarFiltros();
  }

  renovar(contrato: Contrato): void {
    this.openConfirm(
      'Renovar Contrato',
      `Confirmar renovação do contrato "${contrato.descricao}" com ${contrato.fornecedor}?`,
      false,
      () => {
        const inicio = new Date(contrato.dataFim + 'T00:00:00');
        inicio.setDate(inicio.getDate() + 1);
        const fim = new Date(inicio);
        fim.setFullYear(fim.getFullYear() + 1);
        contrato.dataInicio = inicio.toISOString().substring(0, 10);
        contrato.dataFim = fim.toISOString().substring(0, 10);
        contrato.status = 'ativo';
        contrato.diasParaVencer = 365;
        this.aplicarFiltros();
        this.showMessage(`Contrato "${contrato.descricao}" renovado com sucesso.`, 'success');
      }
    );
  }

  excluir(contrato: Contrato): void {
    this.openConfirm(
      'Excluir Contrato',
      `Tem certeza que deseja excluir o contrato "${contrato.descricao}"? Esta ação não pode ser desfeita.`,
      true,
      () => {
        this.contratos = this.contratos.filter(c => c.id !== contrato.id);
        this.aplicarFiltros();
        this.showMessage(`Contrato "${contrato.descricao}" excluído com sucesso.`, 'success');
      }
    );
  }

  irParaPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) this.paginaAtual = p;
  }

  onItensPorPaginaChange(): void { this.paginaAtual = 1; }

  trackByIndex(i: number): number { return i; }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ativo: 'Ativo', vencendo: 'Vence em breve', expirado: 'Expirado', suspenso: 'Suspenso'
    };
    return labels[status] ?? status;
  }

  getPeriodicidadeLabel(p: string): string {
    const labels: Record<string, string> = { mensal: 'Mensal', trimestral: 'Trimestral', anual: 'Anual' };
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
