import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CaixaService } from '../../services/caixa.service';

interface Lancamento {
  id: number;
  data: string;
  tipoConta: string;
  formaPagamento: string;
  centroCusto: string;
  descricao: string;
  fornecedor: string;
  valor: number;
  usuario: string;
  tipoRecebimento?: string;
  idEducando?: string;
  nomeEducando?: string;
  selected?: boolean;
}

interface FluxoProjetado {
  descricao: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  previsaoData: string;
  centroCusto: string;
}

@Component({
  selector: 'app-caixa-list',
  templateUrl: './caixa-list.component.html',
  styleUrls: ['./caixa-list.component.scss'],
  host: { style: 'display:flex;flex-direction:column;min-height:100%;overflow:visible;flex:1 0 auto;width:100%;box-sizing:border-box;' }
})
export class CaixaListComponent implements OnInit {
  lancamentos: Lancamento[] = [];
  lancamentosFiltrados: Lancamento[] = [];
  fluxoProjetado: FluxoProjetado[] = [];
  mostrarFluxo = false;

  filtroMes             = '';
  filtroData            = '';
  filtroTipo            = '';
  filtroFornecedor      = '';
  filtroFormaPagamento  = '';
  filtroCentroCusto     = '';
  filtroRecebimento     = '';
  filtroEducando        = '';

  totalEntradas = 0;
  totalSaidas   = 0;
  saldo         = 0;

  todosSelecionados = false;
  isLoading = false;

  message     = '';
  messageType: 'success' | 'error' = 'success';

  confirm = { visible: false, title: '', message: '', danger: false, callback: () => {} };

  paginaAtual    = 1;
  itensPorPagina = 10;
  readonly Math  = Math;

  get entradasProjetadas(): number {
    return this.fluxoProjetado.filter(f => f.tipo === 'entrada').reduce((a, f) => a + f.valor, 0);
  }

  get saidasProjetadas(): number {
    return this.fluxoProjetado.filter(f => f.tipo === 'saida').reduce((a, f) => a + f.valor, 0);
  }

  get saldoProjetado(): number {
    return this.saldo + this.entradasProjetadas - this.saidasProjetadas;
  }

  constructor(private router: Router, private caixaService: CaixaService) {}

  ngOnInit(): void {
    this.carregarLancamentos();
    this.carregarFluxoProjetado();
  }

  carregarFluxoProjetado(): void {
    this.caixaService.listarFluxoProjetado(30).subscribe({
      next: (dados) => {
        this.fluxoProjetado = dados.map(d => ({
          descricao:    d.descricao,
          tipo:         d.tipoConta as 'entrada' | 'saida',
          valor:        d.valor,
          previsaoData: d.data,
          centroCusto:  d.centroCusto || ''
        }));
      },
      error: () => {
        this.fluxoProjetado = [];
      }
    });
  }

