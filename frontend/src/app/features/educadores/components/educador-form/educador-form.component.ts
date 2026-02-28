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

interface Educador {
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
  disciplinaLecionada: string;
  turno: string;
  matriculaFuncional: string;
  senha?: string;
  confirmacaoSenha?: string;
  formacoes: Formacao[];
  status: 'ativo' | 'inativo';
}

@Component({
  selector: 'app-educador-form',
  templateUrl: './educador-form.component.html',
  styleUrls: ['./educador-form.component.scss']
})
export class EducadorFormComponent implements OnInit {
  educadorId: number | null = null;
  isEdicao: boolean = false;
  
  educador: Educador = {
    nomeCompleto: '',
    dataNascimento: '',
    cpf: '',
    genero: '',
    raca: '',
    endereco: '',
    telefone: '',
    email: '',
    formacaoAcademica: '',
    disciplinaLecionada: '',
    turno: '',
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
      this.educadorId = parseInt(id);
      this.isEdicao = true;
      this.carregarEducador();
    }
  }

  carregarEducador(): void {
    // Mock - substituir por chamada à API
    this.educador = {
      id: this.educadorId!,
      nomeCompleto: 'Ana Paula Silva',
      dataNascimento: '1985-05-15',
      cpf: '123.456.789-00',
      genero: 'Feminino',
      raca: 'Branca',
      endereco: 'Rua das Flores, 123 - Centro - São Paulo/SP',
      telefone: '(11) 98765-4321',
      email: 'ana.silva@escola.edu.br',
      formacaoAcademica: 'Licenciatura em Matemática',
      disciplinaLecionada: 'Matemática',
      turno: 'Matutino',
      matriculaFuncional: 'EDU001',
      formacoes: [
        {
          id: 1,
          instituicao: 'Universidade de São Paulo',
          areaEstudo: 'Licenciatura em Matemática',
          dataInicio: '2003-02-01',
          dataTermino: '2006-12-15',
          descricao: 'Graduação em Licenciatura Plena'
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

    if (!this.isEdicao && this.educador.senha !== this.educador.confirmacaoSenha) {
      alert('A senha e a confirmação de senha não coincidem');
      return;
    }

    if (this.isEdicao) {
      console.log('Atualizar educador:', this.educador);
      // Implementar chamada à API
    } else {
      console.log('Criar novo educador:', this.educador);
      // Implementar chamada à API
    }

    this.voltar();
  }

  voltar(): void {
    this.router.navigate(['/educadores']);
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

    this.educador.formacoes.push({ ...this.novaFormacao });
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
      this.educador.formacoes.splice(index, 1);
    }
  }
}
