import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CaixaService, Lancamento } from '../../services/caixa.service';
import { FornecedoresService } from '../../../fornecedores/services/fornecedores.service';

@Component({
  selector: 'app-caixa-form',
  templateUrl: './caixa-form.component.html',
  styleUrls: ['./caixa-form.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
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
    projetado: false
  };

  fornecedores: string[] = [];

  get isSaida(): boolean     { return this.lancamento.tipoConta === 'saida'; }
  get isProjetado(): boolean { return !!this.lancamento.projetado; }

  setProjetado(val: boolean): void {
    this.lancamento.projetado = val;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private caixaService: CaixaService,
    private fornecedoresService: FornecedoresService
  ) {}

  ngOnInit(): void {
    this.lancamento.data = new Date().toISOString().split('T')[0];
    this.preencherUsuario();
    this.carregarFornecedores();

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
        this.fornecedores = lista.filter(f => f.ativo).map(f => f.nome);
        if (!this.fornecedores.includes('N/A')) this.fornecedores.push('N/A');
      },
      error: () => { this.fornecedores = ['N/A']; }
    });
  }

  carregarLancamento(): void {
    this.caixaService.buscar(this.lancamentoId!).subscribe({
      next: (dados) => { this.lancamento = dados; },
      error: () => this.showMessage('Erro ao carregar dados do lançamento.', 'error')
    });
  }

  onTipoContaChange(): void {
    if (this.lancamento.tipoConta === 'entrada') {
      this.lancamento.fornecedor = 'N/A';
      this.lancamento.tipoDespesa = 'N/A';
    } else {
      this.lancamento.fornecedor = '';
      this.lancamento.tipoDespesa = '';
    }
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
      this.lancamento.fornecedor = this.lancamento.fornecedor || 'N/A';
      this.lancamento.tipoDespesa = this.lancamento.tipoDespesa || 'N/A';
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
