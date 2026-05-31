import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CaixaService, Lancamento } from '../../services/caixa.service';
import { FornecedoresService } from '../../../fornecedores/services/fornecedores.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-caixa-form',
  templateUrl: './caixa-form.component.html',
  styleUrls: ['./caixa-form.component.scss'],
  host: { style: 'display:flex;flex-direction:column;min-height:100%;overflow:visible;flex:1 0 auto;width:100%;box-sizing:border-box;' }
})
export class CaixaFormComponent implements OnInit {
  lancamentoId: number | null = null;
  isEdicao = false;
  salvando = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

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
    centroCusto: '',
    descricao: '',
    fornecedor: '',
    valor: 0,
    usuario: '',
    projetado: false,
    tipoRecebimento: '',
    idEducando: '',
    nomeEducando: '',
    mesReferencia: '',
    anoLetivo: '',
  };

  fornecedores: string[] = [];
  valorDisplay: string = '';

  // ── Recebimento escolar (modal) ───────────────────────────
  modalRecebimento = false;
  recebTipo: 'matricula' | 'mensalidade' | '' = '';
  recebMes = '';      // YYYY-MM  — para mensalidade
  recebAno = '';      // YYYY     — para matrícula / mensalidade
  educandos: { idMatricula: string; nome: string }[] = [];
  educandosFiltrados: { idMatricula: string; nome: string }[] = [];
  buscaEducando = '';
  mostrarDropdownEducando = false;
  educandoSelecionado: { idMatricula: string; nome: string } | null = null;

  readonly anoAtual = new Date().getFullYear();
  readonly anosLetivos: string[] = Array.from({ length: 5 }, (_, i) => String(this.anoAtual - 1 + i));
  readonly meses = [
    { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro'},{ value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro'},{ value: '12', label: 'Dezembro' },
  ];

  // ── Parcelamento ──────────────────────────────────────────
  parcelado = false;
  numeroParcelas = 2;

  readonly maxParcelasPorForma: Record<string, number> = {
    credito: 24,
    debito: 3,
    pix: 12,
    dinheiro: 12
  };

  get maxParcelas(): number {
    return this.maxParcelasPorForma[this.lancamento.formaPagamento] ?? 12;
  }

  get opcoesParcelamento(): number[] {
    return Array.from({ length: this.maxParcelas - 1 }, (_, i) => i + 2);
  }

  get valorParcela(): number {
    if (!this.parcelado || this.numeroParcelas < 2 || !this.lancamento.valor) return 0;
    return this.lancamento.valor / this.numeroParcelas;
  }

  get valorParcelaDisplay(): string {
    return this.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  get isSaida(): boolean     { return this.lancamento.tipoConta === 'saida'; }
  get isProjetado(): boolean { return !!this.lancamento.projetado; }

  setProjetado(val: boolean): void {
    this.lancamento.projetado = val;
  }

  onFormaPagamentoChange(): void {
    // Reseta parcelamento ao trocar forma de pagamento
    this.parcelado = false;
    this.numeroParcelas = 2;
  }

  /** Formata o valor como moeda BRL conforme o usuário digita (ex: 1000 → R$ 10,00) */
  onValorInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Remove tudo que não for dígito
    const digits = input.value.replace(/\D/g, '');
    const cents = parseInt(digits || '0', 10);
    this.lancamento.valor = cents / 100;
    this.valorDisplay = this.formatarBRL(cents);
    // Atualiza o campo visualmente sem mover o cursor
    input.value = this.valorDisplay;
  }

  /** Converte centavos inteiros para string BRL (ex: 100056423 → "1.000.564,23") */
  private formatarBRL(cents: number): string {
    if (!cents) return '';
    const valor = cents / 100;
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private caixaService: CaixaService,
    private fornecedoresService: FornecedoresService
  ) {}

  ngOnInit(): void {
    this.lancamento.data = new Date().toISOString().split('T')[0];
    this.preencherUsuario();
    this.carregarFornecedores();
    this.carregarEducandos();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.lancamentoId = parseInt(id, 10);
      this.isEdicao = true;
      this.carregarLancamento();
    }
  }

  preencherUsuario(): void {
    try {
      const raw = localStorage.getItem('usuarioAtual');
      if (raw) {
        const user = JSON.parse(raw);
        this.lancamento.usuario = user.nome || '';
      }
    } catch { /* sem usuário logado */ }
  }

  carregarFornecedores(): void {
    this.fornecedoresService.listar().subscribe({
      next: (lista) => {
        this.fornecedores = lista.map(f => f.nome);
      },
      error: () => { this.fornecedores = []; }
    });
  }

  carregarEducandos(): void {
    this.http.get<any[]>(`${environment.apiUrl}/matricula`).subscribe({
      next: (lista) => {
        this.educandos = (lista || [])
          .filter((m: any) => !m.status || m.status === 'Ativa')
          .map((m: any) => ({
            idMatricula: m.idMatricula || m.id || '',
            nome: m.alunoNome || m.nomeCompleto || m.nome || m.educando || ''
          })).filter(e => e.idMatricula && e.nome);
        this.educandosFiltrados = [...this.educandos];
      },
      error: () => { this.educandos = []; this.educandosFiltrados = []; }
    });
  }

  // ── Modal de recebimento ──────────────────────────────────
  abrirModalRecebimento(): void {
    this.recebTipo = '';
    this.recebMes = String(new Date().getMonth() + 1).padStart(2, '0');
    this.recebAno = String(this.anoAtual);
    this.buscaEducando = '';
    this.educandoSelecionado = null;
    this.educandosFiltrados = [...this.educandos];
    this.mostrarDropdownEducando = false;
    this.modalRecebimento = true;
  }

  fecharModalRecebimento(): void {
    this.modalRecebimento = false;
  }

  confirmarRecebimento(): void {
    if (!this.recebTipo || !this.educandoSelecionado) return;
    this.lancamento.tipoRecebimento = this.recebTipo;
    this.lancamento.idEducando = this.educandoSelecionado.idMatricula;
    this.lancamento.nomeEducando = this.educandoSelecionado.nome;
    this.lancamento.fornecedor = '';
    this.lancamento.mesReferencia = this.recebTipo === 'mensalidade'
      ? `${this.recebAno}-${this.recebMes}`
      : '';
    this.lancamento.anoLetivo = this.recebAno;
    // Pré-preenche tipoConta e descrição se ainda não preenchidos
    if (!this.lancamento.tipoConta) this.lancamento.tipoConta = 'entrada';
    if (!this.lancamento.descricao) {
      if (this.recebTipo === 'mensalidade') {
        const mesLabel = this.meses.find(m => m.value === this.recebMes)?.label || this.recebMes;
        this.lancamento.descricao = `Mensalidade ${mesLabel}/${this.recebAno} — ${this.educandoSelecionado.nome}`;
      } else {
        this.lancamento.descricao = `Matrícula ${this.recebAno} — ${this.educandoSelecionado.nome}`;
      }
    }
    this.modalRecebimento = false;
  }

  removerRecebimento(): void {
    this.lancamento.tipoRecebimento = '';
    this.lancamento.idEducando = '';
    this.lancamento.nomeEducando = '';
    this.lancamento.mesReferencia = '';
    this.lancamento.anoLetivo = '';
  }

  filtrarEducandos(): void {
    const q = this.buscaEducando.toLowerCase().trim();
    this.educandosFiltrados = !q
      ? [...this.educandos]
      : this.educandos.filter(e =>
          e.nome.toLowerCase().includes(q) || e.idMatricula.toLowerCase().includes(q)
        );
    this.mostrarDropdownEducando = true;
  }

  selecionarEducando(e: { idMatricula: string; nome: string }): void {
    this.educandoSelecionado = e;
    this.buscaEducando = `${e.nome} (${e.idMatricula})`;
    this.mostrarDropdownEducando = false;
  }

  get recebimentoLabel(): string {
    if (!this.lancamento.tipoRecebimento) return '';
    return this.lancamento.tipoRecebimento === 'matricula' ? 'Matrícula' : 'Mensalidade';
  }

  carregarLancamento(): void {
    this.caixaService.buscar(this.lancamentoId!).subscribe({
      next: (dados) => {
        this.lancamento = dados;
        // Inicializa a máscara de valor com os dados carregados
        const cents = Math.round((dados.valor || 0) * 100);
        this.valorDisplay = this.formatarBRL(cents);
        // Restaura estado de parcelamento
        if (dados.parcelado && (dados.numeroParcelas ?? 1) >= 2) {
          this.parcelado = true;
          this.numeroParcelas = dados.numeroParcelas!;
        }
      },
      error: () => this.showMessage('Erro ao carregar dados do lançamento.', 'error')
    });
  }

  onTipoContaChange(): void {
    this.lancamento.tipoDespesa    = '';
    this.lancamento.fornecedor     = '';
    this.lancamento.tipoRecebimento = '';
    this.lancamento.idEducando     = '';
    this.lancamento.nomeEducando   = '';
    this.educandoSelecionado       = null;
  }

  salvar(form: any): void {
    if (!form.valid) {
      this.showMessage('Preencha todos os campos obrigatórios antes de continuar.', 'error');
      return;
    }
    if (this.lancamento.valor <= 0) {
      this.showMessage('O valor deve ser maior que zero.', 'error');
      return;
    }

    if (!this.isSaida) {
      // Entrada: tipoDespesa não se aplica; fornecedor é opcional (pode ser a origem do pagamento)
      this.lancamento.tipoDespesa = this.lancamento.tipoDespesa || '';
    }

    // Anexa dados de parcelamento ao lançamento
    if (this.parcelado && this.numeroParcelas >= 2) {
      this.lancamento.parcelado       = true;
      this.lancamento.numeroParcelas  = this.numeroParcelas;
      this.lancamento.valorParcela    = this.valorParcela;
    } else {
      this.lancamento.parcelado       = false;
      this.lancamento.numeroParcelas  = 1;
      this.lancamento.valorParcela    = this.lancamento.valor;
    }

    const doSalvar = () => {
      this.salvando = true;
      const request$ = this.isEdicao
        ? this.caixaService.atualizar(this.lancamentoId!, this.lancamento)
        : this.caixaService.criar(this.lancamento);

      request$.subscribe({
        next: () => {
          this.salvando = false;
          this.router.navigate(['/caixa']);
        },
        error: (err) => {
          this.salvando = false;
          this.showMessage(err?.error?.error || 'Erro ao salvar. Tente novamente.', 'error');
        }
      });
    };

    if (this.isEdicao) {
      this.openConfirm(
        'Atualizar lançamento',
        `Tem certeza que deseja atualizar o lançamento "${this.lancamento.descricao}"?`,
        false,
        doSalvar
      );
    } else {
      doSalvar();
    }
  }

  openConfirm(title: string, message: string, danger: boolean, callback: () => void): void {
    this.confirm = { visible: true, title, message, danger, callback };
  }

  confirmAction(): void { this.confirm.visible = false; this.confirm.callback(); }
  cancelConfirm(): void  { this.confirm.visible = false; }

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => { this.message = ''; }, 5000);
  }

  voltar(): void {
    this.router.navigate(['/caixa']);
  }
}
