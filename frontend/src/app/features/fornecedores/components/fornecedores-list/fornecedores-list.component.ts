import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FornecedoresService, Fornecedor } from '../../services/fornecedores.service';

@Component({
  selector: 'app-fornecedores-list',
  templateUrl: './fornecedores-list.component.html',
  styleUrls: ['./fornecedores-list.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class FornecedoresListComponent implements OnInit {
  fornecedores: Fornecedor[] = [];
  fornecedoresFiltrados: Fornecedor[] = [];

  filtroTipo = '';
  filtroNome = '';
  filtroStatus = '';
  filtroCentroCusto = '';

  selecionados: Set<number> = new Set();
  bulkAction = '';

  paginaAtual = 1;
  itensPorPagina = 10;
  readonly Math = Math;

  message = '';
  messageType: 'success' | 'error' = 'success';
  isLoading = false;

  confirm = { visible: false, title: '', message: '', danger: false, callback: () => {} };

  get totalPaginas(): number {
    return Math.ceil(this.fornecedoresFiltrados.length / this.itensPorPagina);
  }

  get fornecedoresPaginados(): Fornecedor[] {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    return this.fornecedoresFiltrados.slice(inicio, inicio + this.itensPorPagina);
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

  get filtrosAtivos(): number {
    return (this.filtroTipo ? 1 : 0) + (this.filtroNome ? 1 : 0) +
           (this.filtroStatus ? 1 : 0) + (this.filtroCentroCusto ? 1 : 0);
  }

  // Cards de resumo
  get qtdAtivos(): number {
    return this.fornecedores.filter(f => f.ativo).length;
  }

  get gastoMensalTotal(): number {
    return this.fornecedores.filter(f => f.ativo).reduce((a, f) => a + f.valorMensalMedio, 0);
  }

  get qtdContratosTotais(): number {
    return this.fornecedores.reduce((a, f) => a + f.qtdContratos, 0);
  }

  get ultimoPagamentoGeral(): string {
    const datas = this.fornecedores
      .filter(f => f.ultimoPagamento)
      .map(f => f.ultimoPagamento as string)
      .sort((a, b) => b.localeCompare(a));
    return datas.length ? datas[0] : '';
  }

  get scoreGeral(): number {
    const ativos = this.fornecedores.filter(f => f.ativo);
    if (!ativos.length) return 0;
    const total = ativos.reduce((a, f) => a + (f.scoreEntrega + f.scorePontualidade + f.scoreQualidade) / 3, 0);
    return Math.round((total / ativos.length) * 10) / 10;
  }

  constructor(private router: Router, private fornecedoresService: FornecedoresService) {}

  ngOnInit(): void {
    this.carregarFornecedores();
  }

  carregarFornecedores(): void {
    this.isLoading = true;
    this.fornecedoresService.listar().subscribe({
      next: (dados) => {
        this.fornecedores = dados;
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: () => {
        this.showMessage('Erro ao carregar fornecedores.', 'error');
        this.isLoading = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.paginaAtual = 1;
    this.fornecedoresFiltrados = this.fornecedores.filter(f => {
      const matchTipo   = !this.filtroTipo || f.tipo === this.filtroTipo;
      const matchNome   = !this.filtroNome ||
        f.nome.toLowerCase().includes(this.filtroNome.toLowerCase()) ||
        (f.razaoSocial && f.razaoSocial.toLowerCase().includes(this.filtroNome.toLowerCase()));
      const matchStatus = !this.filtroStatus ||
        (this.filtroStatus === 'ativo' && f.ativo) ||
        (this.filtroStatus === 'inativo' && !f.ativo);
      const matchCC     = !this.filtroCentroCusto || f.centroCusto === this.filtroCentroCusto;
      return matchTipo && matchNome && matchStatus && matchCC;
    });
  }

  limparFiltros(): void {
    this.filtroTipo = '';
    this.filtroNome = '';
    this.filtroStatus = '';
    this.filtroCentroCusto = '';
    this.aplicarFiltros();
  }

  toggleSelecao(id: number): void {
    if (this.selecionados.has(id)) this.selecionados.delete(id);
    else this.selecionados.add(id);
  }

  toggleTodos(event: any): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.fornecedoresFiltrados.forEach(f => this.selecionados.add(f.id));
    else this.selecionados.clear();
  }

  get quantidadeSelecionados(): number { return this.selecionados.size; }
  get todosSelecionados(): boolean {
    return this.fornecedoresFiltrados.length > 0 && this.fornecedoresFiltrados.every(f => this.selecionados.has(f.id));
  }

  limparSelecao(): void { this.selecionados.clear(); }

  private _ativarSelecionados(): void {
    const ids = Array.from(this.selecionados);
    const n = ids.length;
    this.fornecedoresService.alterarStatusLote(ids, true).subscribe({
      next: () => {
        this.selecionados.clear(); this.bulkAction = '';
        this.carregarFornecedores();
        this.showMessage(`${n} fornecedor(es) ativado(s).`, 'success');
      },
      error: () => this.showMessage('Erro ao ativar fornecedores.', 'error')
    });
  }

  private _desativarSelecionados(): void {
    const ids = Array.from(this.selecionados);
    const n = ids.length;
    this.fornecedoresService.alterarStatusLote(ids, false).subscribe({
      next: () => {
        this.selecionados.clear(); this.bulkAction = '';
        this.carregarFornecedores();
        this.showMessage(`${n} fornecedor(es) desativado(s).`, 'success');
      },
      error: () => this.showMessage('Erro ao desativar fornecedores.', 'error')
    });
  }

  private _excluirSelecionados(): void {
    const ids = Array.from(this.selecionados);
    const n = ids.length;
    this.fornecedoresService.excluirLote(ids).subscribe({
      next: () => {
        this.selecionados.clear(); this.bulkAction = '';
        this.carregarFornecedores();
        this.showMessage(`${n} fornecedor(es) excluído(s).`, 'success');
      },
      error: () => this.showMessage('Erro ao excluir fornecedores.', 'error')
    });
  }

  novo(): void { this.router.navigate(['/fornecedores/novo']); }
  editar(id: number): void { this.router.navigate([`/fornecedores/${id}/editar`]); }

  excluir(f: Fornecedor): void {
    this.openConfirm('Excluir fornecedor', `Excluir "${f.nome}"? Esta ação não pode ser desfeita.`, true, () => {
      this.fornecedoresService.excluir(f.id).subscribe({
        next: () => {
          this.carregarFornecedores();
          this.showMessage(`Fornecedor "${f.nome}" excluído.`, 'success');
        },
        error: () => this.showMessage('Erro ao excluir fornecedor.', 'error')
      });
    });
  }

  toggleAtivo(f: Fornecedor): void {
    const acao = f.ativo ? 'desativar' : 'ativar';
    this.openConfirm(`${acao.charAt(0).toUpperCase() + acao.slice(1)} fornecedor`,
      `Tem certeza que deseja ${acao} "${f.nome}"?`, acao === 'desativar', () => {
        this.fornecedoresService.alterarStatus(f.id, !f.ativo).subscribe({
          next: () => {
            this.carregarFornecedores();
            this.showMessage(`Fornecedor "${f.nome}" ${!f.ativo ? 'ativado' : 'desativado'}.`, 'success');
          },
          error: () => this.showMessage('Erro ao alterar status.', 'error')
        });
      });
  }

  performBulkAction(): void {
    if (!this.bulkAction || !this.quantidadeSelecionados) return;
    const n = this.quantidadeSelecionados;
    const label = this.bulkAction === 'excluir' ? 'excluir' : this.bulkAction === 'ativar' ? 'ativar' : 'desativar';
    const snap = this.bulkAction;
    this.openConfirm('Ação em lote', `${label} ${n} fornecedor(es)?`, this.bulkAction !== 'ativar', () => {
      if (snap === 'ativar')    this._ativarSelecionados();
      if (snap === 'desativar') this._desativarSelecionados();
      if (snap === 'excluir')   this._excluirSelecionados();
    });
  }

  getScoreGeral(f: Fornecedor): number {
    return Math.round(((f.scoreEntrega + f.scorePontualidade + f.scoreQualidade) / 3) * 10) / 10;
  }

  getScoreClass(score: number): string {
    if (score >= 9) return 'score-excelente';
    if (score >= 7.5) return 'score-bom';
    if (score >= 6) return 'score-regular';
    return 'score-ruim';
  }

  irParaPagina(p: number): void { if (p >= 1 && p <= this.totalPaginas) this.paginaAtual = p; }
  onItensPorPaginaChange(): void { this.paginaAtual = 1; }
  trackByIndex(i: number): number { return i; }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg; this.messageType = type;
    setTimeout(() => { this.message = ''; }, 4000);
  }

  openConfirm(title: string, message: string, danger: boolean, callback: () => void): void {
    this.confirm = { visible: true, title, message, danger, callback };
  }

  confirmAction(): void { this.confirm.visible = false; this.confirm.callback(); }
  cancelConfirm(): void  { this.confirm.visible = false; }
}
