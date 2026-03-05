import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Fornecedor {
  id: number;
  tipo: 'PF' | 'PJ';
  nome: string;
  razaoSocial?: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  tipoDespesa: string;
  ativo: boolean;
}

@Component({
  selector: 'app-fornecedores-list',
  templateUrl: './fornecedores-list.component.html',
  styleUrls: ['./fornecedores-list.component.scss'],
  host: { style: 'display:block;width:100%;margin:0;text-align:left;' }
})
export class FornecedoresListComponent implements OnInit {
  fornecedores: Fornecedor[] = [];
  fornecedoresFiltrados: Fornecedor[] = [];
  
  // Filtros
  filtroTipo: string = '';
  filtroNome: string = '';
  filtroStatus: string = '';
  filtroTipoDespesa: string = '';
  
  // Seleção
  selecionados: Set<number> = new Set();
  bulkAction: string = '';

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
    this.carregarFornecedores();
  }

  carregarFornecedores(): void {
    // Mock data - substituir por chamada à API
    this.fornecedores = [
      {
        id: 1,
        tipo: 'PJ',
        nome: 'Papelaria Central',
        razaoSocial: 'Papelaria Central Ltda',
        cpfCnpj: '12.345.678/0001-90',
        email: 'contato@papelariacentral.com.br',
        telefone: '(31) 3456-7890',
        cep: '30130-000',
        endereco: 'Av. Afonso Pena, 1500',
        tipoDespesa: 'Material Escolar',
        ativo: true
      },
      {
        id: 2,
        tipo: 'PJ',
        nome: 'Companhia de Energia',
        razaoSocial: 'CEMIG Distribuição S.A.',
        cpfCnpj: '06.981.176/0001-16',
        email: 'atendimento@cemig.com.br',
        telefone: '(31) 3506-1500',
        cep: '30190-922',
        endereco: 'Av. Barbacena, 1200',
        tipoDespesa: 'Energia / Água / Telefone',
        ativo: true
      },
      {
        id: 3,
        tipo: 'PF',
        nome: 'João Carlos Silva',
        cpfCnpj: '123.456.789-00',
        email: 'joao.silva@email.com',
        telefone: '(31) 98765-4321',
        cep: '30140-071',
        endereco: 'Rua Rio de Janeiro, 1000',
        tipoDespesa: 'Manutenção',
        ativo: true
      },
      {
        id: 4,
        tipo: 'PJ',
        nome: 'Fornecedor de Alimentos',
        razaoSocial: 'Alimentos BH Ltda',
        cpfCnpj: '98.765.432/0001-10',
        email: 'vendas@alimentosbh.com.br',
        telefone: '(31) 3200-5500',
        cep: '31110-000',
        endereco: 'Rua dos Goi  tácazes, 500',
        tipoDespesa: 'Alimentação',
        ativo: false
      }
    ];
    
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.fornecedoresFiltrados = this.fornecedores.filter(fornecedor => {
      const matchTipo = !this.filtroTipo || fornecedor.tipo === this.filtroTipo;
      const matchNome = !this.filtroNome || 
        fornecedor.nome.toLowerCase().includes(this.filtroNome.toLowerCase()) ||
        (fornecedor.razaoSocial && fornecedor.razaoSocial.toLowerCase().includes(this.filtroNome.toLowerCase()));
      const matchStatus = !this.filtroStatus || 
        (this.filtroStatus === 'ativo' && fornecedor.ativo) ||
        (this.filtroStatus === 'inativo' && !fornecedor.ativo);
      const matchTipoDespesa = !this.filtroTipoDespesa ||
        fornecedor.tipoDespesa === this.filtroTipoDespesa;
      
      return matchTipo && matchNome && matchStatus && matchTipoDespesa;
    });
  }

  limparFiltros(): void {
    this.filtroTipo = '';
    this.filtroNome = '';
    this.filtroStatus = '';
    this.filtroTipoDespesa = '';
    this.aplicarFiltros();
  }

  toggleSelecao(id: number): void {
    if (this.selecionados.has(id)) {
      this.selecionados.delete(id);
    } else {
      this.selecionados.add(id);
    }
  }

  toggleTodos(event: any): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.fornecedoresFiltrados.forEach(f => this.selecionados.add(f.id));
    } else {
      this.selecionados.clear();
    }
  }

  get quantidadeSelecionados(): number {
    return this.selecionados.size;
  }

  private _ativarSelecionados(): void {
    this.fornecedores.forEach(f => { if (this.selecionados.has(f.id)) f.ativo = true; });
    const n = this.selecionados.size;
    this.selecionados.clear();
    this.bulkAction = '';
    this.aplicarFiltros();
    this.showMessage(`${n} fornecedor(es) ativado(s) com sucesso.`, 'success');
  }

  private _desativarSelecionados(): void {
    this.fornecedores.forEach(f => { if (this.selecionados.has(f.id)) f.ativo = false; });
    const n = this.selecionados.size;
    this.selecionados.clear();
    this.bulkAction = '';
    this.aplicarFiltros();
    this.showMessage(`${n} fornecedor(es) desativado(s) com sucesso.`, 'success');
  }

  private _excluirSelecionados(): void {
    const n = this.selecionados.size;
    this.fornecedores = this.fornecedores.filter(f => !this.selecionados.has(f.id));
    this.selecionados.clear();
    this.bulkAction = '';
    this.aplicarFiltros();
    this.showMessage(`${n} fornecedor(es) excluído(s) com sucesso.`, 'success');
  }

  novo(): void {
    this.router.navigate(['/fornecedores/novo']);
  }

  editar(id: number): void {
    this.router.navigate([`/fornecedores/${id}/editar`]);
  }

  excluir(fornecedor: Fornecedor): void {
    this.openConfirm(
      'Excluir fornecedor',
      `Tem certeza que deseja excluir o fornecedor "${fornecedor.nome}"? Esta ação não pode ser desfeita.`,
      true,
      () => {
        this.fornecedores = this.fornecedores.filter(f => f.id !== fornecedor.id);
        this.aplicarFiltros();
        this.showMessage(`Fornecedor "${fornecedor.nome}" excluído com sucesso.`, 'success');
      }
    );
  }

  toggleAtivo(fornecedor: Fornecedor): void {
    const acao = fornecedor.ativo ? 'desativar' : 'ativar';
    this.openConfirm(
      `${acao.charAt(0).toUpperCase() + acao.slice(1)} fornecedor`,
      `Tem certeza que deseja ${acao} o fornecedor "${fornecedor.nome}"?`,
      acao === 'desativar',
      () => {
        fornecedor.ativo = !fornecedor.ativo;
        this.aplicarFiltros();
        this.showMessage(`Fornecedor "${fornecedor.nome}" ${fornecedor.ativo ? 'ativado' : 'desativado'} com sucesso.`, 'success');
      }
    );
  }

  performBulkAction(): void {
    if (!this.bulkAction) {
      this.showMessage('Selecione uma ação em lote.', 'error');
      return;
    }
    if (this.quantidadeSelecionados === 0) {
      this.showMessage('Selecione pelo menos um fornecedor.', 'error');
      return;
    }
    const n = this.quantidadeSelecionados;
    const acaoLabel = this.bulkAction === 'excluir' ? 'excluir' : this.bulkAction === 'ativar' ? 'ativar' : 'desativar';
    const isDanger = this.bulkAction === 'excluir' || this.bulkAction === 'desativar';
    const snapshot = this.bulkAction;
    this.openConfirm(
      'Ação em lote',
      `Tem certeza que deseja ${acaoLabel} ${n} fornecedor(es) selecionado(s)?`,
      isDanger,
      () => {
        if (snapshot === 'ativar')    this._ativarSelecionados();
        if (snapshot === 'desativar') this._desativarSelecionados();
        if (snapshot === 'excluir')   this._excluirSelecionados();
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
}