  carregarLancamentos(): void {
    this.isLoading = true;
    this.caixaService.listar().subscribe({
      next: (dados) => {
        this.lancamentos = dados.map(l => ({
            id: l.id!,
            data: l.data,
            tipoConta: l.tipoConta,
            formaPagamento: l.formaPagamento,
            centroCusto: l.centroCusto,
            descricao: l.descricao,
            fornecedor: l.fornecedor,
            valor: l.valor,
            usuario: l.usuario,
            tipoRecebimento: l.tipoRecebimento || '',
            idEducando: l.idEducando || '',
            nomeEducando: l.nomeEducando || '',
            selected: false
          }));
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: () => {
        this.showMessage('Erro ao carregar lançamentos.', 'error');
        this.isLoading = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.paginaAtual = 1;
    this.lancamentosFiltrados = this.lancamentos.filter(l => {
      const matchMes           = !this.filtroMes           || l.data.substring(0, 7) === this.filtroMes;
      const matchData          = !this.filtroData          || l.data === this.filtroData;
      const matchTipo          = !this.filtroTipo          || l.tipoConta === this.filtroTipo;
      const matchFornecedor    = !this.filtroFornecedor    || l.fornecedor.toLowerCase().includes(this.filtroFornecedor.toLowerCase());
      const matchFormaPagamento = !this.filtroFormaPagamento || l.formaPagamento === this.filtroFormaPagamento;
      const matchCC            = !this.filtroCentroCusto   || l.centroCusto === this.filtroCentroCusto;
      const matchRecebimento   = !this.filtroRecebimento   || l.tipoRecebimento === this.filtroRecebimento;
      const matchEducando      = !this.filtroEducando      || (l.nomeEducando || '').toLowerCase().includes(this.filtroEducando.toLowerCase()) || (l.idEducando || '').toLowerCase().includes(this.filtroEducando.toLowerCase());
      return matchMes && matchData && matchTipo && matchFornecedor && matchFormaPagamento && matchCC && matchRecebimento && matchEducando;
    });
    this.calcularTotais();
  }

  calcularTotais(): void {
    this.totalEntradas = this.lancamentosFiltrados.filter(l => l.tipoConta === 'entrada').reduce((a, l) => a + l.valor, 0);
    this.totalSaidas   = this.lancamentosFiltrados.filter(l => l.tipoConta === 'saida').reduce((a, l) => a + l.valor, 0);
    this.saldo = this.totalEntradas - this.totalSaidas;
  }

  limparFiltros(): void {
    this.filtroMes            = '';
    this.filtroData           = '';
    this.filtroTipo           = '';
    this.filtroFornecedor     = '';
    this.filtroFormaPagamento = '';
    this.filtroCentroCusto    = '';
    this.filtroRecebimento    = '';
    this.filtroEducando       = '';
    this.aplicarFiltros();
  }

  get filtrosAtivos(): number {
    return (this.filtroMes ? 1 : 0) + (this.filtroData ? 1 : 0) + (this.filtroTipo ? 1 : 0) +
           (this.filtroFornecedor ? 1 : 0) + (this.filtroFormaPagamento ? 1 : 0) + (this.filtroCentroCusto ? 1 : 0) +
           (this.filtroRecebimento ? 1 : 0) + (this.filtroEducando ? 1 : 0);
  }

  get algumSelecionado(): boolean { return this.lancamentosFiltrados.some(l => l.selected); }
  get quantidadeSelecionados(): number { return this.lancamentosFiltrados.filter(l => l.selected).length; }

  toggleTodos(): void { this.lancamentosFiltrados.forEach(l => l.selected = this.todosSelecionados); }
  toggleLancamento(): void { this.todosSelecionados = this.lancamentosFiltrados.every(l => l.selected); }
  limparSelecao(): void { this.lancamentosFiltrados.forEach(l => l.selected = false); this.todosSelecionados = false; }

  get totalPaginas(): number { return Math.ceil(this.lancamentosFiltrados.length / this.itensPorPagina); }

  get lancamentosPaginados(): Lancamento[] {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    return this.lancamentosFiltrados.slice(inicio, inicio + this.itensPorPagina);
  }

  get paginasVisiveis(): number[] {
    const total = this.totalPaginas;
    const atual = this.paginaAtual;
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(2, atual - delta); i <= Math.min(total - 1, atual + delta); i++) range.push(i);
    if (atual - delta > 2) range.unshift(-1);
    if (atual + delta < total - 1) range.push(-1);
    range.unshift(1);
    if (total > 1) range.push(total);
    return range;
  }

  irParaPagina(pagina: number): void { if (pagina >= 1 && pagina <= this.totalPaginas) this.paginaAtual = pagina; }
  onItensPorPaginaChange(): void { this.paginaAtual = 1; }
  trackByIndex(i: number): number { return i; }

  novo(): void { this.router.navigate(['/caixa/novo']); }
  editar(lancamento: Lancamento): void { this.router.navigate([`/caixa/${lancamento.id}/editar`]); }

  excluir(lancamento: Lancamento): void {
    const tipo = lancamento.tipoConta === 'entrada' ? 'entrada' : 'saída';
    this.openConfirm('Excluir lançamento',
      `Excluir lançamento de ${tipo} "${lancamento.descricao}"? Esta ação não pode ser desfeita.`,
      true, () => {
        this.caixaService.excluir(lancamento.id!).subscribe({
          next: () => {
            this.carregarLancamentos();
            this.showMessage(`Lançamento "${lancamento.descricao}" excluído.`, 'success');
          },
          error: (err) => this.showMessage(err?.error?.error || 'Erro ao excluir.', 'error')
        });
      });
  }

  excluirSelecionados(): void {
    const n = this.quantidadeSelecionados;
    const ids = this.lancamentosFiltrados.filter(l => l.selected).map(l => l.id!);
    this.openConfirm('Excluir lançamentos', `Excluir ${n} lançamento(s)? Esta ação não pode ser desfeita.`, true, () => {
      this.caixaService.excluirLote(ids).subscribe({
        next: () => {
          this.carregarLancamentos();
          this.todosSelecionados = false;
          this.showMessage(`${n} lançamento(s) excluído(s).`, 'success');
        },
        error: (err) => this.showMessage(err?.error?.error || 'Erro ao excluir.', 'error')
      });
    });
  }

  openConfirm(title: string, message: string, danger: boolean, callback: () => void): void {
    this.confirm = { visible: true, title, message, danger, callback };
  }

  confirmAction(): void { this.confirm.visible = false; this.confirm.callback(); }
  cancelConfirm(): void  { this.confirm.visible = false; }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg; this.messageType = type;
    setTimeout(() => { this.message = ''; }, 4000);
  }

  get entradasFluxo(): FluxoProjetado[] { return this.fluxoProjetado.filter(f => f.tipo === 'entrada'); }
  get saidasFluxo(): FluxoProjetado[] { return this.fluxoProjetado.filter(f => f.tipo === 'saida'); }

  getTipoLabel(tipo: string): string { return tipo === 'entrada' ? 'Entrada' : 'Saída'; }

  getTipoRecebimentoLabel(tipo: string): string {
    const labels: Record<string, string> = { matricula: 'Matrícula', mensalidade: 'Mensalidade' };
    return labels[tipo] ?? '';
  }

  getFormaPagamentoLabel(forma: string): string {
    const labels: Record<string, string> = { dinheiro: 'Dinheiro', pix: 'Pix', credito: 'Crédito', debito: 'Débito' };
    return labels[forma] ?? forma;
  }
}
