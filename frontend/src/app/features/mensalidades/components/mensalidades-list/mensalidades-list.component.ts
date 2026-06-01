import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { CaixaService, Lancamento } from '../../../caixa/services/caixa.service';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';

export interface RecebimentoRow {
  // campos comuns
  idEducando: string;
  nomeEducando: string;
  tipoRecebimento: 'matricula' | 'mensalidade';
  anoLetivo: string;
  mesReferencia?: string;
  status: 'pago' | 'atrasado';
  // só preenchidos quando pago
  id?: number;
  data?: string;
  valor?: number;
  formaPagamento?: string;
  usuario?: string;
}

@Component({
  selector: 'app-mensalidades-list',
  templateUrl: './mensalidades-list.component.html',
  styleUrls: ['./mensalidades-list.component.scss'],
  host: { style: 'display:flex;flex-direction:column;min-height:100%;overflow:visible;flex:1 0 auto;width:100%;box-sizing:border-box;' }
})
export class MensalidadesListComponent implements OnInit {
  isLoading = false;
  todos: RecebimentoRow[] = [];
  filtrados: RecebimentoRow[] = [];
  paginados: RecebimentoRow[] = [];

  // Filtros
  filtroStatus      = '';   // 'pago' | 'atrasado' | ''
  filtroTipo        = '';   // 'matricula' | 'mensalidade' | ''
  filtroAno         = '';
  filtroMes         = '';
  filtroEducando    = '';
  filtroFormaPgto   = '';

  // Paginação
  paginaAtual    = 1;
  itensPorPagina = 15;
  readonly Math  = Math;

  // Resumo
  totalPago         = 0;
  totalAtrasado     = 0;
  totalMatriculas   = 0;
  totalMensalidades = 0;

  readonly anoAtual = new Date().getFullYear();
  readonly mesAtual = new Date().getMonth() + 1; // 1-12
  readonly anosLetivos = Array.from({ length: 5 }, (_, i) => String(this.anoAtual - 2 + i));

  readonly meses = [
    { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro'},{ value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro'},{ value: '12', label: 'Dezembro' },
  ];

  constructor(
    private caixaService: CaixaService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.filtroAno = String(this.anoAtual);
    this.carregarDados();
  }

