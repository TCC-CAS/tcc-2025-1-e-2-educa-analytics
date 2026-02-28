import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface Formacao {
  id?: number;
  instituicao: string;
  areaEstudo: string;
  dataInicio: string;
  dataTermino: string;
  descricao: string;
}

interface Colaborador {
  id?: number;
  nomeCompleto: string;
  dataNascimento: string;
  cpf: string;
  genero: string;
  raca: string;
  endereco: string;
  telefone: string;
  email: string;
  formacaoAcademica: string;
  cargo: string;
  matriculaFuncional: string;
  senha?: string;
  confirmacaoSenha?: string;
  formacoes: Formacao[];
  status: 'ativo' | 'inativo';
}

@Component({
  selector: 'app-colaborador-form',
  templateUrl: './colaborador-form.component.html',
  styleUrls: ['./colaborador-form.component.scss']
})
export class ColaboradorFormComponent implements OnInit {
  colaboradorId: number | null = null;
  isEdicao: boolean = false;
  
  colaborador: Colaborador = {
    nomeCompleto: '',
    dataNascimento: '',
    cpf: '',
    genero: '',
    raca: '',
    endereco: '',
    telefone: '',
    email: '',
    formacaoAcademica: '',
    cargo: '',
    matriculaFuncional: '',
    senha: '',
    confirmacaoSenha: '',
    formacoes: [],
    status: 'ativo'
  };

  // Nova formação
  novaFormacao: Formacao = {
    instituicao: '',
    areaEstudo: '',
    dataInicio: '',
    dataTermino: '',
    descricao: ''
  };

  mostrarFormFormacao: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.colaboradorId = parseInt(id);
      this.isEdicao = true;
      this.carregarColaborador();
    }
  }

  carregarColaborador(): void {
    // Mock - substituir por chamada à API
    this.colaborador = {
      id: this.colaboradorId!,
      nomeCompleto: 'Maria Santos Costa',
      dataNascimento: '1990-03-20',
      cpf: '987.654.321-00',
      genero: 'Feminino',
      raca: 'Parda',
      endereco: 'Av. Principal, 456 - Centro - Brasília/DF',
      telefone: '(61) 99876-5432',
      email: 'maria.costa@escola.edu.br',
      formacaoAcademica: 'Bacharelado em Administração',
      cargo: 'Secretária Escolar',
      matriculaFuncional: 'COL001',
      formacoes: [
        {
          id: 1,
          instituicao: 'Universidade de Brasília',
          areaEstudo: 'Administração de Empresas',
          dataInicio: '2008-02-01',
          dataTermino: '2011-12-15',
          descricao: 'Bacharelado em Administração com ênfase em Gestão Escolar'
        }
      ],
      status: 'ativo'
    };
  }

  salvar(form: any): void {
    if (!form.valid) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!this.isEdicao && this.colaborador.senha !== this.colaborador.confirmacaoSenha) {
      alert('A senha e a confirmação de senha não coincidem');
      return;
    }

    if (this.isEdicao) {
      console.log('Atualizar colaborador:', this.colaborador);
      // Implementar chamada à API
    } else {
      console.log('Criar novo colaborador:', this.colaborador);
      // Implementar chamada à API
    }

    this.voltar();
  }

  voltar(): void {
    this.router.navigate(['/colaboradores']);
  }

  // Gerenciamento de formações
  toggleFormFormacao(): void {
    this.mostrarFormFormacao = !this.mostrarFormFormacao;
    if (!this.mostrarFormFormacao) {
      this.limparFormFormacao();
    }
  }

  adicionarFormacao(formFormacao: any): void {
    if (!formFormacao.valid) {
      alert('Por favor, preencha todos os campos da formação');
      return;
    }

    this.colaborador.formacoes.push({ ...this.novaFormacao });
    this.limparFormFormacao();
    this.mostrarFormFormacao = false;
  }

  limparFormFormacao(): void {
    this.novaFormacao = {
      instituicao: '',
      areaEstudo: '',
      dataInicio: '',
      dataTermino: '',
      descricao: ''
    };
  }

  removerFormacao(index: number): void {
    if (confirm('Tem certeza que deseja remover esta formação?')) {
      this.colaborador.formacoes.splice(index, 1);
    }
  }
}