  carregarDados(): void {
    this.isLoading = true;
    const anoStr = String(this.anoAtual);

    forkJoin({
      matriculas: this.http.get<any[]>(`${environment.apiUrl}/matricula`),
      caixa: this.caixaService.listar()
    }).subscribe({
      next: ({ matriculas, caixa }) => {
        // Educandos com matrícula ativa no ano letivo vigente
        const ativos = (matriculas || []).filter(m =>
          m.status === 'Ativa' && String(m.anoLetivo) === anoStr
        );

        // Pagamentos registrados
        const pagamentos: Lancamento[] = (caixa || []).filter(l =>
          l.tipoRecebimento === 'matricula' || l.tipoRecebimento === 'mensalidade'
        );

        const rows: RecebimentoRow[] = [];

        // 1. Adicionar todos os pagamentos registrados
        for (const p of pagamentos) {
          rows.push({
            idEducando: p.idEducando || '',
            nomeEducando: p.nomeEducando || '—',
            tipoRecebimento: p.tipoRecebimento as 'matricula' | 'mensalidade',
            anoLetivo: p.anoLetivo || (p.mesReferencia ? p.mesReferencia.substring(0, 4) : ''),
            mesReferencia: p.mesReferencia,
            status: 'pago',
            id: p.id,
            data: p.data,
            valor: p.valor,
            formaPagamento: p.formaPagamento,
            usuario: p.usuario,
          });
        }

        // 2. Para cada educando ativo, verificar pendências no ano atual
        for (const m of ativos) {
          const id = String(m.idMatricula);
          const nome = m.alunoNome || m.nome || '—';

          // Verificar matrícula paga
          const matriculaPaga = pagamentos.some(p =>
            p.tipoRecebimento === 'matricula' &&
            String(p.idEducando) === id &&
            (p.anoLetivo === anoStr || (p.mesReferencia || '').startsWith(anoStr))
          );
          if (!matriculaPaga) {
            rows.push({
              idEducando: id,
              nomeEducando: nome,
              tipoRecebimento: 'matricula',
              anoLetivo: anoStr,
              status: 'atrasado',
            });
          }

          // Verificar mensalidades pagas (Jan até mês atual)
          for (let mes = 1; mes <= this.mesAtual; mes++) {
            const mesStr = mes.toString().padStart(2, '0');
            const mesRef = `${anoStr}-${mesStr}`;
            const mensalidadePaga = pagamentos.some(p =>
              p.tipoRecebimento === 'mensalidade' &&
              String(p.idEducando) === id &&
              p.mesReferencia === mesRef
            );
            if (!mensalidadePaga) {
              rows.push({
                idEducando: id,
                nomeEducando: nome,
                tipoRecebimento: 'mensalidade',
                anoLetivo: anoStr,
                mesReferencia: mesRef,
                status: 'atrasado',
              });
            }
          }
        }

        // Ordenar: atrasados primeiro, depois por nome
        rows.sort((a, b) => {
          if (a.status !== b.status) return a.status === 'atrasado' ? -1 : 1;
          return a.nomeEducando.localeCompare(b.nomeEducando);
        });

        this.todos = rows;
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  aplicarFiltros(): void {
    this.paginaAtual = 1;
    this.filtrados = this.todos.filter(r => {
      const matchStatus   = !this.filtroStatus    || r.status === this.filtroStatus;
      const matchTipo     = !this.filtroTipo      || r.tipoRecebimento === this.filtroTipo;
      const matchAno      = !this.filtroAno       || r.anoLetivo === this.filtroAno;
      const matchMes      = !this.filtroMes       || (r.mesReferencia || '').substring(5, 7) === this.filtroMes;
      const matchEducando = !this.filtroEducando  || (r.nomeEducando || '').toLowerCase().includes(this.filtroEducando.toLowerCase()) || (r.idEducando || '').toLowerCase().includes(this.filtroEducando.toLowerCase());
      const matchForma    = !this.filtroFormaPgto || r.formaPagamento === this.filtroFormaPgto;
      return matchStatus && matchTipo && matchAno && matchMes && matchEducando && matchForma;
    });

    const pagos = this.filtrados.filter(r => r.status === 'pago');
    this.totalPago         = pagos.reduce((s, r) => s + (r.valor || 0), 0);
    this.totalAtrasado     = this.filtrados.filter(r => r.status === 'atrasado').length;
    this.totalMatriculas   = pagos.filter(r => r.tipoRecebimento === 'matricula').length;
    this.totalMensalidades = pagos.filter(r => r.tipoRecebimento === 'mensalidade').length;

    this.atualizarPagina();
  }

  atualizarPagina(): void {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    this.paginados = this.filtrados.slice(inicio, inicio + this.itensPorPagina);
  }

  limparFiltros(): void {
    this.filtroStatus = '';
    this.filtroTipo   = '';
    this.filtroAno    = String(this.anoAtual);
    this.filtroMes    = '';
    this.filtroEducando  = '';
    this.filtroFormaPgto = '';
    this.aplicarFiltros();
  }

  get filtrosAtivos(): number {
    return (this.filtroStatus ? 1 : 0) + (this.filtroTipo ? 1 : 0) +
           (this.filtroMes ? 1 : 0) + (this.filtroEducando ? 1 : 0) +
           (this.filtroFormaPgto ? 1 : 0);
  }

  get totalPaginas(): number { return Math.ceil(this.filtrados.length / this.itensPorPagina); }

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

  irParaPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) { this.paginaAtual = p; this.atualizarPagina(); }
  }

  onItensPorPaginaChange(): void { this.paginaAtual = 1; this.atualizarPagina(); }
  trackByIndex(i: number): number { return i; }

  getMesLabel(mesRef: string): string {
    if (!mesRef) return '—';
    const mes = mesRef.substring(5, 7);
    return this.meses.find(m => m.value === mes)?.label || mesRef;
  }

  getFormaPgtoLabel(forma: string | undefined): string {
    if (!forma) return '—';
    const m: Record<string, string> = { dinheiro: 'Dinheiro', pix: 'Pix', credito: 'Crédito', debito: 'Débito' };
    return m[forma] ?? forma;
  }

  novoLancamento(): void {
    this.router.navigate(['/caixa/novo']);
  }
}
