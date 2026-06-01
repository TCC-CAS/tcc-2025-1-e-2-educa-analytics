import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

type NivelDesempenho = 'excelente' | 'bom' | 'regular' | 'precisa-apoio' | '';

interface Criterio {
  id: string;
  nome: string;
  descricao: string;
  nivel: NivelDesempenho;
}

interface Secao {
  id: string;
  titulo: string;
  icone: string;
  criterios: Criterio[];
}

interface CampoAtuacao {
  campo: string;
  generos: string;
  objetivo: string;
}

interface SinteseItem {
  id: string;
  dimensao: string;
  indicadores: string;
  observacoes: string;
}

interface Educando {
  id: string;
  nome: string;
  turma: string;
  serie: string;
}

interface AvaliacaoBNCC {
  titulo: string;
  subtitulo: string;
  disciplina: string;
  secoes: Secao[];
  camposAtuacao: CampoAtuacao[];
  sintese: SinteseItem[];
}

@Component({
  selector: 'app-avaliacao-bncc-form',
  templateUrl: './avaliacao-bncc-form.component.html',
  styleUrls: ['./avaliacao-bncc-form.component.scss']
})
export class AvaliacaoBnccFormComponent implements OnInit {
  tipoAvaliacao: string = '';
  avaliacao: AvaliacaoBNCC | null = null;
  secaoAtiva: string = '';
  progresso: number = 0;
  enviando: boolean = false;
  enviado: boolean = false;

  educandoSelecionado: string = '';
  bimestreSelecionado: string = '1';
  anoLetivoSelecionado: string = '2026';

  niveisList: { valor: NivelDesempenho; label: string; icone: string }[] = [
    { valor: 'excelente', label: 'Excelente', icone: '⭐' },
    { valor: 'bom', label: 'Bom', icone: '✔' },
    { valor: 'regular', label: 'Regular', icone: '⚠' },
    { valor: 'precisa-apoio', label: 'Precisa apoio', icone: '🆘' }
  ];

  educandosMock: Educando[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.tipoAvaliacao = this.route.snapshot.paramMap.get('tipo') || '';
    this.carregarAvaliacao();
    if (this.avaliacao && this.avaliacao.secoes.length > 0) {
      this.secaoAtiva = this.avaliacao.secoes[0].id;
    }
  }

  carregarAvaliacao(): void {
    switch (this.tipoAvaliacao) {
      case 'lp-anos-1-2':
        this.avaliacao = this.getAvaliacaoLP12Ano();
        this.educandosMock = [
          { id: '1', nome: 'Ana Beatriz Silva', turma: '1ºA', serie: '1º Ano' },
          { id: '2', nome: 'Carlos Eduardo Santos', turma: '2ºA', serie: '2º Ano' },
          { id: '3', nome: 'Fernanda Oliveira', turma: '1ºB', serie: '1º Ano' },
          { id: '4', nome: 'Gabriel Souza Mendes', turma: '2ºB', serie: '2º Ano' },
          { id: '5', nome: 'Isabela Costa Lima', turma: '1ºA', serie: '1º Ano' }
        ];
        break;
      case 'lp-anos-3-5':
        this.avaliacao = this.getAvaliacaoLP35Ano();
        this.educandosMock = [
          { id: '1', nome: 'Lucas Ferreira Alves', turma: '3ºA', serie: '3º Ano' },
          { id: '2', nome: 'Mariana Pereira Cruz', turma: '4ºA', serie: '4º Ano' },
          { id: '3', nome: 'Pedro Henrique Lima', turma: '5ºA', serie: '5º Ano' },
          { id: '4', nome: 'Sofia Rodrigues Dias', turma: '3ºB', serie: '3º Ano' },
          { id: '5', nome: 'Thiago Nascimento', turma: '4ºB', serie: '4º Ano' }
        ];
        break;
      case 'lp-anos-6-9':
        this.avaliacao = this.getAvaliacaoLP69Ano();
        this.educandosMock = [
          { id: '1', nome: 'Amanda Carvalho Pinto', turma: '6ºA', serie: '6º Ano' },
          { id: '2', nome: 'Breno Augusto Melo', turma: '7ºA', serie: '7º Ano' },
          { id: '3', nome: 'Camila Torres Farias', turma: '8ºA', serie: '8º Ano' },
          { id: '4', nome: 'Diego Lopes Barros', turma: '9ºA', serie: '9º Ano' },
          { id: '5', nome: 'Eduarda Gomes Costa', turma: '6ºB', serie: '6º Ano' }
        ];
        break;
      case 'arte-anos-1-5':
        this.avaliacao = this.getAvaliacaoArte15Ano();
        this.educandosMock = [
          { id: '1', nome: 'Ana Beatriz Silva', turma: '1ºA', serie: '1º Ano' },
          { id: '2', nome: 'Carlos Eduardo Santos', turma: '2ºA', serie: '2º Ano' },
          { id: '3', nome: 'Lucas Ferreira Alves', turma: '3ºA', serie: '3º Ano' },
          { id: '4', nome: 'Mariana Pereira Cruz', turma: '4ºA', serie: '4º Ano' },
          { id: '5', nome: 'Pedro Henrique Lima', turma: '5ºA', serie: '5º Ano' }
        ];
        break;
      case 'arte-anos-6-9':
        this.avaliacao = this.getAvaliacaoArte69Ano();
        this.educandosMock = [
          { id: '1', nome: 'Amanda Carvalho Pinto', turma: '6ºA', serie: '6º Ano' },
          { id: '2', nome: 'Breno Augusto Melo', turma: '7ºA', serie: '7º Ano' },
          { id: '3', nome: 'Camila Torres Farias', turma: '8ºA', serie: '8º Ano' },
          { id: '4', nome: 'Diego Lopes Barros', turma: '9ºA', serie: '9º Ano' },
          { id: '5', nome: 'Eduarda Gomes Costa', turma: '6ºB', serie: '6º Ano' }
        ];
        break;
      case 'ef-anos-1-2':
        this.avaliacao = this.getAvaliacaoEF12Ano();
        this.educandosMock = [
          { id: '1', nome: 'Ana Beatriz Silva', turma: '1ºA', serie: '1º Ano' },
          { id: '2', nome: 'Carlos Eduardo Santos', turma: '2ºA', serie: '2º Ano' },
          { id: '3', nome: 'Fernanda Oliveira', turma: '1ºB', serie: '1º Ano' },
          { id: '4', nome: 'Gabriel Souza Mendes', turma: '2ºB', serie: '2º Ano' },
          { id: '5', nome: 'Isabela Costa Lima', turma: '1ºA', serie: '1º Ano' }
        ];
        break;
      case 'ef-anos-3-5':
        this.avaliacao = this.getAvaliacaoEF35Ano();
        this.educandosMock = [
          { id: '1', nome: 'Lucas Ferreira Alves', turma: '3ºA', serie: '3º Ano' },
          { id: '2', nome: 'Mariana Pereira Cruz', turma: '4ºA', serie: '4º Ano' },
          { id: '3', nome: 'Pedro Henrique Lima', turma: '5ºA', serie: '5º Ano' },
          { id: '4', nome: 'Sofia Rodrigues Dias', turma: '3ºB', serie: '3º Ano' },
          { id: '5', nome: 'Thiago Nascimento', turma: '4ºB', serie: '4º Ano' }
        ];
        break;
      case 'ef-anos-6-7':
        this.avaliacao = this.getAvaliacaoEF67Ano();
        this.educandosMock = [
          { id: '1', nome: 'Amanda Vieira Campos', turma: '6ºA', serie: '6º Ano' },
          { id: '2', nome: 'Bruno Carvalho Pinto', turma: '7ºA', serie: '7º Ano' },
          { id: '3', nome: 'Carolina Matos Neves', turma: '6ºB', serie: '6º Ano' },
          { id: '4', nome: 'Diego Almeida Rosa', turma: '7ºB', serie: '7º Ano' },
          { id: '5', nome: 'Eduarda Freitas Lopes', turma: '6ºA', serie: '6º Ano' }
        ];
        break;
      case 'ef-anos-8-9':
        this.avaliacao = this.getAvaliacaoEF89Ano();
        this.educandosMock = [
          { id: '1', nome: 'Felipe Guimarães Teixeira', turma: '8ºA', serie: '8º Ano' },
          { id: '2', nome: 'Gabriela Monteiro Ramos', turma: '9ºA', serie: '9º Ano' },
          { id: '3', nome: 'Henrique Barbosa Cunha', turma: '8ºB', serie: '8º Ano' },
          { id: '4', nome: 'Isabela Correia Faria', turma: '9ºB', serie: '9º Ano' },
          { id: '5', nome: 'João Victor Azevedo', turma: '8ºA', serie: '8º Ano' }
        ];
        break;
      case 'li-ano-6':
        this.avaliacao = this.getAvaliacaoLI6Ano();
        this.educandosMock = [
          { id: '1', nome: 'Alice Ferreira Braga', turma: '6ºA', serie: '6º Ano' },
          { id: '2', nome: 'Bernardo Leal Campos', turma: '6ºA', serie: '6º Ano' },
          { id: '3', nome: 'Cecília Nunes Moraes', turma: '6ºB', serie: '6º Ano' },
          { id: '4', nome: 'Daniel Vaz Pereira', turma: '6ºB', serie: '6º Ano' },
          { id: '5', nome: 'Elisa Rocha Teixeira', turma: '6ºA', serie: '6º Ano' }
        ];
        break;
      case 'li-ano-7':
        this.avaliacao = this.getAvaliacaoLI7Ano();
        this.educandosMock = [
          { id: '1', nome: 'Fábio Melo Cardoso', turma: '7ºA', serie: '7º Ano' },
          { id: '2', nome: 'Giovanna Pires Alves', turma: '7ºA', serie: '7º Ano' },
          { id: '3', nome: 'Heitor Ramos Figueiredo', turma: '7ºB', serie: '7º Ano' },
          { id: '4', nome: 'Iara Souza Castilho', turma: '7ºB', serie: '7º Ano' },
          { id: '5', nome: 'Júlio César Andrade', turma: '7ºA', serie: '7º Ano' }
        ];
        break;
      case 'li-ano-8':
        this.avaliacao = this.getAvaliacaoLI8Ano();
        this.educandosMock = [
          { id: '1', nome: 'Karen Dias Nogueira', turma: '8ºA', serie: '8º Ano' },
          { id: '2', nome: 'Leonardo Bastos Cruz', turma: '8ºA', serie: '8º Ano' },
          { id: '3', nome: 'Marina Fonseca Lima', turma: '8ºB', serie: '8º Ano' },
          { id: '4', nome: 'Nicolas Carvalho Duarte', turma: '8ºB', serie: '8º Ano' },
          { id: '5', nome: 'Olivia Mendes Tavares', turma: '8ºA', serie: '8º Ano' }
        ];
        break;
      case 'li-ano-9':
        this.avaliacao = this.getAvaliacaoLI9Ano();
        this.educandosMock = [
          { id: '1', nome: 'Paulo Henrique Borges', turma: '9ºA', serie: '9º Ano' },
          { id: '2', nome: 'Quezia Araújo Monteiro', turma: '9ºA', serie: '9º Ano' },
          { id: '3', nome: 'Rafael Costa Silveira', turma: '9ºB', serie: '9º Ano' },
          { id: '4', nome: 'Sara Lopes Queiroz', turma: '9ºB', serie: '9º Ano' },
          { id: '5', nome: 'Tomás Vieira Corrêa', turma: '9ºA', serie: '9º Ano' }
        ];
        break;
      case 'mat-ano-1':
        this.avaliacao = this.getAvaliacaoMat1Ano();
        this.educandosMock = [
          { id: '1', nome: 'Alice Souza Pinto', turma: '1ºA', serie: '1º Ano' },
          { id: '2', nome: 'Bento Lima Carvalho', turma: '1ºA', serie: '1º Ano' },
          { id: '3', nome: 'Catarina Rocha Melo', turma: '1ºB', serie: '1º Ano' },
          { id: '4', nome: 'Davi Ferreira Neto', turma: '1ºB', serie: '1º Ano' },
          { id: '5', nome: 'Emily Gomes Torres', turma: '1ºA', serie: '1º Ano' }
        ];
        break;
      case 'mat-ano-2':
        this.avaliacao = this.getAvaliacaoMat2Ano();
        this.educandosMock = [
          { id: '1', nome: 'Felipe Andrade Cruz', turma: '2ºA', serie: '2º Ano' },
          { id: '2', nome: 'Gabriela Martins Dias', turma: '2ºA', serie: '2º Ano' },
          { id: '3', nome: 'Henrique Lopes Braga', turma: '2ºB', serie: '2º Ano' },
          { id: '4', nome: 'Isabela Costa Freitas', turma: '2ºB', serie: '2º Ano' },
          { id: '5', nome: 'João Pedro Silva', turma: '2ºA', serie: '2º Ano' }
        ];
        break;
      case 'mat-ano-3':
        this.avaliacao = this.getAvaliacaoMat3Ano();
        this.educandosMock = [
          { id: '1', nome: 'Karen Ribeiro Fonseca', turma: '3ºA', serie: '3º Ano' },
          { id: '2', nome: 'Lucas Alves Monteiro', turma: '3ºA', serie: '3º Ano' },
          { id: '3', nome: 'Marina Pereira Moraes', turma: '3ºB', serie: '3º Ano' },
          { id: '4', nome: 'Nicolas Duarte Campos', turma: '3ºB', serie: '3º Ano' },
          { id: '5', nome: 'Olivia Ramos Nunes', turma: '3ºA', serie: '3º Ano' }
        ];
        break;
      case 'mat-ano-4':
        this.avaliacao = this.getAvaliacaoMat4Ano();
        this.educandosMock = [
          { id: '1', nome: 'Pedro Henrique Cunha', turma: '4ºA', serie: '4º Ano' },
          { id: '2', nome: 'Rafaela Nascimento Lima', turma: '4ºA', serie: '4º Ano' },
          { id: '3', nome: 'Samuel Barbosa Teixeira', turma: '4ºB', serie: '4º Ano' },
          { id: '4', nome: 'Tainá Correia Vaz', turma: '4ºB', serie: '4º Ano' },
          { id: '5', nome: 'Uriel Melo Cardoso', turma: '4ºA', serie: '4º Ano' }
        ];
        break;
      case 'mat-ano-5':
        this.avaliacao = this.getAvaliacaoMat5Ano();
        this.educandosMock = [
          { id: '1', nome: 'Valentina Sousa Reis', turma: '5ºA', serie: '5º Ano' },
          { id: '2', nome: 'Willian Figueiredo Paz', turma: '5ºA', serie: '5º Ano' },
          { id: '3', nome: 'Xuxa Araújo Castro', turma: '5ºB', serie: '5º Ano' },
          { id: '4', nome: 'Yasmin Borges Leite', turma: '5ºB', serie: '5º Ano' },
          { id: '5', nome: 'Zara Oliveira Pires', turma: '5ºA', serie: '5º Ano' }
        ];
        break;
      case 'mat-ano-6':
        this.avaliacao = this.getAvaliacaoMat6Ano();
        this.educandosMock = [
          { id: '1', nome: 'Arthur Tavares Nogueira', turma: '6ºA', serie: '6º Ano' },
          { id: '2', nome: 'Beatriz Mendes Castilho', turma: '6ºA', serie: '6º Ano' },
          { id: '3', nome: 'Caio Vieira Santana', turma: '6ºB', serie: '6º Ano' },
          { id: '4', nome: 'Diana Couto Marques', turma: '6ºB', serie: '6º Ano' },
          { id: '5', nome: 'Eduardo Pinto Rezende', turma: '6ºA', serie: '6º Ano' }
        ];
        break;
      case 'mat-ano-7':
        this.avaliacao = this.getAvaliacaoMat7Ano();
        this.educandosMock = [
          { id: '1', nome: 'Fernanda Guimarães Luz', turma: '7ºA', serie: '7º Ano' },
          { id: '2', nome: 'Gustavo Bastos Amaral', turma: '7ºA', serie: '7º Ano' },
          { id: '3', nome: 'Helena Carvalho Paiva', turma: '7ºB', serie: '7º Ano' },
          { id: '4', nome: 'Igor Nascimento Sá', turma: '7ºB', serie: '7º Ano' },
          { id: '5', nome: 'Julia Fontes Macedo', turma: '7ºA', serie: '7º Ano' }
        ];
        break;
      case 'mat-ano-8':
        this.avaliacao = this.getAvaliacaoMat8Ano();
        this.educandosMock = [
          { id: '1', nome: 'Kaique Azevedo Mota', turma: '8ºA', serie: '8º Ano' },
          { id: '2', nome: 'Larissa Rodrigues Gama', turma: '8ºA', serie: '8º Ano' },
          { id: '3', nome: 'Mateus Leal Silveira', turma: '8ºB', serie: '8º Ano' },
          { id: '4', nome: 'Nara Fonseca Bandeira', turma: '8ºB', serie: '8º Ano' },
          { id: '5', nome: 'Otávio Reis Abreu', turma: '8ºA', serie: '8º Ano' }
        ];
        break;
      case 'mat-ano-9':
        this.avaliacao = this.getAvaliacaoMat9Ano();
        this.educandosMock = [
          { id: '1', nome: 'Paula Corrêa Vilela', turma: '9ºA', serie: '9º Ano' },
          { id: '2', nome: 'Quartus Lima Gomes', turma: '9ºA', serie: '9º Ano' },
          { id: '3', nome: 'Rodrigo Almeida Britto', turma: '9ºB', serie: '9º Ano' },
          { id: '4', nome: 'Sofia Tenório Campos', turma: '9ºB', serie: '9º Ano' },
          { id: '5', nome: 'Thiago Moura Farinha', turma: '9ºA', serie: '9º Ano' }
        ];
        break;
      case 'ci-ano-1':
        this.avaliacao = this.getAvaliacaoCI1Ano();
        this.educandosMock = [
          { id: '1', nome: 'Ana Luiza Prado Silva', turma: '1ºA', serie: '1º Ano' },
          { id: '2', nome: 'Bruno Matos Ferreira', turma: '1ºA', serie: '1º Ano' },
          { id: '3', nome: 'Clara Souza Rocha', turma: '1ºB', serie: '1º Ano' },
          { id: '4', nome: 'Diego Alves Lima', turma: '1ºB', serie: '1º Ano' },
          { id: '5', nome: 'Elisa Ramos Neves', turma: '1ºA', serie: '1º Ano' }
        ];
        break;
      case 'ci-ano-2':
        this.avaliacao = this.getAvaliacaoCI2Ano();
        this.educandosMock = [
          { id: '1', nome: 'Fábio Carvalho Teixeira', turma: '2ºA', serie: '2º Ano' },
          { id: '2', nome: 'Giovanna Leal Duarte', turma: '2ºA', serie: '2º Ano' },
          { id: '3', nome: 'Henrique Dias Moraes', turma: '2ºB', serie: '2º Ano' },
          { id: '4', nome: 'Iara Pereira Campos', turma: '2ºB', serie: '2º Ano' },
          { id: '5', nome: 'Júlia Fontes Guimarães', turma: '2ºA', serie: '2º Ano' }
        ];
        break;
      case 'ci-ano-3':
        this.avaliacao = this.getAvaliacaoCI3Ano();
        this.educandosMock = [
          { id: '1', nome: 'Kevin Andrade Bastos', turma: '3ºA', serie: '3º Ano' },
          { id: '2', nome: 'Laura Correia Faria', turma: '3ºA', serie: '3º Ano' },
          { id: '3', nome: 'Marcos Vieira Britto', turma: '3ºB', serie: '3º Ano' },
          { id: '4', nome: 'Natália Borges Cunha', turma: '3ºB', serie: '3º Ano' },
          { id: '5', nome: 'Otávio Couto Mendes', turma: '3ºA', serie: '3º Ano' }
        ];
        break;
      case 'ci-ano-4':
        this.avaliacao = this.getAvaliacaoCI4Ano();
        this.educandosMock = [
          { id: '1', nome: 'Priscila Fonseca Lopes', turma: '4ºA', serie: '4º Ano' },
          { id: '2', nome: 'Quézia Monteiro Vaz', turma: '4ºA', serie: '4º Ano' },
          { id: '3', nome: 'Rodrigo Ribeiro Castro', turma: '4ºB', serie: '4º Ano' },
          { id: '4', nome: 'Sara Tavares Nogueira', turma: '4ºB', serie: '4º Ano' },
          { id: '5', nome: 'Tiago Luz Marques', turma: '4ºA', serie: '4º Ano' }
        ];
        break;
      case 'ci-ano-5':
        this.avaliacao = this.getAvaliacaoCI5Ano();
        this.educandosMock = [
          { id: '1', nome: 'Ursula Melo Santana', turma: '5ºA', serie: '5º Ano' },
          { id: '2', nome: 'Vinícius Paiva Cruz', turma: '5ºA', serie: '5º Ano' },
          { id: '3', nome: 'Wanda Reis Amaral', turma: '5ºB', serie: '5º Ano' },
          { id: '4', nome: 'Xavier Costa Pinto', turma: '5ºB', serie: '5º Ano' },
          { id: '5', nome: 'Yasmin Gomes Abreu', turma: '5ºA', serie: '5º Ano' }
        ];
        break;
      case 'ci-ano-6':
        this.avaliacao = this.getAvaliacaoCI6Ano();
        this.educandosMock = [
          { id: '1', nome: 'André Batista Mota', turma: '6ºA', serie: '6º Ano' },
          { id: '2', nome: 'Beatriz Sousa Cardoso', turma: '6ºA', serie: '6º Ano' },
          { id: '3', nome: 'Carlos Eduardo Leite', turma: '6ºB', serie: '6º Ano' },
          { id: '4', nome: 'Daniela Freitas Macedo', turma: '6ºB', serie: '6º Ano' },
          { id: '5', nome: 'Emerson Alves Paz', turma: '6ºA', serie: '6º Ano' }
        ];
        break;
      case 'ci-ano-7':
        this.avaliacao = this.getAvaliacaoCI7Ano();
        this.educandosMock = [
          { id: '1', nome: 'Fernanda Nunes Rezende', turma: '7ºA', serie: '7º Ano' },
          { id: '2', nome: 'Gabriel Pires Barros', turma: '7ºA', serie: '7º Ano' },
          { id: '3', nome: 'Heloísa Barbosa Queiroz', turma: '7ºB', serie: '7º Ano' },
          { id: '4', nome: 'Igor Nascimento Dias', turma: '7ºB', serie: '7º Ano' },
          { id: '5', nome: 'Joana Castilho Faria', turma: '7ºA', serie: '7º Ano' }
        ];
        break;
      case 'ci-ano-8':
        this.avaliacao = this.getAvaliacaoCI8Ano();
        this.educandosMock = [
          { id: '1', nome: 'Klaus Mendes Borges', turma: '8ºA', serie: '8º Ano' },
          { id: '2', nome: 'Laura Correia Silveira', turma: '8ºA', serie: '8º Ano' },
          { id: '3', nome: 'Murilo Araújo Teixeira', turma: '8ºB', serie: '8º Ano' },
          { id: '4', nome: 'Nina Vieira Campos', turma: '8ºB', serie: '8º Ano' },
          { id: '5', nome: 'Otávio Carvalho Leal', turma: '8ºA', serie: '8º Ano' }
        ];
        break;
      case 'ci-ano-9':
        this.avaliacao = this.getAvaliacaoCI9Ano();
        this.educandosMock = [
          { id: '1', nome: 'Pedro Augusto Ramos', turma: '9ºA', serie: '9º Ano' },
          { id: '2', nome: 'Quitéria Fonseca Lima', turma: '9ºA', serie: '9º Ano' },
          { id: '3', nome: 'Renata Guimarães Melo', turma: '9ºB', serie: '9º Ano' },
          { id: '4', nome: 'Sandro Paiva Duarte', turma: '9ºB', serie: '9º Ano' },
          { id: '5', nome: 'Talita Braga Moreira', turma: '9ºA', serie: '9º Ano' }
        ];
        break;
      case 'geo-ano-1':
        this.avaliacao = this.getAvaliacaoGEO1Ano();
        this.educandosMock = [
          { id: '1', nome: 'Alana Ribeiro Costa', turma: '1ºA', serie: '1º Ano' },
          { id: '2', nome: 'Bernardo Leite Faria', turma: '1ºA', serie: '1º Ano' },
          { id: '3', nome: 'Camila Souza Braga', turma: '1ºB', serie: '1º Ano' },
          { id: '4', nome: 'Davi Martins Nunes', turma: '1ºB', serie: '1º Ano' },
          { id: '5', nome: 'Ester Freitas Lima', turma: '1ºA', serie: '1º Ano' }
        ];
        break;
      case 'geo-ano-2':
        this.avaliacao = this.getAvaliacaoGEO2Ano();
        this.educandosMock = [
          { id: '1', nome: 'Felipe Gomes Andrade', turma: '2ºA', serie: '2º Ano' },
          { id: '2', nome: 'Giovanna Carvalho Pires', turma: '2ºA', serie: '2º Ano' },
          { id: '3', nome: 'Henrique Alves Mota', turma: '2ºB', serie: '2º Ano' },
          { id: '4', nome: 'Iara Dias Moraes', turma: '2ºB', serie: '2º Ano' },
          { id: '5', nome: 'Júlio Ferreira Cruz', turma: '2ºA', serie: '2º Ano' }
        ];
        break;
      case 'geo-ano-3':
        this.avaliacao = this.getAvaliacaoGEO3Ano();
        this.educandosMock = [
          { id: '1', nome: 'Karolina Bastos Rocha', turma: '3ºA', serie: '3º Ano' },
          { id: '2', nome: 'Lucas Pereira Dias', turma: '3ºA', serie: '3º Ano' },
          { id: '3', nome: 'Mariana Guimarães Luz', turma: '3ºB', serie: '3º Ano' },
          { id: '4', nome: 'Nathan Oliveira Ramos', turma: '3ºB', serie: '3º Ano' },
          { id: '5', nome: 'Olívia Costa Mendes', turma: '3ºA', serie: '3º Ano' }
        ];
        break;
      case 'geo-ano-4':
        this.avaliacao = this.getAvaliacaoGEO4Ano();
        this.educandosMock = [
          { id: '1', nome: 'Pedro Lopes Tavares', turma: '4ºA', serie: '4º Ano' },
          { id: '2', nome: 'Raquel Fonseca Teixeira', turma: '4ºA', serie: '4º Ano' },
          { id: '3', nome: 'Sérgio Borges Castilho', turma: '4ºB', serie: '4º Ano' },
          { id: '4', nome: 'Tatiane Nogueira Duarte', turma: '4ºB', serie: '4º Ano' },
          { id: '5', nome: 'Ulisses Melo Amaral', turma: '4ºA', serie: '4º Ano' }
        ];
        break;
      case 'geo-ano-5':
        this.avaliacao = this.getAvaliacaoGEO5Ano();
        this.educandosMock = [
          { id: '1', nome: 'Valentina Araújo Paz', turma: '5ºA', serie: '5º Ano' },
          { id: '2', nome: 'Wilson Pinto Vieira', turma: '5ºA', serie: '5º Ano' },
          { id: '3', nome: 'Xênia Barros Corrêa', turma: '5ºB', serie: '5º Ano' },
          { id: '4', nome: 'Yasmim Cardoso Reis', turma: '5ºB', serie: '5º Ano' },
          { id: '5', nome: 'Zander Lima Campos', turma: '5ºA', serie: '5º Ano' }
        ];
        break;
      case 'geo-ano-6':
        this.avaliacao = this.getAvaliacaoGEO6Ano();
        this.educandosMock = [
          { id: '1', nome: 'André Sousa Macedo', turma: '6ºA', serie: '6º Ano' },
          { id: '2', nome: 'Bruna Monteiro Carvalho', turma: '6ºA', serie: '6º Ano' },
          { id: '3', nome: 'César Batista Leal', turma: '6ºB', serie: '6º Ano' },
          { id: '4', nome: 'Débora Freitas Couto', turma: '6ºB', serie: '6º Ano' },
          { id: '5', nome: 'Eduardo Gomes Silva', turma: '6ºA', serie: '6º Ano' }
        ];
        break;
      case 'geo-ano-7':
        this.avaliacao = this.getAvaliacaoGEO7Ano();
        this.educandosMock = [
          { id: '1', nome: 'Fernanda Neves Paiva', turma: '7ºA', serie: '7º Ano' },
          { id: '2', nome: 'Gabriel Rodrigues Dias', turma: '7ºA', serie: '7º Ano' },
          { id: '3', nome: 'Heloísa Ribeiro Faria', turma: '7ºB', serie: '7º Ano' },
          { id: '4', nome: 'Igor Costa Marques', turma: '7ºB', serie: '7º Ano' },
          { id: '5', nome: 'Joana Melo Rezende', turma: '7ºA', serie: '7º Ano' }
        ];
        break;
      case 'geo-ano-8':
        this.avaliacao = this.getAvaliacaoGEO8Ano();
        this.educandosMock = [
          { id: '1', nome: 'Klaus Araújo Barros', turma: '8ºA', serie: '8º Ano' },
          { id: '2', nome: 'Lívia Pires Guimarães', turma: '8ºA', serie: '8º Ano' },
          { id: '3', nome: 'Murilo Vieira Moraes', turma: '8ºB', serie: '8º Ano' },
          { id: '4', nome: 'Nathalia Borges Cruz', turma: '8ºB', serie: '8º Ano' },
          { id: '5', nome: 'Orlando Corrêa Batista', turma: '8ºA', serie: '8º Ano' }
        ];
        break;
      case 'geo-ano-9':
        this.avaliacao = this.getAvaliacaoGEO9Ano();
        this.educandosMock = [
          { id: '1', nome: 'Paula Lopes Andrade', turma: '9ºA', serie: '9º Ano' },
          { id: '2', nome: 'Quirino Melo Tavares', turma: '9ºA', serie: '9º Ano' },
          { id: '3', nome: 'Renata Sousa Abreu', turma: '9ºB', serie: '9º Ano' },
          { id: '4', nome: 'Samuel Dias Castilho', turma: '9ºB', serie: '9º Ano' },
          { id: '5', nome: 'Taíse Fonseca Monteiro', turma: '9ºA', serie: '9º Ano' }
        ];
        break;
      case 'hist-ano-1':
        this.avaliacao = this.getAvaliacaoHIST1Ano();
        this.educandosMock = [
          { id: '1', nome: 'Ana Clara Ferreira', turma: '1ºA', serie: '1º Ano' },
          { id: '2', nome: 'Bruno Lima Santos', turma: '1ºA', serie: '1º Ano' },
          { id: '3', nome: 'Camila Rocha Pinto', turma: '1ºB', serie: '1º Ano' },
          { id: '4', nome: 'Daniel Souza Melo', turma: '1ºB', serie: '1º Ano' },
          { id: '5', nome: 'Elisa Gomes Neves', turma: '1ºA', serie: '1º Ano' }
        ];
        break;
      case 'hist-ano-2':
        this.avaliacao = this.getAvaliacaoHIST2Ano();
        this.educandosMock = [
          { id: '1', nome: 'Fábio Torres Cardoso', turma: '2ºA', serie: '2º Ano' },
          { id: '2', nome: 'Giovana Alves Cruz', turma: '2ºA', serie: '2º Ano' },
          { id: '3', nome: 'Heitor Mendes Barros', turma: '2ºB', serie: '2º Ano' },
          { id: '4', nome: 'Íris Cavalcanti Dias', turma: '2ºB', serie: '2º Ano' },
          { id: '5', nome: 'João Víctor Ramos', turma: '2ºA', serie: '2º Ano' }
        ];
        break;
      case 'hist-ano-3':
        this.avaliacao = this.getAvaliacaoHIST3Ano();
        this.educandosMock = [
          { id: '1', nome: 'Karen Leal Azevedo', turma: '3ºA', serie: '3º Ano' },
          { id: '2', nome: 'Leonardo Braga Faria', turma: '3ºA', serie: '3º Ano' },
          { id: '3', nome: 'Mariana Cunha Lopes', turma: '3ºB', serie: '3º Ano' },
          { id: '4', nome: 'Natã Silveira Campos', turma: '3ºB', serie: '3º Ano' },
          { id: '5', nome: 'Olívia Freitas Moura', turma: '3ºA', serie: '3º Ano' }
        ];
        break;
      case 'hist-ano-4':
        this.avaliacao = this.getAvaliacaoHIST4Ano();
        this.educandosMock = [
          { id: '1', nome: 'Paulo Ribeiro Teixeira', turma: '4ºA', serie: '4º Ano' },
          { id: '2', nome: 'Rebeca Vieira Castilho', turma: '4ºA', serie: '4º Ano' },
          { id: '3', nome: 'Sávio Costa Pereira', turma: '4ºB', serie: '4º Ano' },
          { id: '4', nome: 'Tainá Monteiro Rosa', turma: '4ºB', serie: '4º Ano' },
          { id: '5', nome: 'Ulisses Andrade Fonseca', turma: '4ºA', serie: '4º Ano' }
        ];
        break;
      case 'hist-ano-5':
        this.avaliacao = this.getAvaliacaoHIST5Ano();
        this.educandosMock = [
          { id: '1', nome: 'Valentina Sousa Lima', turma: '5ºA', serie: '5º Ano' },
          { id: '2', nome: 'Wagner Almeida Cruz', turma: '5ºA', serie: '5º Ano' },
          { id: '3', nome: 'Ximena Bastos Nunes', turma: '5ºB', serie: '5º Ano' },
          { id: '4', nome: 'Yago Correia Pires', turma: '5ºB', serie: '5º Ano' },
          { id: '5', nome: 'Zara Fernandes Melo', turma: '5ºA', serie: '5º Ano' }
        ];
        break;
      case 'hist-ano-6':
        this.avaliacao = this.getAvaliacaoHIST6Ano();
        this.educandosMock = [
          { id: '1', nome: 'Arthur Gonçalves Silva', turma: '6ºA', serie: '6º Ano' },
          { id: '2', nome: 'Beatriz Tavares Ramos', turma: '6ºA', serie: '6º Ano' },
          { id: '3', nome: 'Cauã Pinto Carvalho', turma: '6ºB', serie: '6º Ano' },
          { id: '4', nome: 'Débora Leal Oliveira', turma: '6ºB', serie: '6º Ano' },
          { id: '5', nome: 'Enzo Marques Barbosa', turma: '6ºA', serie: '6º Ano' }
        ];
        break;
      case 'hist-ano-7':
        this.avaliacao = this.getAvaliacaoHIST7Ano();
        this.educandosMock = [
          { id: '1', nome: 'Fernanda Araújo Duarte', turma: '7ºA', serie: '7º Ano' },
          { id: '2', nome: 'Gustavo Maia Teles', turma: '7ºA', serie: '7º Ano' },
          { id: '3', nome: 'Helena Dias Borges', turma: '7ºB', serie: '7º Ano' },
          { id: '4', nome: 'Igor Nascimento Faria', turma: '7ºB', serie: '7º Ano' },
          { id: '5', nome: 'Júlia Coelho Andrade', turma: '7ºA', serie: '7º Ano' }
        ];
        break;
      case 'hist-ano-8':
        this.avaliacao = this.getAvaliacaoHIST8Ano();
        this.educandosMock = [
          { id: '1', nome: 'Kevin Souza Torres', turma: '8ºA', serie: '8º Ano' },
          { id: '2', nome: 'Larissa Campos Moreira', turma: '8ºA', serie: '8º Ano' },
          { id: '3', nome: 'Murilo Freitas Azevedo', turma: '8ºB', serie: '8º Ano' },
          { id: '4', nome: 'Núbia Carvalho Lopes', turma: '8ºB', serie: '8º Ano' },
          { id: '5', nome: 'Otávio Pires Cunha', turma: '8ºA', serie: '8º Ano' }
        ];
        break;
      case 'hist-ano-9':
        this.avaliacao = this.getAvaliacaoHIST9Ano();
        this.educandosMock = [
          { id: '1', nome: 'Priscila Melo Guimarães', turma: '9ºA', serie: '9º Ano' },
          { id: '2', nome: 'Rafael Vieira Barros', turma: '9ºA', serie: '9º Ano' },
          { id: '3', nome: 'Sabrina Lima Rocha', turma: '9ºB', serie: '9º Ano' },
          { id: '4', nome: 'Thales Alves Costa', turma: '9ºB', serie: '9º Ano' },
          { id: '5', nome: 'Ursula Fonseca Braga', turma: '9ºA', serie: '9º Ano' }
        ];
        break;
    }
  }

  get hasCampos(): boolean {
    return !!this.avaliacao && this.avaliacao.camposAtuacao.length > 0;
  }

  get disciplinaBadge(): string {
    if (!this.avaliacao) return '';
    const icons: Record<string, string> = {
      'Língua Portuguesa': '📚',
      'Arte': '🎨',
      'Educação Física': '⚽',
      'Língua Inglesa': '🌍',
      'Matemática': '🔢',
      'Ciências': '🔬',
      'Geografia': '🗺️',
      'História': '🏛️'
    };
    const icon = icons[this.avaliacao.disciplina] ?? '📋';
    return `${icon} ${this.avaliacao.disciplina} · BNCC`;
  }

  getAvaliacaoLP12Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Língua Portuguesa',
      subtitulo: '1º e 2º Ano do Ensino Fundamental',
      disciplina: 'Língua Portuguesa',
      secoes: [
        {
          id: 'leitura',
          titulo: 'Leitura / Escuta',
          icone: '📖',
          criterios: [
            { id: 'decodificacao-fluencia', nome: 'Decodificação e fluência', descricao: 'Lê palavras e frases com precisão e ritmo adequado.', nivel: '' },
            { id: 'compreensao-textos', nome: 'Compreensão de textos', descricao: 'Entende o sentido global de textos curtos e identifica informações explícitas.', nivel: '' },
            { id: 'reconhecimento-generos', nome: 'Reconhecimento de gêneros', descricao: 'Identifica o tipo de texto (lista, convite, cantiga, quadrinha etc.) e sua finalidade.', nivel: '' },
            { id: 'leitura-compartilhada', nome: 'Leitura compartilhada', descricao: 'Participa da leitura com o professor e colegas, demonstrando envolvimento.', nivel: '' }
          ]
        },
        {
          id: 'escrita',
          titulo: 'Escrita',
          icone: '✍️',
          criterios: [
            { id: 'sistema-alfabetico', nome: 'Sistema alfabético', descricao: 'Relaciona fonemas e grafemas, escreve palavras e frases de forma alfabética.', nivel: '' },
            { id: 'ortografia-pontuacao', nome: 'Ortografia e pontuação', descricao: 'Usa letras maiúsculas, ponto final, interrogação e exclamação corretamente.', nivel: '' },
            { id: 'producao-textual', nome: 'Produção textual', descricao: 'Planeja e escreve textos curtos (bilhetes, listas, convites, relatos).', nivel: '' },
            { id: 'revisao-edicao', nome: 'Revisão e edição', descricao: 'Revisa o texto com ajuda do professor, corrigindo e aprimorando.', nivel: '' }
          ]
        },
        {
          id: 'oralidade',
          titulo: 'Oralidade',
          icone: '🗣️',
          criterios: [
            { id: 'expressao-oral', nome: 'Expressão oral', descricao: 'Fala com clareza, boa articulação e tom de voz adequado.', nivel: '' },
            { id: 'escuta-ativa', nome: 'Escuta ativa', descricao: 'Ouve atentamente e responde de forma pertinente.', nivel: '' },
            { id: 'participacao-conversas', nome: 'Participação em conversas', descricao: 'Respeita turnos de fala e usa formas de tratamento adequadas.', nivel: '' },
            { id: 'recitacao-canto', nome: 'Recitação e canto', descricao: 'Recita parlendas e canta cantigas com ritmo e entonação.', nivel: '' }
          ]
        },
        {
          id: 'analise-linguistica',
          titulo: 'Análise Linguística / Semiótica',
          icone: '🧠',
          criterios: [
            { id: 'reconhecimento-alfabeto', nome: 'Reconhecimento do alfabeto', descricao: 'Nomeia letras e distingue formatos (imprensa/cursiva, maiúsculas/minúsculas).', nivel: '' },
            { id: 'segmentacao-silabas', nome: 'Segmentação e sílabas', descricao: 'Separa palavras em sílabas e identifica sons iniciais, mediais e finais.', nivel: '' },
            { id: 'vocabulario', nome: 'Vocabulário', descricao: 'Identifica sinônimos, antônimos e forma aumentativos/diminutivos.', nivel: '' },
            { id: 'aspectos-graficos', nome: 'Aspectos gráficos', descricao: 'Reconhece sinais de pontuação e seus efeitos na entonação.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [
        { campo: 'Vida Cotidiana', generos: 'Listas, bilhetes, convites, receitas, cantigas', objetivo: 'Avaliar leitura e escrita de textos do cotidiano.' },
        { campo: 'Vida Pública', generos: 'Cartazes, regras, campanhas, notícias', objetivo: 'Desenvolver consciência cidadã e linguagem informativa.' },
        { campo: 'Estudo e Pesquisa', generos: 'Relatos, entrevistas, verbetes, diagramas', objetivo: 'Estimular curiosidade e práticas de investigação.' },
        { campo: 'Artístico-Literário', generos: 'Parlendas, quadrinhas, poemas, contos', objetivo: 'Promover fruição estética e formação do leitor literário.' }
      ],
      sintese: [
        { id: 'sintese-leitura', dimensao: 'Leitura', indicadores: 'Decodificação, compreensão, envolvimento', observacoes: '' },
        { id: 'sintese-escrita', dimensao: 'Escrita', indicadores: 'Planejamento, ortografia, adequação ao gênero', observacoes: '' },
        { id: 'sintese-oralidade', dimensao: 'Oralidade', indicadores: 'Clareza, escuta, participação', observacoes: '' },
        { id: 'sintese-analise', dimensao: 'Análise Linguística', indicadores: 'Segmentação, vocabulário, pontuação', observacoes: '' }
      ]
    };
  }

  getAvaliacaoLP35Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Língua Portuguesa',
      subtitulo: '3º, 4º e 5º Ano do Ensino Fundamental',
      disciplina: 'Língua Portuguesa',
      secoes: [
        {
          id: 'leitura',
          titulo: 'Leitura / Escuta',
          icone: '📖',
          criterios: [
            { id: 'fluencia', nome: 'Fluência', descricao: 'Lê textos em voz alta com autonomia e ritmo adequado.', nivel: '' },
            { id: 'compreensao-global', nome: 'Compreensão global', descricao: 'Identifica ideia central e recupera informações explícitas.', nivel: '' },
            { id: 'inferencia', nome: 'Inferência', descricao: 'Deduz informações implícitas e sentidos de palavras pelo contexto.', nivel: '' },
            { id: 'estrategias-leitura', nome: 'Estratégias de leitura', descricao: 'Relaciona partes do texto, reconhece pronomes anafóricos e coesão.', nivel: '' }
          ]
        },
        {
          id: 'escrita',
          titulo: 'Produção de Textos (Escrita)',
          icone: '✍️',
          criterios: [
            { id: 'ortografia-gramatica', nome: 'Ortografia e gramática', descricao: 'Aplica regras de ortografia, concordância e pontuação.', nivel: '' },
            { id: 'coesao-progressao', nome: 'Coesão e progressão', descricao: 'Usa pronomes, articuladores e organiza o texto em parágrafos.', nivel: '' },
            { id: 'adequacao-genero', nome: 'Adequação ao gênero', descricao: 'Produz textos conforme convenções (cartas, notícias, receitas, resenhas etc.).', nivel: '' },
            { id: 'recursos-digitais', nome: 'Uso de recursos digitais', descricao: 'Planeja e produz textos multimodais (vídeos, vlogs, tutoriais).', nivel: '' }
          ]
        },
        {
          id: 'oralidade',
          titulo: 'Oralidade',
          icone: '🗣️',
          criterios: [
            { id: 'participacao', nome: 'Participação', descricao: 'Reconhece e utiliza gêneros orais (debates, entrevistas, telejornais).', nivel: '' },
            { id: 'variedades-linguisticas', nome: 'Variedades linguísticas', descricao: 'Identifica e respeita diferentes variedades regionais e culturais.', nivel: '' },
            { id: 'expressao-oral', nome: 'Expressão oral', descricao: 'Argumenta com clareza, respeitando pontos de vista diferentes.', nivel: '' },
            { id: 'performances', nome: 'Performances', descricao: 'Produz apresentações, declamações e vídeos com entonação e expressão corporal adequadas.', nivel: '' }
          ]
        },
        {
          id: 'analise-linguistica',
          titulo: 'Análise Linguística / Semiótica',
          icone: '🧠',
          criterios: [
            { id: 'ortografia', nome: 'Ortografia', descricao: 'Usa corretamente acentuação, dígrafos e grafias regulares/irregulares.', nivel: '' },
            { id: 'morfossintaxe', nome: 'Morfossintaxe', descricao: 'Identifica substantivos, adjetivos, verbos e aplica concordância.', nivel: '' },
            { id: 'vocabulario', nome: 'Vocabulário', descricao: 'Reconhece palavras primitivas, derivadas, compostas e polissêmicas.', nivel: '' },
            { id: 'pontuacao', nome: 'Pontuação', descricao: 'Usa vírgula, ponto e vírgula, aspas, reticências e outros sinais com sentido adequado.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [
        { campo: 'Vida Cotidiana', generos: 'Cartas pessoais, diários, receitas, regras de jogos, piadas', objetivo: 'Avaliar escrita e leitura de textos do cotidiano.' },
        { campo: 'Vida Pública', generos: 'Notícias, reportagens, campanhas, cartas de leitor', objetivo: 'Desenvolver consciência cidadã e linguagem informativa.' },
        { campo: 'Estudo e Pesquisa', generos: 'Relatos, verbetes, gráficos, tabelas, infográficos', objetivo: 'Estimular investigação e produção científica escolar.' },
        { campo: 'Artístico-Literário', generos: 'Contos, poemas, quadrinhos, textos dramáticos', objetivo: 'Promover fruição estética e formação do leitor literário.' }
      ],
      sintese: [
        { id: 'sintese-leitura', dimensao: 'Leitura', indicadores: 'Fluência, compreensão, inferência', observacoes: '' },
        { id: 'sintese-escrita', dimensao: 'Escrita', indicadores: 'Ortografia, coesão, adequação ao gênero', observacoes: '' },
        { id: 'sintese-oralidade', dimensao: 'Oralidade', indicadores: 'Participação, clareza, respeito à diversidade', observacoes: '' },
        { id: 'sintese-analise', dimensao: 'Análise Linguística', indicadores: 'Morfossintaxe, vocabulário, pontuação', observacoes: '' }
      ]
    };
  }

  getAvaliacaoLP69Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Língua Portuguesa',
      subtitulo: '6º ao 9º Ano do Ensino Fundamental',
      disciplina: 'Língua Portuguesa',
      secoes: [
        {
          id: 'leitura',
          titulo: 'Leitura / Escuta',
          icone: '📖',
          criterios: [
            { id: 'compreensao-critica', nome: 'Compreensão crítica', descricao: 'Diferencia fato, opinião e discurso de ódio; identifica fake news.', nivel: '' },
            { id: 'estrategias-leitura', nome: 'Estratégias de leitura', descricao: 'Analisa contexto de produção, circulação e efeitos de sentido.', nivel: '' },
            { id: 'multiletramentos', nome: 'Multiletramentos', descricao: 'Interpreta textos multissemióticos (memes, charges, infográficos).', nivel: '' },
            { id: 'consciencia-cidada', nome: 'Consciência cidadã', descricao: 'Reconhece textos legais e normativos, compreendendo sua função social.', nivel: '' }
          ]
        },
        {
          id: 'escrita',
          titulo: 'Produção de Textos (Escrita)',
          icone: '✍️',
          criterios: [
            { id: 'adequacao-genero', nome: 'Adequação ao gênero', descricao: 'Produz notícias, reportagens, artigos de opinião, resenhas, campanhas.', nivel: '' },
            { id: 'planejamento-revisao', nome: 'Planejamento e revisão', descricao: 'Planeja, revisa e edita textos, ajustando ortografia, coesão e estilo.', nivel: '' },
            { id: 'recursos-digitais', nome: 'Uso de recursos digitais', descricao: 'Produz textos multimidiáticos (podcasts, vlogs, infográficos).', nivel: '' },
            { id: 'argumentacao', nome: 'Argumentação', descricao: 'Sustenta pontos de vista com clareza, coesão e progressão temática.', nivel: '' }
          ]
        },
        {
          id: 'oralidade',
          titulo: 'Oralidade',
          icone: '🗣️',
          criterios: [
            { id: 'participacao-debates', nome: 'Participação em debates', descricao: 'Argumenta oralmente em discussões, respeitando turnos e opiniões.', nivel: '' },
            { id: 'expressao-oral', nome: 'Expressão oral', descricao: 'Usa entonação, ritmo, gestualidade e postura adequadas.', nivel: '' },
            { id: 'producoes-orais', nome: 'Produções orais', descricao: 'Realiza apresentações, entrevistas, telejornais e podcasts.', nivel: '' },
            { id: 'consciencia-critica', nome: 'Consciência crítica', descricao: 'Refuta discursos de ódio e posiciona-se eticamente em debates.', nivel: '' }
          ]
        },
        {
          id: 'analise-linguistica',
          titulo: 'Análise Linguística / Semiótica',
          icone: '🧠',
          criterios: [
            { id: 'ortografia-pontuacao', nome: 'Ortografia e pontuação', descricao: 'Usa corretamente acentuação, sinais de pontuação e convenções gráficas.', nivel: '' },
            { id: 'coesao-coerencia', nome: 'Coesão e coerência', descricao: 'Emprega articuladores e operadores de conexão adequados.', nivel: '' },
            { id: 'recursos-estilisticos', nome: 'Recursos estilísticos', descricao: 'Analisa efeitos de sentido em textos jornalísticos, publicitários e literários.', nivel: '' },
            { id: 'modalizacao', nome: 'Modalização', descricao: 'Reconhece usos de obrigatoriedade, permissão e apreciação em textos legais e políticos.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [
        { campo: 'Jornalístico-midiático', generos: 'Notícias, reportagens, memes, charges, podcasts, vlogs', objetivo: 'Desenvolver leitura crítica e produção ética da informação.' },
        { campo: 'Vida Pública', generos: 'Estatutos, regimentos, cartas abertas, campanhas políticas', objetivo: 'Promover cidadania, direitos humanos e participação democrática.' },
        { campo: 'Estudo e Pesquisa', generos: 'Relatórios, artigos científicos, infográficos, verbetes', objetivo: 'Estimular investigação, análise de dados e divulgação científica.' },
        { campo: 'Artístico-literário', generos: 'Contos, crônicas, poemas, textos dramáticos', objetivo: 'Formar leitores críticos e sensíveis, valorizando diversidade cultural.' },
        { campo: 'Vida Cotidiana/Pessoal', generos: 'Cartas, diários, relatos, resenhas', objetivo: 'Ampliar autonomia e protagonismo nas práticas sociais.' }
      ],
      sintese: [
        { id: 'sintese-leitura', dimensao: 'Leitura', indicadores: 'Compreensão crítica, multiletramentos, análise de fake news', observacoes: '' },
        { id: 'sintese-escrita', dimensao: 'Escrita', indicadores: 'Planejamento, revisão, adequação ao gênero', observacoes: '' },
        { id: 'sintese-oralidade', dimensao: 'Oralidade', indicadores: 'Participação em debates, produções orais', observacoes: '' },
        { id: 'sintese-analise', dimensao: 'Análise Linguística', indicadores: 'Ortografia, coesão, modalização', observacoes: '' }
      ]
    };
  }

  getAvaliacaoArte15Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Arte',
      subtitulo: '1º ao 5º Ano do Ensino Fundamental',
      disciplina: 'Arte',
      secoes: [
        {
          id: 'artes-visuais',
          titulo: 'Artes Visuais',
          icone: '🎨',
          criterios: [
            { id: 'percepcao-estetica', nome: 'Percepção estética', descricao: 'Identifica e aprecia diferentes formas de artes visuais.', nivel: '' },
            { id: 'elementos-visuais', nome: 'Elementos visuais', descricao: 'Reconhece ponto, linha, forma, cor, espaço e movimento.', nivel: '' },
            { id: 'experimentacao', nome: 'Experimentação', descricao: 'Explora técnicas variadas (desenho, pintura, colagem, escultura etc.).', nivel: '' },
            { id: 'criacao-coletiva', nome: 'Criação coletiva', descricao: 'Produz trabalhos individuais e colaborativos, dialogando com colegas.', nivel: '' }
          ]
        },
        {
          id: 'danca',
          titulo: 'Dança',
          icone: '💃',
          criterios: [
            { id: 'repertorio-corporal', nome: 'Repertório corporal', descricao: 'Reconhece e aprecia diferentes manifestações da dança.', nivel: '' },
            { id: 'movimento', nome: 'Movimento', descricao: 'Explora deslocamentos, planos, direções e ritmos variados.', nivel: '' },
            { id: 'criacao-danca', nome: 'Criação', descricao: 'Cria e improvisa movimentos individuais e coletivos.', nivel: '' },
            { id: 'respeito-dialogo', nome: 'Respeito e diálogo', descricao: 'Compartilha experiências pessoais e coletivas sem preconceito.', nivel: '' }
          ]
        },
        {
          id: 'musica',
          titulo: 'Música',
          icone: '🎵',
          criterios: [
            { id: 'apreciacao-musical', nome: 'Apreciação musical', descricao: 'Reconhece diferentes gêneros e funções da música.', nivel: '' },
            { id: 'elementos-musicais', nome: 'Elementos musicais', descricao: 'Explora altura, intensidade, timbre, melodia e ritmo.', nivel: '' },
            { id: 'fontes-sonoras', nome: 'Fontes sonoras', descricao: 'Utiliza corpo, natureza e objetos como instrumentos.', nivel: '' },
            { id: 'criacao-musical', nome: 'Criação musical', descricao: 'Experimenta improvisações, composições e sonorização de histórias.', nivel: '' }
          ]
        },
        {
          id: 'teatro',
          titulo: 'Teatro',
          icone: '🎭',
          criterios: [
            { id: 'apreciacao-teatral', nome: 'Apreciação teatral', descricao: 'Reconhece e aprecia diferentes manifestações do teatro.', nivel: '' },
            { id: 'teatralidade-cotidiana', nome: 'Teatralidade cotidiana', descricao: 'Identifica elementos teatrais em situações do dia a dia.', nivel: '' },
            { id: 'improvisacao', nome: 'Improvisação', descricao: 'Participa de jogos e encenações coletivas e criativas.', nivel: '' },
            { id: 'criacao-personagens', nome: 'Criação de personagens', descricao: 'Explora movimento e voz na construção de personagens.', nivel: '' }
          ]
        },
        {
          id: 'artes-integradas',
          titulo: 'Artes Integradas',
          icone: '🌐',
          criterios: [
            { id: 'interculturalidade', nome: 'Interculturalidade', descricao: 'Valoriza brinquedos, jogos, danças e histórias de diferentes culturas.', nivel: '' },
            { id: 'patrimonio-cultural', nome: 'Patrimônio cultural', descricao: 'Reconhece e valoriza o patrimônio material e imaterial brasileiro.', nivel: '' },
            { id: 'tecnologias-digitais', nome: 'Tecnologias digitais', descricao: 'Explora recursos digitais (vídeo, fotografia, softwares, animações).', nivel: '' },
            { id: 'projetos-integrados', nome: 'Projetos integrados', descricao: 'Participa de produções que articulam diferentes linguagens artísticas.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sintese-criacao', dimensao: 'Criação', indicadores: 'Produção artística individual e coletiva', observacoes: '' },
        { id: 'sintese-critica', dimensao: 'Crítica', indicadores: 'Reflexão sobre manifestações culturais', observacoes: '' },
        { id: 'sintese-estesia', dimensao: 'Estesia', indicadores: 'Sensibilidade e percepção corporal/visual', observacoes: '' },
        { id: 'sintese-expressao', dimensao: 'Expressão', indicadores: 'Exteriorização de ideias e sentimentos', observacoes: '' },
        { id: 'sintese-fruicao', dimensao: 'Fruição', indicadores: 'Apreciação estética e prazer artístico', observacoes: '' },
        { id: 'sintese-reflexao', dimensao: 'Reflexão', indicadores: 'Argumentação e análise crítica', observacoes: '' }
      ]
    };
  }

  getAvaliacaoArte69Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Arte',
      subtitulo: '6º ao 9º Ano do Ensino Fundamental',
      disciplina: 'Arte',
      secoes: [
        {
          id: 'artes-visuais',
          titulo: 'Artes Visuais',
          icone: '🎨',
          criterios: [
            { id: 'apreciacao-critica', nome: 'Apreciação crítica', descricao: 'Analisa obras tradicionais e contemporâneas em diferentes contextos.', nivel: '' },
            { id: 'elementos-visuais', nome: 'Elementos visuais', descricao: 'Reconhece e utiliza ponto, linha, forma, cor, espaço, movimento etc.', nivel: '' },
            { id: 'experimentacao', nome: 'Experimentação', descricao: 'Produz trabalhos variados (desenho, pintura, escultura, fotografia, performance).', nivel: '' },
            { id: 'processo-criativo', nome: 'Processo criativo', descricao: 'Desenvolve projetos individuais e coletivos com materiais convencionais e digitais.', nivel: '' }
          ]
        },
        {
          id: 'danca',
          titulo: 'Dança',
          icone: '💃',
          criterios: [
            { id: 'apreciacao-danca', nome: 'Apreciação', descricao: 'Reconhece e valoriza diferentes estilos e matrizes culturais da dança.', nivel: '' },
            { id: 'elementos-movimento', nome: 'Elementos do movimento', descricao: 'Explora tempo, peso, fluência e espaço no movimento dançado.', nivel: '' },
            { id: 'criacao-improvisacao', nome: 'Criação e improvisação', descricao: 'Cria vocabulários próprios e composições autorais.', nivel: '' },
            { id: 'reflexao-critica', nome: 'Reflexão crítica', descricao: 'Discute experiências pessoais e coletivas, problematizando estereótipos.', nivel: '' }
          ]
        },
        {
          id: 'musica',
          titulo: 'Música',
          icone: '🎵',
          criterios: [
            { id: 'apreciacao-musical', nome: 'Apreciação musical', descricao: 'Analisa usos e funções da música em diferentes contextos sociais e culturais.', nivel: '' },
            { id: 'elementos-musicais', nome: 'Elementos musicais', descricao: 'Explora altura, intensidade, timbre, melodia e ritmo.', nivel: '' },
            { id: 'criacao-musical', nome: 'Criação musical', descricao: 'Produz improvisações, composições, arranjos e trilhas sonoras.', nivel: '' },
            { id: 'tecnologias-musicais', nome: 'Tecnologias musicais', descricao: 'Utiliza registros gráficos, partituras e recursos digitais de áudio e vídeo.', nivel: '' }
          ]
        },
        {
          id: 'teatro',
          titulo: 'Teatro',
          icone: '🎭',
          criterios: [
            { id: 'apreciacao-teatral', nome: 'Apreciação teatral', descricao: 'Reconhece estilos cênicos e aprecia produções nacionais e internacionais.', nivel: '' },
            { id: 'elementos-cenicos', nome: 'Elementos cênicos', descricao: 'Explora figurinos, cenários, iluminação e sonoplastia.', nivel: '' },
            { id: 'criacao-coletiva', nome: 'Criação coletiva', descricao: 'Participa de improvisações e jogos teatrais colaborativos.', nivel: '' },
            { id: 'personagens-dramaturgia', nome: 'Personagens e dramaturgia', descricao: 'Cria personagens e composições cênicas com criatividade e reflexão crítica.', nivel: '' }
          ]
        },
        {
          id: 'artes-integradas',
          titulo: 'Artes Integradas',
          icone: '🌐',
          criterios: [
            { id: 'interdisciplinaridade', nome: 'Interdisciplinaridade', descricao: 'Relaciona práticas artísticas às dimensões sociais, culturais e políticas.', nivel: '' },
            { id: 'projetos-integrados', nome: 'Projetos integrados', descricao: 'Participa de produções que articulam diferentes linguagens artísticas.', nivel: '' },
            { id: 'patrimonio-cultural', nome: 'Patrimônio cultural', descricao: 'Valoriza patrimônio material e imaterial, especialmente o brasileiro.', nivel: '' },
            { id: 'tecnologias-digitais', nome: 'Tecnologias digitais', descricao: 'Utiliza recursos digitais para criar, registrar e compartilhar produções artísticas.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sintese-criacao', dimensao: 'Criação', indicadores: 'Produção artística individual e coletiva', observacoes: '' },
        { id: 'sintese-critica', dimensao: 'Crítica', indicadores: 'Reflexão sobre manifestações culturais', observacoes: '' },
        { id: 'sintese-estesia', dimensao: 'Estesia', indicadores: 'Sensibilidade e percepção corporal/visual', observacoes: '' },
        { id: 'sintese-expressao', dimensao: 'Expressão', indicadores: 'Exteriorização de ideias e sentimentos', observacoes: '' },
        { id: 'sintese-fruicao', dimensao: 'Fruição', indicadores: 'Apreciação estética e prazer artístico', observacoes: '' },
        { id: 'sintese-reflexao', dimensao: 'Reflexão', indicadores: 'Argumentação e análise crítica', observacoes: '' }
      ]
    };
  }

  getAvaliacaoEF12Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Educação Física',
      subtitulo: '1º e 2º Ano do Ensino Fundamental',
      disciplina: 'Educação Física',
      secoes: [
        {
          id: 'brincadeiras-jogos',
          titulo: 'Brincadeiras e Jogos',
          icone: '🎲',
          criterios: [
            { id: 'ef12-bj1', nome: 'Recriação de brincadeiras', descricao: 'Experimenta e recria brincadeiras populares locais.', nivel: '' },
            { id: 'ef12-bj2', nome: 'Expressão por linguagens', descricao: 'Explica brincadeiras por múltiplas linguagens (oral, escrita, corporal).', nivel: '' },
            { id: 'ef12-bj3', nome: 'Planejamento estratégico', descricao: 'Planeja estratégias para resolver desafios em jogos.', nivel: '' },
            { id: 'ef12-bj4', nome: 'Colaboração comunitária', descricao: 'Colabora na divulgação de brincadeiras na escola e comunidade.', nivel: '' }
          ]
        },
        {
          id: 'esportes',
          titulo: 'Esportes',
          icone: '🏅',
          criterios: [
            { id: 'ef12-es1', nome: 'Experimentação esportiva', descricao: 'Experimenta esportes de marca e precisão.', nivel: '' },
            { id: 'ef12-es2', nome: 'Respeito às normas', descricao: 'Respeita normas e regras para garantir a segurança.', nivel: '' }
          ]
        },
        {
          id: 'ginastica',
          titulo: 'Ginástica',
          icone: '🤸',
          criterios: [
            { id: 'ef12-gi1', nome: 'Elementos básicos', descricao: 'Experimenta elementos básicos (saltos, giros, equilíbrios).', nivel: '' },
            { id: 'ef12-gi2', nome: 'Estratégias de execução', descricao: 'Planeja estratégias para execução segura dos movimentos.', nivel: '' },
            { id: 'ef12-gi3', nome: 'Autoconhecimento corporal', descricao: 'Reconhece limites e potencialidades do próprio corpo.', nivel: '' }
          ]
        },
        {
          id: 'danca',
          titulo: 'Dança',
          icone: '💃',
          criterios: [
            { id: 'ef12-da1', nome: 'Danças regionais', descricao: 'Experimenta e recria danças comunitárias e regionais.', nivel: '' },
            { id: 'ef12-da2', nome: 'Elementos da dança', descricao: 'Identifica ritmo, espaço e gestos nas danças.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-bj', dimensao: 'Brincadeiras/Jogos', indicadores: 'Participação, criatividade, respeito às culturas', observacoes: '' },
        { id: 'sint-es', dimensao: 'Esportes', indicadores: 'Cooperação, respeito às regras, protagonismo', observacoes: '' },
        { id: 'sint-gi', dimensao: 'Ginástica', indicadores: 'Coordenação, segurança, limites corporais', observacoes: '' },
        { id: 'sint-da', dimensao: 'Dança', indicadores: 'Expressividade, respeito cultural, ritmo', observacoes: '' }
      ]
    };
  }

  getAvaliacaoEF35Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Educação Física',
      subtitulo: '3º ao 5º Ano do Ensino Fundamental',
      disciplina: 'Educação Física',
      secoes: [
        {
          id: 'brincadeiras-jogos',
          titulo: 'Brincadeiras e Jogos',
          icone: '🎲',
          criterios: [
            { id: 'ef35-bj1', nome: 'Jogos do Brasil e do mundo', descricao: 'Experimenta e recria jogos populares do Brasil e do mundo.', nivel: '' },
            { id: 'ef35-bj2', nome: 'Participação segura', descricao: 'Planeja estratégias para participação segura nos jogos.', nivel: '' },
            { id: 'ef35-bj3', nome: 'Múltiplas linguagens', descricao: 'Explica jogos por múltiplas linguagens.', nivel: '' },
            { id: 'ef35-bj4', nome: 'Patrimônio cultural', descricao: 'Valoriza o patrimônio cultural das brincadeiras.', nivel: '' }
          ]
        },
        {
          id: 'esportes',
          titulo: 'Esportes',
          icone: '🏅',
          criterios: [
            { id: 'ef35-es1', nome: 'Modalidades esportivas', descricao: 'Experimenta esportes de campo e taco, rede/parede e invasão.', nivel: '' },
            { id: 'ef35-es2', nome: 'Jogo vs. esporte', descricao: 'Diferencia jogo e esporte, reconhecendo suas manifestações.', nivel: '' }
          ]
        },
        {
          id: 'ginastica',
          titulo: 'Ginástica',
          icone: '🤸',
          criterios: [
            { id: 'ef35-gi1', nome: 'Ginástica geral', descricao: 'Experimenta combinações de elementos da ginástica geral.', nivel: '' },
            { id: 'ef35-gi2', nome: 'Apresentações coletivas', descricao: 'Planeja estratégias para apresentações coletivas.', nivel: '' }
          ]
        },
        {
          id: 'danca',
          titulo: 'Dança',
          icone: '💃',
          criterios: [
            { id: 'ef35-da1', nome: 'Danças populares', descricao: 'Experimenta danças populares do Brasil e do mundo.', nivel: '' },
            { id: 'ef35-da2', nome: 'Elementos constitutivos', descricao: 'Compara elementos constitutivos das danças (ritmo, espaço, gestos).', nivel: '' },
            { id: 'ef35-da3', nome: 'Combate ao preconceito', descricao: 'Identifica situações de preconceito na dança e discute alternativas.', nivel: '' }
          ]
        },
        {
          id: 'lutas',
          titulo: 'Lutas',
          icone: '🥋',
          criterios: [
            { id: 'ef35-lu1', nome: 'Lutas comunitárias', descricao: 'Experimenta e recria lutas comunitárias e de matriz indígena/africana.', nivel: '' },
            { id: 'ef35-lu2', nome: 'Estratégias e segurança', descricao: 'Planeja estratégias básicas respeitando normas de segurança.', nivel: '' },
            { id: 'ef35-lu3', nome: 'Luta vs. briga', descricao: 'Diferencia lutas de brigas e outras práticas corporais.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-bj', dimensao: 'Brincadeiras/Jogos', indicadores: 'Participação, criatividade, respeito às culturas', observacoes: '' },
        { id: 'sint-es', dimensao: 'Esportes', indicadores: 'Cooperação, respeito às regras, protagonismo', observacoes: '' },
        { id: 'sint-gi', dimensao: 'Ginástica', indicadores: 'Coordenação, segurança, limites corporais', observacoes: '' },
        { id: 'sint-da', dimensao: 'Dança', indicadores: 'Expressividade, respeito cultural, ritmo', observacoes: '' },
        { id: 'sint-lu', dimensao: 'Lutas', indicadores: 'Estratégia, respeito ao oponente, segurança', observacoes: '' }
      ]
    };
  }

  getAvaliacaoEF67Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Educação Física',
      subtitulo: '6º e 7º Ano do Ensino Fundamental',
      disciplina: 'Educação Física',
      secoes: [
        {
          id: 'brincadeiras-jogos',
          titulo: 'Brincadeiras e Jogos',
          icone: '🎮',
          criterios: [
            { id: 'ef67-bj1', nome: 'Jogos eletrônicos', descricao: 'Experimenta e respeita diferentes jogos eletrônicos.', nivel: '' },
            { id: 'ef67-bj2', nome: 'Transformações tecnológicas', descricao: 'Identifica transformações dos jogos eletrônicos com base nas tecnologias.', nivel: '' }
          ]
        },
        {
          id: 'esportes',
          titulo: 'Esportes',
          icone: '🏅',
          criterios: [
            { id: 'ef67-es1', nome: 'Experimentação esportiva', descricao: 'Experimenta esportes de marca, precisão, invasão e técnico-combinatórios.', nivel: '' },
            { id: 'ef67-es2', nome: 'Regras e habilidades básicas', descricao: 'Pratica esportes respeitando regras e habilidades básicas.', nivel: '' },
            { id: 'ef67-es3', nome: 'Estratégias técnico-táticas', descricao: 'Planeja estratégias para desafios técnico-táticos.', nivel: '' },
            { id: 'ef67-es4', nome: 'Análise histórica e social', descricao: 'Analisa transformações históricas e sociais dos esportes.', nivel: '' }
          ]
        },
        {
          id: 'ginastica',
          titulo: 'Ginástica',
          icone: '🤸',
          criterios: [
            { id: 'ef67-gi1', nome: 'Exercícios físicos variados', descricao: 'Experimenta exercícios físicos variados (força, resistência, flexibilidade).', nivel: '' },
            { id: 'ef67-gi2', nome: 'Exercício vs. atividade física', descricao: 'Diferencia exercício físico de atividade física.', nivel: '' }
          ]
        },
        {
          id: 'danca',
          titulo: 'Danças',
          icone: '💃',
          criterios: [
            { id: 'ef67-da1', nome: 'Danças urbanas', descricao: 'Experimenta e recria danças urbanas.', nivel: '' },
            { id: 'ef67-da2', nome: 'Aprendizagem das danças', descricao: 'Planeja estratégias para aprender elementos das danças urbanas.', nivel: '' },
            { id: 'ef67-da3', nome: 'Diferenciação de manifestações', descricao: 'Diferencia danças urbanas de outras manifestações.', nivel: '' }
          ]
        },
        {
          id: 'lutas',
          titulo: 'Lutas',
          icone: '🥋',
          criterios: [
            { id: 'ef67-lu1', nome: 'Lutas do Brasil', descricao: 'Experimenta e recria lutas do Brasil.', nivel: '' },
            { id: 'ef67-lu2', nome: 'Estratégias e segurança', descricao: 'Planeja estratégias básicas respeitando segurança.', nivel: '' },
            { id: 'ef67-lu3', nome: 'Códigos e rituais', descricao: 'Identifica códigos, rituais e elementos técnico-táticos das lutas.', nivel: '' }
          ]
        },
        {
          id: 'aventura',
          titulo: 'Práticas Corporais de Aventura',
          icone: '🧗',
          criterios: [
            { id: 'ef67-av1', nome: 'Práticas urbanas', descricao: 'Experimenta práticas urbanas com segurança.', nivel: '' },
            { id: 'ef67-av2', nome: 'Riscos e superação', descricao: 'Identifica riscos e planeja estratégias de superação.', nivel: '' },
            { id: 'ef67-av3', nome: 'Respeito ao patrimônio', descricao: 'Respeita patrimônio público e recria práticas corporais urbanas.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-bj', dimensao: 'Brincadeiras/Jogos', indicadores: 'Participação, respeito cultural, criatividade', observacoes: '' },
        { id: 'sint-es', dimensao: 'Esportes', indicadores: 'Cooperação, protagonismo, análise crítica', observacoes: '' },
        { id: 'sint-gi', dimensao: 'Ginástica', indicadores: 'Condicionamento físico, consciência corporal', observacoes: '' },
        { id: 'sint-da', dimensao: 'Danças', indicadores: 'Expressividade, respeito cultural, ritmo', observacoes: '' },
        { id: 'sint-lu', dimensao: 'Lutas', indicadores: 'Estratégia, segurança, respeito ao oponente', observacoes: '' },
        { id: 'sint-av', dimensao: 'Práticas de Aventura', indicadores: 'Segurança, respeito ao ambiente, autonomia', observacoes: '' }
      ]
    };
  }

  getAvaliacaoEF89Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Educação Física',
      subtitulo: '8º e 9º Ano do Ensino Fundamental',
      disciplina: 'Educação Física',
      secoes: [
        {
          id: 'esportes',
          titulo: 'Esportes',
          icone: '🏅',
          criterios: [
            { id: 'ef89-es1', nome: 'Diferentes papéis esportivos', descricao: 'Experimenta diferentes papéis (jogador, árbitro, técnico).', nivel: '' },
            { id: 'ef89-es2', nome: 'Modalidades variadas', descricao: 'Pratica esportes de rede/parede, campo e taco, invasão e combate.', nivel: '' },
            { id: 'ef89-es3', nome: 'Estratégias técnico-táticas', descricao: 'Formula estratégias técnico-táticas.', nivel: '' },
            { id: 'ef89-es4', nome: 'Sistemas de jogo e regras', descricao: 'Identifica sistemas de jogo e regras.', nivel: '' },
            { id: 'ef89-es5', nome: 'Problemas do esporte', descricao: 'Analisa problemas do esporte (doping, violência, corrupção).', nivel: '' }
          ]
        },
        {
          id: 'ginastica',
          titulo: 'Ginástica',
          icone: '🤸',
          criterios: [
            { id: 'ef89-gi1', nome: 'Condicionamento e consciência corporal', descricao: 'Experimenta programas de condicionamento físico e conscientização corporal.', nivel: '' },
            { id: 'ef89-gi2', nome: 'Padrões de saúde e beleza', descricao: 'Discute padrões de saúde, beleza e desempenho.', nivel: '' },
            { id: 'ef89-gi3', nome: 'Diferenciação de ginásticas', descricao: 'Diferencia ginástica de condicionamento e conscientização corporal.', nivel: '' }
          ]
        },
        {
          id: 'danca',
          titulo: 'Danças',
          icone: '💃',
          criterios: [
            { id: 'ef89-da1', nome: 'Danças de salão', descricao: 'Experimenta e recria danças de salão.', nivel: '' },
            { id: 'ef89-da2', nome: 'Aprendizagem das danças', descricao: 'Planeja estratégias para aprender elementos das danças.', nivel: '' },
            { id: 'ef89-da3', nome: 'Transformações históricas e culturais', descricao: 'Analisa transformações históricas e culturais das danças.', nivel: '' }
          ]
        },
        {
          id: 'lutas',
          titulo: 'Lutas',
          icone: '🥋',
          criterios: [
            { id: 'ef89-lu1', nome: 'Lutas do mundo', descricao: 'Experimenta lutas do mundo com segurança.', nivel: '' },
            { id: 'ef89-lu2', nome: 'Estratégias técnico-táticas', descricao: 'Planeja estratégias técnico-táticas.', nivel: '' },
            { id: 'ef89-lu3', nome: 'Esportivização e mídia', descricao: 'Analisa esportivização e midiatização das lutas.', nivel: '' }
          ]
        },
        {
          id: 'aventura',
          titulo: 'Práticas Corporais de Aventura',
          icone: '🧗',
          criterios: [
            { id: 'ef89-av1', nome: 'Práticas na natureza', descricao: 'Experimenta práticas na natureza com segurança.', nivel: '' },
            { id: 'ef89-av2', nome: 'Riscos e ambiente natural', descricao: 'Identifica riscos e respeita o ambiente natural.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-es', dimensao: 'Esportes', indicadores: 'Cooperação, protagonismo, análise crítica', observacoes: '' },
        { id: 'sint-gi', dimensao: 'Ginástica', indicadores: 'Condicionamento físico, consciência corporal', observacoes: '' },
        { id: 'sint-da', dimensao: 'Danças', indicadores: 'Expressividade, respeito cultural, ritmo', observacoes: '' },
        { id: 'sint-lu', dimensao: 'Lutas', indicadores: 'Estratégia, segurança, respeito ao oponente', observacoes: '' },
        { id: 'sint-av', dimensao: 'Práticas de Aventura', indicadores: 'Segurança, respeito ao ambiente, autonomia', observacoes: '' }
      ]
    };
  }

  getAvaliacaoLI6Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Língua Inglesa',
      subtitulo: '6º Ano do Ensino Fundamental',
      disciplina: 'Língua Inglesa',
      secoes: [
        {
          id: 'oralidade',
          titulo: 'Eixo Oralidade',
          icone: '🗣️',
          criterios: [
            { id: 'li6-or1', nome: 'Interação oral', descricao: 'Participa de situações de intercâmbio oral, demonstrando iniciativa.', nivel: '' },
            { id: 'li6-or2', nome: 'Informações pessoais', descricao: 'Pergunta e responde sobre família, amigos, escola e comunidade.', nivel: '' },
            { id: 'li6-or3', nome: 'Compreensão oral', descricao: 'Reconhece assunto principal em textos orais com apoio de cognatos e contexto.', nivel: '' },
            { id: 'li6-or4', nome: 'Produção oral', descricao: 'Fala sobre si e outros, descrevendo gostos, preferências e rotinas.', nivel: '' },
            { id: 'li6-or5', nome: 'Apresentações', descricao: 'Planeja e apresenta oralmente sobre família, comunidade e escola.', nivel: '' }
          ]
        },
        {
          id: 'leitura',
          titulo: 'Eixo Leitura',
          icone: '📖',
          criterios: [
            { id: 'li6-le1', nome: 'Estratégias de leitura', descricao: 'Formula hipóteses sobre finalidade de textos em inglês.', nivel: '' },
            { id: 'li6-le2', nome: 'Compreensão geral', descricao: 'Identifica assunto e organização textual.', nivel: '' },
            { id: 'li6-le3', nome: 'Informações específicas', descricao: 'Localiza dados pontuais em textos.', nivel: '' },
            { id: 'li6-le4', nome: 'Repertório lexical', descricao: 'Usa dicionário bilíngue e aplicativos para ampliar vocabulário.', nivel: '' },
            { id: 'li6-le5', nome: 'Atitude leitora', descricao: 'Demonstra interesse e compartilha ideias sobre textos lidos.', nivel: '' }
          ]
        },
        {
          id: 'escrita',
          titulo: 'Eixo Escrita',
          icone: '✍️',
          criterios: [
            { id: 'li6-es1', nome: 'Planejamento', descricao: 'Lista e organiza ideias antes da escrita.', nivel: '' },
            { id: 'li6-es2', nome: 'Produção textual', descricao: 'Escreve textos simples (cartazes, quadrinhos, blogs, agendas) sobre temas familiares.', nivel: '' },
            { id: 'li6-es3', nome: 'Mediação', descricao: 'Produz textos com apoio do professor/colegas.', nivel: '' }
          ]
        },
        {
          id: 'linguisticos',
          titulo: 'Eixo Conhecimentos Linguísticos',
          icone: '🧠',
          criterios: [
            { id: 'li6-li1', nome: 'Vocabulário', descricao: 'Constrói repertório lexical sobre temas familiares.', nivel: '' },
            { id: 'li6-li2', nome: 'Pronúncia', descricao: 'Reconhece semelhanças e diferenças entre inglês e língua materna.', nivel: '' },
            { id: 'li6-li3', nome: 'Gramática', descricao: 'Usa presente simples e contínuo, imperativo, caso genitivo (\'s) e adjetivos possessivos.', nivel: '' }
          ]
        },
        {
          id: 'intercultural',
          titulo: 'Eixo Dimensão Intercultural',
          icone: '🌍',
          criterios: [
            { id: 'li6-ic1', nome: 'Inglês no mundo', descricao: 'Reconhece países que têm inglês como língua materna/oficial.', nivel: '' },
            { id: 'li6-ic2', nome: 'Inglês no cotidiano', descricao: 'Identifica presença da língua inglesa na sociedade brasileira/comunidade.', nivel: '' },
            { id: 'li6-ic3', nome: 'Reflexão cultural', descricao: 'Avalia criticamente produtos culturais de países de língua inglesa.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-or', dimensao: 'Oralidade', indicadores: 'Interação, compreensão, produção oral', observacoes: '' },
        { id: 'sint-le', dimensao: 'Leitura', indicadores: 'Estratégias, compreensão, vocabulário', observacoes: '' },
        { id: 'sint-es', dimensao: 'Escrita', indicadores: 'Planejamento, produção textual', observacoes: '' },
        { id: 'sint-li', dimensao: 'Conhecimentos Linguísticos', indicadores: 'Gramática, pronúncia, vocabulário', observacoes: '' },
        { id: 'sint-ic', dimensao: 'Interculturalidade', indicadores: 'Reflexão cultural, presença do inglês', observacoes: '' }
      ]
    };
  }

  getAvaliacaoLI7Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Língua Inglesa',
      subtitulo: '7º Ano do Ensino Fundamental',
      disciplina: 'Língua Inglesa',
      secoes: [
        {
          id: 'oralidade',
          titulo: 'Eixo Oralidade',
          icone: '🗣️',
          criterios: [
            { id: 'li7-or1', nome: 'Interação oral', descricao: 'Participa de atividades em sala de aula de forma respeitosa e colaborativa.', nivel: '' },
            { id: 'li7-or2', nome: 'Entrevistas', descricao: 'Entrevista colegas para conhecer suas histórias de vida.', nivel: '' },
            { id: 'li7-or3', nome: 'Compreensão oral', descricao: 'Mobiliza conhecimentos prévios para entender textos orais.', nivel: '' },
            { id: 'li7-or4', nome: 'Contexto e finalidade', descricao: 'Identifica assunto, interlocutores e finalidade em textos orais (cinema, TV, internet).', nivel: '' },
            { id: 'li7-or5', nome: 'Narrativas orais', descricao: 'Produz narrativas sobre fatos e personalidades do passado.', nivel: '' }
          ]
        },
        {
          id: 'leitura',
          titulo: 'Eixo Leitura',
          icone: '📖',
          criterios: [
            { id: 'li7-le1', nome: 'Inferência', descricao: 'Antecipar sentido global de textos por leitura rápida (skimming, scanning).', nivel: '' },
            { id: 'li7-le2', nome: 'Informações-chave', descricao: 'Identifica informações principais em parágrafos.', nivel: '' },
            { id: 'li7-le3', nome: 'Coesão textual', descricao: 'Relaciona partes do texto para construir sentido global.', nivel: '' },
            { id: 'li7-le4', nome: 'Seleção de informações', descricao: 'Localiza dados específicos conforme objetivo de leitura.', nivel: '' },
            { id: 'li7-le5', nome: 'Fontes confiáveis', descricao: 'Escolhe textos em ambientes virtuais para estudos/pesquisas.', nivel: '' },
            { id: 'li7-le6', nome: 'Troca de opiniões', descricao: 'Compartilha ideias e opiniões sobre textos lidos.', nivel: '' }
          ]
        },
        {
          id: 'escrita',
          titulo: 'Eixo Escrita',
          icone: '✍️',
          criterios: [
            { id: 'li7-es1', nome: 'Planejamento', descricao: 'Planeja textos considerando público, finalidade, layout e suporte.', nivel: '' },
            { id: 'li7-es2', nome: 'Organização', descricao: 'Estrutura textos em parágrafos/tópicos com clareza.', nivel: '' },
            { id: 'li7-es3', nome: 'Produção textual', descricao: 'Produz textos diversos (timelines, biografias, verbetes, blogs).', nivel: '' }
          ]
        },
        {
          id: 'linguisticos',
          titulo: 'Eixo Conhecimentos Linguísticos',
          icone: '🧠',
          criterios: [
            { id: 'li7-li1', nome: 'Vocabulário', descricao: 'Constrói repertório lexical com verbos regulares/irregulares, preposições e conectores.', nivel: '' },
            { id: 'li7-li2', nome: 'Pronúncia', descricao: 'Reconhece pronúncia de verbos regulares no passado (-ed).', nivel: '' },
            { id: 'li7-li3', nome: 'Polissemia', descricao: 'Explora diferentes sentidos de palavras conforme contexto.', nivel: '' },
            { id: 'li7-li4', nome: 'Gramática', descricao: 'Usa passado simples e contínuo, pronomes retos/oblíquos e modal can.', nivel: '' }
          ]
        },
        {
          id: 'intercultural',
          titulo: 'Eixo Dimensão Intercultural',
          icone: '🌍',
          criterios: [
            { id: 'li7-ic1', nome: 'Inglês global', descricao: 'Analisa alcance da língua inglesa no mundo contemporâneo.', nivel: '' },
            { id: 'li7-ic2', nome: 'Variação linguística', descricao: 'Reconhece e respeita diferentes modos de falar em inglês.', nivel: '' },
            { id: 'li7-ic3', nome: 'Reflexão cultural', descricao: 'Refuta preconceitos e valoriza diversidade cultural.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-or', dimensao: 'Oralidade', indicadores: 'Interação, entrevistas, narrativas', observacoes: '' },
        { id: 'sint-le', dimensao: 'Leitura', indicadores: 'Inferência, informações-chave, fontes confiáveis', observacoes: '' },
        { id: 'sint-es', dimensao: 'Escrita', indicadores: 'Planejamento, organização, produção textual', observacoes: '' },
        { id: 'sint-li', dimensao: 'Conhecimentos Linguísticos', indicadores: 'Vocabulário, pronúncia, gramática', observacoes: '' },
        { id: 'sint-ic', dimensao: 'Interculturalidade', indicadores: 'Inglês global, variação linguística', observacoes: '' }
      ]
    };
  }

  getAvaliacaoLI8Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Língua Inglesa',
      subtitulo: '8º Ano do Ensino Fundamental',
      disciplina: 'Língua Inglesa',
      secoes: [
        {
          id: 'oralidade',
          titulo: 'Eixo Oralidade',
          icone: '🗣️',
          criterios: [
            { id: 'li8-or1', nome: 'Interação oral', descricao: 'Usa inglês para resolver mal-entendidos, emitir opiniões e esclarecer informações.', nivel: '' },
            { id: 'li8-or2', nome: 'Recursos linguísticos/paralinguísticos', descricao: 'Explora frases incompletas, hesitações, gestos e expressões faciais em interações.', nivel: '' },
            { id: 'li8-or3', nome: 'Compreensão oral', descricao: 'Relaciona partes de textos orais para construir sentido global.', nivel: '' },
            { id: 'li8-or4', nome: 'Futuro em inglês', descricao: 'Usa repertório linguístico para falar de planos, previsões e probabilidades.', nivel: '' }
          ]
        },
        {
          id: 'leitura',
          titulo: 'Eixo Leitura',
          icone: '📖',
          criterios: [
            { id: 'li8-le1', nome: 'Inferência', descricao: 'Deduz informações implícitas em textos para construir sentidos.', nivel: '' },
            { id: 'li8-le2', nome: 'Valorização cultural', descricao: 'Aprecia textos narrativos (contos, romances) em inglês, reconhecendo seu valor cultural.', nivel: '' },
            { id: 'li8-le3', nome: 'Ambientes virtuais', descricao: 'Explora aplicativos e ambientes digitais para acessar patrimônio literário em inglês.', nivel: '' },
            { id: 'li8-le4', nome: 'Análise crítica', descricao: 'Compara diferentes perspectivas em textos sobre o mesmo assunto.', nivel: '' }
          ]
        },
        {
          id: 'escrita',
          titulo: 'Eixo Escrita',
          icone: '✍️',
          criterios: [
            { id: 'li8-es1', nome: 'Autoavaliação', descricao: 'Avalia sua produção escrita e a dos colegas quanto à clareza e adequação.', nivel: '' },
            { id: 'li8-es2', nome: 'Revisão e edição', descricao: 'Reconstrói textos com cortes, acréscimos e correções para publicação final.', nivel: '' },
            { id: 'li8-es3', nome: 'Produção textual', descricao: 'Produz textos diversos (comentários, relatos, mensagens, tweets, reportagens, blogs) sobre sonhos e projetos futuros.', nivel: '' }
          ]
        },
        {
          id: 'linguisticos',
          titulo: 'Eixo Conhecimentos Linguísticos',
          icone: '🧠',
          criterios: [
            { id: 'li8-li1', nome: 'Vocabulário', descricao: 'Constrói repertório lexical sobre planos e expectativas futuras.', nivel: '' },
            { id: 'li8-li2', nome: 'Formação de palavras', descricao: 'Reconhece prefixos e sufixos comuns.', nivel: '' },
            { id: 'li8-li3', nome: 'Gramática', descricao: 'Usa verbos no futuro, comparativos e superlativos, quantificadores (some, any, many, much) e pronomes relativos.', nivel: '' }
          ]
        },
        {
          id: 'intercultural',
          titulo: 'Eixo Dimensão Intercultural',
          icone: '🌍',
          criterios: [
            { id: 'li8-ic1', nome: 'Repertório cultural', descricao: 'Valoriza manifestações artísticas e culturais em inglês (literatura, música, cinema, festividades).', nivel: '' },
            { id: 'li8-ic2', nome: 'Interpretação cultural', descricao: 'Investiga como gestos e comportamentos são interpretados em diferentes culturas.', nivel: '' },
            { id: 'li8-ic3', nome: 'Comunicação intercultural', descricao: 'Examina fatores que dificultam entendimento entre culturas diversas.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-or', dimensao: 'Oralidade', indicadores: 'Interação, recursos linguísticos, uso do futuro', observacoes: '' },
        { id: 'sint-le', dimensao: 'Leitura', indicadores: 'Inferência, valorização cultural, análise crítica', observacoes: '' },
        { id: 'sint-es', dimensao: 'Escrita', indicadores: 'Produção, revisão, clareza', observacoes: '' },
        { id: 'sint-li', dimensao: 'Conhecimentos Linguísticos', indicadores: 'Vocabulário, gramática, formação de palavras', observacoes: '' },
        { id: 'sint-ic', dimensao: 'Interculturalidade', indicadores: 'Repertório cultural, interpretação, comunicação', observacoes: '' }
      ]
    };
  }

  getAvaliacaoLI9Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Língua Inglesa',
      subtitulo: '9º Ano do Ensino Fundamental',
      disciplina: 'Língua Inglesa',
      secoes: [
        {
          id: 'oralidade',
          titulo: 'Eixo Oralidade',
          icone: '🗣️',
          criterios: [
            { id: 'li9-or1', nome: 'Argumentação oral', descricao: 'Expõe pontos de vista, argumentos e contra-argumentos em inglês.', nivel: '' },
            { id: 'li9-or2', nome: 'Tomada de notas', descricao: 'Compila ideias-chave de textos orais.', nivel: '' },
            { id: 'li9-or3', nome: 'Análise crítica', descricao: 'Analisa posicionamentos defendidos/refutados em debates e textos orais.', nivel: '' },
            { id: 'li9-or4', nome: 'Apresentações', descricao: 'Expõe resultados de pesquisa com apoio de gráficos, tabelas e notas.', nivel: '' }
          ]
        },
        {
          id: 'leitura',
          titulo: 'Eixo Leitura',
          icone: '📖',
          criterios: [
            { id: 'li9-le1', nome: 'Publicidade e propaganda', descricao: 'Identifica recursos de persuasão em textos publicitários.', nivel: '' },
            { id: 'li9-le2', nome: 'Argumentação jornalística', descricao: 'Distingue fatos de opiniões em textos da esfera jornalística.', nivel: '' },
            { id: 'li9-le3', nome: 'Evidências', descricao: 'Reconhece argumentos principais e exemplos que os sustentam.', nivel: '' },
            { id: 'li9-le4', nome: 'Ambientes virtuais', descricao: 'Analisa qualidade e validade das informações em ambientes digitais.', nivel: '' }
          ]
        },
        {
          id: 'escrita',
          titulo: 'Eixo Escrita',
          icone: '✍️',
          criterios: [
            { id: 'li9-es1', nome: 'Argumentação escrita', descricao: 'Propõe e organiza argumentos com dados e evidências.', nivel: '' },
            { id: 'li9-es2', nome: 'Persuasão', descricao: 'Usa recursos verbais e não verbais em textos publicitários.', nivel: '' },
            { id: 'li9-es3', nome: 'Produção textual', descricao: 'Produz textos diversos (infográficos, fóruns, campanhas, memes) com posicionamento crítico.', nivel: '' },
            { id: 'li9-es4', nome: 'Novos gêneros digitais', descricao: 'Reconhece formas de escrita em "internetês" (abreviações, símbolos, pictogramas).', nivel: '' },
            { id: 'li9-es5', nome: 'Conectores', descricao: 'Usa linking words para construir argumentação (adição, oposição, condição, conclusão).', nivel: '' }
          ]
        },
        {
          id: 'linguisticos',
          titulo: 'Eixo Conhecimentos Linguísticos',
          icone: '🧠',
          criterios: [
            { id: 'li9-li1', nome: 'Orações condicionais', descricao: 'Emprega corretamente if-clauses tipos 1 e 2.', nivel: '' },
            { id: 'li9-li2', nome: 'Verbos modais', descricao: 'Usa should, must, have to, may, might para indicar recomendação, obrigação ou probabilidade.', nivel: '' },
            { id: 'li9-li3', nome: 'Vocabulário digital', descricao: 'Reconhece usos de linguagem em meio digital.', nivel: '' }
          ]
        },
        {
          id: 'intercultural',
          titulo: 'Eixo Dimensão Intercultural',
          icone: '🌍',
          criterios: [
            { id: 'li9-ic1', nome: 'Expansão histórica', descricao: 'Debate sobre a expansão da língua inglesa pelo mundo (colonização nas Américas, África, Ásia e Oceania).', nivel: '' },
            { id: 'li9-ic2', nome: 'Ciência, economia e política', descricao: 'Analisa importância do inglês no intercâmbio científico, econômico e político.', nivel: '' },
            { id: 'li9-ic3', nome: 'Identidades globais', descricao: 'Discute comunicação intercultural e construção de identidades no mundo globalizado.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-or', dimensao: 'Oralidade', indicadores: 'Argumentação, apresentações, análise crítica', observacoes: '' },
        { id: 'sint-le', dimensao: 'Leitura', indicadores: 'Persuasão, distinção fato/opinião, evidências', observacoes: '' },
        { id: 'sint-es', dimensao: 'Escrita', indicadores: 'Argumentação, persuasão, gêneros digitais', observacoes: '' },
        { id: 'sint-li', dimensao: 'Conhecimentos Linguísticos', indicadores: 'Condicionais, modais, conectores', observacoes: '' },
        { id: 'sint-ic', dimensao: 'Interculturalidade', indicadores: 'Expansão histórica, papel global do inglês', observacoes: '' }
      ]
    };
  }

  getAvaliacaoMat1Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Matemática',
      subtitulo: '1º Ano do Ensino Fundamental',
      disciplina: 'Matemática',
      secoes: [
        {
          id: 'numeros',
          titulo: 'Números e Álgebra',
          icone: '🔢',
          criterios: [
            { id: 'mt1-nu1', nome: 'Uso dos números', descricao: 'Reconhece números como indicadores de quantidade, ordem ou código.', nivel: '' },
            { id: 'mt1-nu2', nome: 'Contagem', descricao: 'Conta objetos até 100, de forma exata ou aproximada.', nivel: '' },
            { id: 'mt1-nu3', nome: 'Estimativa', descricao: 'Compara quantidades de conjuntos pequenos (até 20 elementos).', nivel: '' },
            { id: 'mt1-nu4', nome: 'Comparação de números', descricao: 'Compara números naturais até duas ordens, com ou sem reta numérica.', nivel: '' },
            { id: 'mt1-nu5', nome: 'Adição e subtração', descricao: 'Resolve e elabora problemas simples de juntar, acrescentar, separar e retirar.', nivel: '' },
            { id: 'mt1-nu6', nome: 'Composição e decomposição', descricao: 'Compreende o sistema decimal ao compor e decompor números.', nivel: '' },
            { id: 'mt1-nu7', nome: 'Padrões e sequências', descricao: 'Identifica e completa padrões figurais e numéricos.', nivel: '' }
          ]
        },
        {
          id: 'geometria',
          titulo: 'Geometria',
          icone: '📐',
          criterios: [
            { id: 'mt1-ge1', nome: 'Localização', descricao: 'Descreve posição de pessoas e objetos no espaço (direita, esquerda, frente, atrás).', nivel: '' },
            { id: 'mt1-ge2', nome: 'Referenciais', descricao: 'Usa pontos de referência para indicar posições (em cima, embaixo etc.).', nivel: '' },
            { id: 'mt1-ge3', nome: 'Figuras espaciais', descricao: 'Relaciona sólidos geométricos (cone, cilindro, esfera, bloco) a objetos do cotidiano.', nivel: '' },
            { id: 'mt1-ge4', nome: 'Figuras planas', descricao: 'Identifica e nomeia círculo, quadrado, retângulo e triângulo.', nivel: '' }
          ]
        },
        {
          id: 'grandezas',
          titulo: 'Grandezas e Medidas',
          icone: '📏',
          criterios: [
            { id: 'mt1-gm1', nome: 'Comparações', descricao: 'Compara comprimento, massa e capacidade usando termos cotidianos (mais alto, mais leve etc.).', nivel: '' },
            { id: 'mt1-gm2', nome: 'Tempo', descricao: 'Relata sequência de acontecimentos e reconhece períodos do dia, dias da semana e meses.', nivel: '' },
            { id: 'mt1-gm3', nome: 'Calendário', descricao: 'Produz escrita de datas e identifica dia da semana.', nivel: '' },
            { id: 'mt1-gm4', nome: 'Sistema monetário', descricao: 'Reconhece moedas e cédulas brasileiras em situações simples.', nivel: '' }
          ]
        },
        {
          id: 'estatistica',
          titulo: 'Probabilidade e Estatística',
          icone: '📊',
          criterios: [
            { id: 'mt1-pe1', nome: 'Noção de acaso', descricao: 'Classifica eventos como certos, possíveis ou impossíveis.', nivel: '' },
            { id: 'mt1-pe2', nome: 'Leitura de dados', descricao: 'Lê tabelas e gráficos de colunas simples.', nivel: '' },
            { id: 'mt1-pe3', nome: 'Coleta de informações', descricao: 'Realiza pequenas pesquisas e organiza dados em representações pessoais.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-nu', dimensao: 'Números e Álgebra', indicadores: 'Contagem, cálculo, padrões', observacoes: '' },
        { id: 'sint-ge', dimensao: 'Geometria', indicadores: 'Localização, figuras planas e espaciais', observacoes: '' },
        { id: 'sint-gm', dimensao: 'Grandezas e Medidas', indicadores: 'Comparações, tempo, sistema monetário', observacoes: '' },
        { id: 'sint-pe', dimensao: 'Probabilidade e Estatística', indicadores: 'Noção de acaso, leitura de dados', observacoes: '' }
      ]
    };
  }

  getAvaliacaoMat2Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Matemática',
      subtitulo: '2º Ano do Ensino Fundamental',
      disciplina: 'Matemática',
      secoes: [
        {
          id: 'numeros',
          titulo: 'Números e Álgebra',
          icone: '🔢',
          criterios: [
            { id: 'mt2-nu1', nome: 'Sistema decimal', descricao: 'Compara e ordena números até centenas, reconhecendo valor posicional e função do zero.', nivel: '' },
            { id: 'mt2-nu2', nome: 'Estimativa e contagem', descricao: 'Faz estimativas e registra contagem de objetos até 1000.', nivel: '' },
            { id: 'mt2-nu3', nome: 'Comparação de conjuntos', descricao: 'Indica "tem mais", "tem menos" ou "igual quantidade", identificando diferenças.', nivel: '' },
            { id: 'mt2-nu4', nome: 'Composição e decomposição', descricao: 'Compreende números até três ordens usando material manipulável.', nivel: '' },
            { id: 'mt2-nu5', nome: 'Adição e subtração', descricao: 'Usa fatos básicos para cálculo mental e escrito.', nivel: '' },
            { id: 'mt2-nu6', nome: 'Problemas matemáticos', descricao: 'Resolve e elabora problemas de adição, subtração e multiplicação simples.', nivel: '' },
            { id: 'mt2-nu7', nome: 'Dobro, metade, triplo', descricao: 'Resolve problemas envolvendo frações simples com apoio de imagens ou materiais.', nivel: '' },
            { id: 'mt2-nu8', nome: 'Sequências', descricao: 'Identifica regularidades e completa sequências numéricas e figurais.', nivel: '' }
          ]
        },
        {
          id: 'geometria',
          titulo: 'Geometria',
          icone: '📐',
          criterios: [
            { id: 'mt2-ge1', nome: 'Localização', descricao: 'Descreve deslocamentos e mudanças de direção usando pontos de referência.', nivel: '' },
            { id: 'mt2-ge2', nome: 'Plantas e roteiros', descricao: 'Esboça trajetos e plantas simples de ambientes familiares.', nivel: '' },
            { id: 'mt2-ge3', nome: 'Figuras espaciais', descricao: 'Reconhece e compara cubo, bloco retangular, pirâmide, cone, cilindro e esfera.', nivel: '' },
            { id: 'mt2-ge4', nome: 'Figuras planas', descricao: 'Identifica círculo, quadrado, retângulo e triângulo em diferentes disposições.', nivel: '' }
          ]
        },
        {
          id: 'grandezas',
          titulo: 'Grandezas e Medidas',
          icone: '📏',
          criterios: [
            { id: 'mt2-gm1', nome: 'Comprimento', descricao: 'Estima e mede usando unidades não padronizadas e padronizadas (m, cm, mm).', nivel: '' },
            { id: 'mt2-gm2', nome: 'Capacidade e massa', descricao: 'Mede e compara usando litros, mililitros, gramas e quilogramas.', nivel: '' },
            { id: 'mt2-gm3', nome: 'Tempo', descricao: 'Usa calendário e relógio digital para indicar intervalos e ordenar datas.', nivel: '' },
            { id: 'mt2-gm4', nome: 'Sistema monetário', descricao: 'Reconhece moedas e cédulas e estabelece equivalência de valores.', nivel: '' }
          ]
        },
        {
          id: 'estatistica',
          titulo: 'Probabilidade e Estatística',
          icone: '📊',
          criterios: [
            { id: 'mt2-pe1', nome: 'Aleatoriedade', descricao: 'Classifica eventos como prováveis, improváveis ou impossíveis.', nivel: '' },
            { id: 'mt2-pe2', nome: 'Leitura de dados', descricao: 'Compara informações em tabelas simples/dupla entrada e gráficos de colunas.', nivel: '' },
            { id: 'mt2-pe3', nome: 'Coleta de dados', descricao: 'Realiza pesquisas com até 30 elementos e organiza em listas, tabelas e gráficos.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-nu', dimensao: 'Números e Álgebra', indicadores: 'Sistema decimal, cálculo, sequências', observacoes: '' },
        { id: 'sint-ge', dimensao: 'Geometria', indicadores: 'Localização, figuras planas e espaciais', observacoes: '' },
        { id: 'sint-gm', dimensao: 'Grandezas e Medidas', indicadores: 'Comprimento, massa, tempo, dinheiro', observacoes: '' },
        { id: 'sint-pe', dimensao: 'Probabilidade e Estatística', indicadores: 'Aleatoriedade, leitura e coleta de dados', observacoes: '' }
      ]
    };
  }

  getAvaliacaoMat3Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Matemática',
      subtitulo: '3º Ano do Ensino Fundamental',
      disciplina: 'Matemática',
      secoes: [
        {
          id: 'numeros',
          titulo: 'Números e Álgebra',
          icone: '🔢',
          criterios: [
            { id: 'mt3-nu1', nome: 'Sistema decimal', descricao: 'Lê, escreve e compara números até a ordem de milhar.', nivel: '' },
            { id: 'mt3-nu2', nome: 'Composição e decomposição', descricao: 'Identifica características do sistema decimal ao compor/decompor números.', nivel: '' },
            { id: 'mt3-nu3', nome: 'Fatos básicos', descricao: 'Usa adição e multiplicação para cálculo mental ou escrito.', nivel: '' },
            { id: 'mt3-nu4', nome: 'Reta numérica', descricao: 'Relaciona números naturais à reta numérica para ordenação e cálculo.', nivel: '' },
            { id: 'mt3-nu5', nome: 'Problemas matemáticos', descricao: 'Resolve e elabora problemas de adição, subtração, multiplicação e divisão simples.', nivel: '' },
            { id: 'mt3-nu6', nome: 'Frações simples', descricao: 'Relaciona divisão com ideias de metade, terça, quarta, quinta e décima parte.', nivel: '' },
            { id: 'mt3-nu7', nome: 'Sequências', descricao: 'Identifica regularidades em sequências numéricas e completa elementos faltantes.', nivel: '' },
            { id: 'mt3-nu8', nome: 'Igualdade', descricao: 'Compreende e escreve sentenças de adição/subtração que resultem no mesmo valor.', nivel: '' }
          ]
        },
        {
          id: 'geometria',
          titulo: 'Geometria',
          icone: '📐',
          criterios: [
            { id: 'mt3-ge1', nome: 'Localização', descricao: 'Representa trajetos e movimentações em croquis ou maquetes.', nivel: '' },
            { id: 'mt3-ge2', nome: 'Figuras espaciais', descricao: 'Reconhece e nomeia cubo, bloco retangular, pirâmide, cone, cilindro e esfera.', nivel: '' },
            { id: 'mt3-ge3', nome: 'Planificação', descricao: 'Relaciona figuras espaciais às suas planificações.', nivel: '' },
            { id: 'mt3-ge4', nome: 'Figuras planas', descricao: 'Classifica triângulo, quadrado, retângulo, trapézio e paralelogramo.', nivel: '' },
            { id: 'mt3-ge5', nome: 'Congruência', descricao: 'Reconhece figuras congruentes por sobreposição ou uso de malhas.', nivel: '' }
          ]
        },
        {
          id: 'grandezas',
          titulo: 'Grandezas e Medidas',
          icone: '📏',
          criterios: [
            { id: 'mt3-gm1', nome: 'Unidades de medida', descricao: 'Reconhece que resultados dependem da unidade utilizada.', nivel: '' },
            { id: 'mt3-gm2', nome: 'Comprimento', descricao: 'Estima e mede usando m, cm e mm.', nivel: '' },
            { id: 'mt3-gm3', nome: 'Capacidade e massa', descricao: 'Mede usando litro, mililitro, grama, quilograma e miligrama.', nivel: '' },
            { id: 'mt3-gm4', nome: 'Área', descricao: 'Compara áreas por superposição.', nivel: '' },
            { id: 'mt3-gm5', nome: 'Tempo', descricao: 'Lê horas em relógios digitais e analógicos, reconhece relações entre unidades de tempo.', nivel: '' },
            { id: 'mt3-gm6', nome: 'Sistema monetário', descricao: 'Resolve problemas de equivalência de valores em compras e trocas.', nivel: '' }
          ]
        },
        {
          id: 'estatistica',
          titulo: 'Probabilidade e Estatística',
          icone: '📊',
          criterios: [
            { id: 'mt3-pe1', nome: 'Espaço amostral', descricao: 'Identifica resultados possíveis em eventos aleatórios e estima chances.', nivel: '' },
            { id: 'mt3-pe2', nome: 'Leitura de dados', descricao: 'Resolve problemas com dados em tabelas de dupla entrada e gráficos.', nivel: '' },
            { id: 'mt3-pe3', nome: 'Interpretação', descricao: 'Compara dados em tabelas e gráficos, usando termos como maior/menor frequência.', nivel: '' },
            { id: 'mt3-pe4', nome: 'Coleta de dados', descricao: 'Realiza pesquisas com até 50 elementos e organiza em tabelas e gráficos.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-nu', dimensao: 'Números e Álgebra', indicadores: 'Sistema decimal, cálculo, sequências', observacoes: '' },
        { id: 'sint-ge', dimensao: 'Geometria', indicadores: 'Localização, figuras planas e espaciais', observacoes: '' },
        { id: 'sint-gm', dimensao: 'Grandezas e Medidas', indicadores: 'Comprimento, massa, tempo, dinheiro', observacoes: '' },
        { id: 'sint-pe', dimensao: 'Probabilidade e Estatística', indicadores: 'Espaço amostral, leitura e coleta de dados', observacoes: '' }
      ]
    };
  }

  getAvaliacaoMat4Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Matemática',
      subtitulo: '4º Ano do Ensino Fundamental',
      disciplina: 'Matemática',
      secoes: [
        {
          id: 'numeros',
          titulo: 'Números e Álgebra',
          icone: '🔢',
          criterios: [
            { id: 'mt4-nu1', nome: 'Sistema decimal', descricao: 'Lê, escreve e ordena números até dezenas de milhar.', nivel: '' },
            { id: 'mt4-nu2', nome: 'Composição e decomposição', descricao: 'Representa números por adições e multiplicações por potências de 10.', nivel: '' },
            { id: 'mt4-nu3', nome: 'Adição e subtração', descricao: 'Resolve problemas com diferentes estratégias (cálculo mental, algoritmos, estimativas).', nivel: '' },
            { id: 'mt4-nu4', nome: 'Multiplicação e divisão', descricao: 'Resolve problemas com diferentes significados (parcelas iguais, proporcionalidade, repartição).', nivel: '' },
            { id: 'mt4-nu5', nome: 'Problemas de contagem', descricao: 'Determina agrupamentos possíveis em coleções.', nivel: '' },
            { id: 'mt4-nu6', nome: 'Frações unitárias', descricao: 'Reconhece frações usuais (1/2, 1/3, 1/4, 1/5, 1/10, 1/100).', nivel: '' },
            { id: 'mt4-nu7', nome: 'Números decimais', descricao: 'Relaciona décimos e centésimos ao sistema monetário brasileiro.', nivel: '' },
            { id: 'mt4-nu8', nome: 'Sequências numéricas', descricao: 'Identifica regularidades em múltiplos e restos iguais em divisões.', nivel: '' },
            { id: 'mt4-nu9', nome: 'Igualdade', descricao: 'Reconhece propriedades da igualdade e determina números desconhecidos em operações.', nivel: '' }
          ]
        },
        {
          id: 'geometria',
          titulo: 'Geometria',
          icone: '📐',
          criterios: [
            { id: 'mt4-ge1', nome: 'Localização', descricao: 'Descreve deslocamentos em mapas, croquis e malhas quadriculadas.', nivel: '' },
            { id: 'mt4-ge2', nome: 'Prismas e pirâmides', descricao: 'Reconhece, nomeia e relaciona figuras espaciais às suas planificações.', nivel: '' },
            { id: 'mt4-ge3', nome: 'Ângulos', descricao: 'Identifica ângulos retos e não retos com dobraduras, esquadros ou softwares.', nivel: '' },
            { id: 'mt4-ge4', nome: 'Simetria', descricao: 'Reconhece simetria de reflexão em figuras planas e constrói figuras congruentes.', nivel: '' }
          ]
        },
        {
          id: 'grandezas',
          titulo: 'Grandezas e Medidas',
          icone: '📏',
          criterios: [
            { id: 'mt4-gm1', nome: 'Comprimento, massa e capacidade', descricao: 'Mede e estima utilizando unidades convencionais.', nivel: '' },
            { id: 'mt4-gm2', nome: 'Área', descricao: 'Mede áreas em malhas quadriculadas e reconhece equivalências.', nivel: '' },
            { id: 'mt4-gm3', nome: 'Tempo', descricao: 'Lê e registra intervalos em horas, minutos e segundos.', nivel: '' },
            { id: 'mt4-gm4', nome: 'Temperatura', descricao: 'Reconhece grau Celsius como unidade de medida e registra variações em gráficos.', nivel: '' },
            { id: 'mt4-gm5', nome: 'Sistema monetário', descricao: 'Resolve problemas de compra, venda, troco e desconto com consciência ética.', nivel: '' }
          ]
        },
        {
          id: 'estatistica',
          titulo: 'Probabilidade e Estatística',
          icone: '📊',
          criterios: [
            { id: 'mt4-pe1', nome: 'Eventos aleatórios', descricao: 'Identifica eventos mais prováveis em situações cotidianas.', nivel: '' },
            { id: 'mt4-pe2', nome: 'Leitura de dados', descricao: 'Analisa tabelas e gráficos (colunas, barras, pictóricos).', nivel: '' },
            { id: 'mt4-pe3', nome: 'Pesquisa', descricao: 'Realiza pesquisas com variáveis categóricas e numéricas, organizando dados em tabelas e gráficos.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-nu', dimensao: 'Números e Álgebra', indicadores: 'Sistema decimal, cálculo, sequências, frações', observacoes: '' },
        { id: 'sint-ge', dimensao: 'Geometria', indicadores: 'Localização, prismas/pirâmides, ângulos, simetria', observacoes: '' },
        { id: 'sint-gm', dimensao: 'Grandezas e Medidas', indicadores: 'Comprimento, área, tempo, temperatura, dinheiro', observacoes: '' },
        { id: 'sint-pe', dimensao: 'Probabilidade e Estatística', indicadores: 'Eventos aleatórios, leitura e coleta de dados', observacoes: '' }
      ]
    };
  }

  getAvaliacaoMat5Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Matemática',
      subtitulo: '5º Ano do Ensino Fundamental',
      disciplina: 'Matemática',
      secoes: [
        {
          id: 'numeros',
          titulo: 'Números e Álgebra',
          icone: '🔢',
          criterios: [
            { id: 'mt5-nu1', nome: 'Sistema decimal', descricao: 'Lê, escreve e ordena números naturais até centenas de milhar.', nivel: '' },
            { id: 'mt5-nu2', nome: 'Números racionais', descricao: 'Representa frações e decimais na reta numérica.', nivel: '' },
            { id: 'mt5-nu3', nome: 'Equivalência', descricao: 'Identifica frações equivalentes e compara números racionais.', nivel: '' },
            { id: 'mt5-nu4', nome: 'Porcentagem', descricao: 'Associa porcentagens comuns (10%, 25%, 50%, 75%, 100%) a frações equivalentes.', nivel: '' },
            { id: 'mt5-nu5', nome: 'Problemas matemáticos', descricao: 'Resolve problemas de adição, subtração, multiplicação e divisão com naturais e decimais finitos.', nivel: '' },
            { id: 'mt5-nu6', nome: 'Contagem', descricao: 'Resolve problemas simples de contagem usando princípio multiplicativo.', nivel: '' },
            { id: 'mt5-nu7', nome: 'Equivalência e igualdade', descricao: 'Reconhece propriedades da igualdade e resolve problemas com termos desconhecidos.', nivel: '' },
            { id: 'mt5-nu8', nome: 'Proporcionalidade', descricao: 'Resolve problemas de grandezas diretamente proporcionais e partição desigual.', nivel: '' }
          ]
        },
        {
          id: 'geometria',
          titulo: 'Geometria',
          icone: '📐',
          criterios: [
            { id: 'mt5-ge1', nome: 'Plano cartesiano', descricao: 'Localiza e representa objetos no 1º quadrante.', nivel: '' },
            { id: 'mt5-ge2', nome: 'Movimentação', descricao: 'Descreve deslocamentos e giros no plano cartesiano.', nivel: '' },
            { id: 'mt5-ge3', nome: 'Figuras espaciais', descricao: 'Reconhece prismas, pirâmides, cilindros e cones e suas planificações.', nivel: '' },
            { id: 'mt5-ge4', nome: 'Polígonos', descricao: 'Nomeia e compara polígonos considerando lados, vértices e ângulos.', nivel: '' },
            { id: 'mt5-ge5', nome: 'Ampliação e redução', descricao: 'Reconhece congruência de ângulos e proporcionalidade de lados em figuras ampliadas ou reduzidas.', nivel: '' }
          ]
        },
        {
          id: 'grandezas',
          titulo: 'Grandezas e Medidas',
          icone: '📏',
          criterios: [
            { id: 'mt5-gm1', nome: 'Medidas', descricao: 'Resolve problemas envolvendo comprimento, área, massa, tempo, temperatura e capacidade.', nivel: '' },
            { id: 'mt5-gm2', nome: 'Área e perímetro', descricao: 'Reconhece que figuras com mesma área podem ter perímetros diferentes e vice-versa.', nivel: '' },
            { id: 'mt5-gm3', nome: 'Volume', descricao: 'Reconhece volume como grandeza e mede por empilhamento de cubos.', nivel: '' }
          ]
        },
        {
          id: 'estatistica',
          titulo: 'Probabilidade e Estatística',
          icone: '📊',
          criterios: [
            { id: 'mt5-pe1', nome: 'Espaço amostral', descricao: 'Apresenta todos os resultados possíveis de um experimento aleatório.', nivel: '' },
            { id: 'mt5-pe2', nome: 'Probabilidade', descricao: 'Determina probabilidade de eventos equiprováveis.', nivel: '' },
            { id: 'mt5-pe3', nome: 'Interpretação de dados', descricao: 'Analisa dados em tabelas e gráficos e produz síntese textual.', nivel: '' },
            { id: 'mt5-pe4', nome: 'Pesquisa', descricao: 'Realiza pesquisas com variáveis categóricas e numéricas, organiza dados em tabelas e gráficos e apresenta síntese dos resultados.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-nu', dimensao: 'Números e Álgebra', indicadores: 'Sistema decimal, frações, porcentagens, proporcionalidade', observacoes: '' },
        { id: 'sint-ge', dimensao: 'Geometria', indicadores: 'Plano cartesiano, polígonos, figuras espaciais', observacoes: '' },
        { id: 'sint-gm', dimensao: 'Grandezas e Medidas', indicadores: 'Medidas, área, perímetro, volume', observacoes: '' },
        { id: 'sint-pe', dimensao: 'Probabilidade e Estatística', indicadores: 'Espaço amostral, probabilidade, coleta de dados', observacoes: '' }
      ]
    };
  }

  getAvaliacaoMat6Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Matemática',
      subtitulo: '6º Ano do Ensino Fundamental',
      disciplina: 'Matemática',
      secoes: [
        {
          id: 'numeros',
          titulo: 'Números',
          icone: '🔢',
          criterios: [
            { id: 'mt6-nu1', nome: 'Sistema decimal', descricao: 'Lê, escreve e compara números naturais e racionais decimais.', nivel: '' },
            { id: 'mt6-nu2', nome: 'Operações', descricao: 'Resolve problemas com as quatro operações e potenciação.', nivel: '' },
            { id: 'mt6-nu3', nome: 'Divisão euclidiana', descricao: 'Aplica corretamente divisão com quociente e resto.', nivel: '' },
            { id: 'mt6-nu4', nome: 'Múltiplos e divisores', descricao: 'Classifica números em primos e compostos, identifica critérios de divisibilidade.', nivel: '' },
            { id: 'mt6-nu5', nome: 'Frações', descricao: 'Compara, ordena e identifica frações equivalentes.', nivel: '' },
            { id: 'mt6-nu6', nome: 'Racionais', descricao: 'Relaciona frações e decimais na reta numérica.', nivel: '' },
            { id: 'mt6-nu7', nome: 'Porcentagens', descricao: 'Resolve problemas de porcentagem sem uso da regra de três.', nivel: '' }
          ]
        },
        {
          id: 'algebra',
          titulo: 'Álgebra',
          icone: '🔣',
          criterios: [
            { id: 'mt6-al1', nome: 'Igualdade', descricao: 'Reconhece propriedades da igualdade e resolve problemas com termos desconhecidos.', nivel: '' },
            { id: 'mt6-al2', nome: 'Razões', descricao: 'Resolve problemas de partição em partes desiguais, compreendendo relações entre partes e o todo.', nivel: '' }
          ]
        },
        {
          id: 'geometria',
          titulo: 'Geometria',
          icone: '📐',
          criterios: [
            { id: 'mt6-ge1', nome: 'Plano cartesiano', descricao: 'Localiza pontos e vértices de polígonos no 1º quadrante.', nivel: '' },
            { id: 'mt6-ge2', nome: 'Prismas e pirâmides', descricao: 'Reconhece elementos (vértices, faces, arestas) e suas planificações.', nivel: '' },
            { id: 'mt6-ge3', nome: 'Polígonos', descricao: 'Classifica polígonos, triângulos e quadriláteros quanto a lados e ângulos.', nivel: '' },
            { id: 'mt6-ge4', nome: 'Figuras semelhantes', descricao: 'Constrói figuras ampliadas ou reduzidas em malhas quadriculadas.', nivel: '' },
            { id: 'mt6-ge5', nome: 'Retas', descricao: 'Representa retas paralelas e perpendiculares com instrumentos ou softwares.', nivel: '' },
            { id: 'mt6-ge6', nome: 'Plantas baixas', descricao: 'Interpreta e desenha plantas simples e vistas aéreas.', nivel: '' },
            { id: 'mt6-ge7', nome: 'Perímetro e área', descricao: 'Analisa mudanças no perímetro e área de quadrados ao ampliar/reduzir lados.', nivel: '' }
          ]
        },
        {
          id: 'grandezas',
          titulo: 'Grandezas e Medidas',
          icone: '📏',
          criterios: [
            { id: 'mt6-gm1', nome: 'Medidas', descricao: 'Resolve problemas com comprimento, massa, tempo, temperatura, área, capacidade e volume.', nivel: '' },
            { id: 'mt6-gm2', nome: 'Ângulos', descricao: 'Reconhece, mede e aplica ângulos em diferentes contextos.', nivel: '' }
          ]
        },
        {
          id: 'estatistica',
          titulo: 'Probabilidade e Estatística',
          icone: '📊',
          criterios: [
            { id: 'mt6-pe1', nome: 'Probabilidade', descricao: 'Calcula probabilidade de eventos aleatórios em forma fracionária, decimal e percentual.', nivel: '' },
            { id: 'mt6-pe2', nome: 'Gráficos e tabelas', descricao: 'Lê, interpreta e analisa dados em diferentes tipos de gráficos e tabelas.', nivel: '' },
            { id: 'mt6-pe3', nome: 'Pesquisas', descricao: 'Planeja e coleta dados, organiza em planilhas e representa em gráficos.', nivel: '' },
            { id: 'mt6-pe4', nome: 'Fluxogramas', descricao: 'Interpreta e desenvolve fluxogramas simples para representar relações.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-nu', dimensao: 'Números', indicadores: 'Sistema decimal, operações, frações, porcentagens', observacoes: '' },
        { id: 'sint-al', dimensao: 'Álgebra', indicadores: 'Igualdade, razões', observacoes: '' },
        { id: 'sint-ge', dimensao: 'Geometria', indicadores: 'Plano cartesiano, polígonos, prismas, plantas', observacoes: '' },
        { id: 'sint-gm', dimensao: 'Grandezas e Medidas', indicadores: 'Comprimento, área, volume, ângulos', observacoes: '' },
        { id: 'sint-pe', dimensao: 'Probabilidade e Estatística', indicadores: 'Probabilidade, gráficos, fluxogramas', observacoes: '' }
      ]
    };
  }

  getAvaliacaoMat7Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Matemática',
      subtitulo: '7º Ano do Ensino Fundamental',
      disciplina: 'Matemática',
      secoes: [
        {
          id: 'numeros',
          titulo: 'Números',
          icone: '🔢',
          criterios: [
            { id: 'mt7-nu1', nome: 'Múltiplos e divisores', descricao: 'Resolve problemas envolvendo máximo divisor comum e mínimo múltiplo comum.', nivel: '' },
            { id: 'mt7-nu2', nome: 'Porcentagens', descricao: 'Calcula acréscimos e decréscimos simples em diferentes contextos.', nivel: '' },
            { id: 'mt7-nu3', nome: 'Números inteiros', descricao: 'Ordena, compara e associa inteiros à reta numérica; resolve operações.', nivel: '' },
            { id: 'mt7-nu4', nome: 'Frações', descricao: 'Compara e ordena frações em diferentes significados (parte/todo, razão, operador).', nivel: '' },
            { id: 'mt7-nu5', nome: 'Números racionais', descricao: 'Ordena e opera com racionais em forma fracionária e decimal.', nivel: '' }
          ]
        },
        {
          id: 'algebra',
          titulo: 'Álgebra',
          icone: '🔣',
          criterios: [
            { id: 'mt7-al1', nome: 'Variável e incógnita', descricao: 'Diferencia variável (relação entre grandezas) de incógnita.', nivel: '' },
            { id: 'mt7-al2', nome: 'Sequências', descricao: 'Classifica sequências em recursivas e não recursivas; expressa regularidades com simbologia algébrica.', nivel: '' },
            { id: 'mt7-al3', nome: 'Equivalência algébrica', descricao: 'Reconhece se expressões algébricas de uma sequência são equivalentes.', nivel: '' },
            { id: 'mt7-al4', nome: 'Proporcionalidade', descricao: 'Resolve problemas de proporcionalidade direta e inversa com sentenças algébricas.', nivel: '' },
            { id: 'mt7-al5', nome: 'Equações', descricao: 'Resolve problemas representados por equações polinomiais do 1º grau.', nivel: '' }
          ]
        },
        {
          id: 'geometria',
          titulo: 'Geometria',
          icone: '📐',
          criterios: [
            { id: 'mt7-ge1', nome: 'Transformações geométricas', descricao: 'Realiza simetrias, translações e rotações de polígonos no plano cartesiano.', nivel: '' },
            { id: 'mt7-ge2', nome: 'Circunferência', descricao: 'Constrói circunferências e aplica em problemas e composições artísticas.', nivel: '' },
            { id: 'mt7-ge3', nome: 'Ângulos', descricao: 'Verifica relações entre ângulos formados por retas paralelas e transversais.', nivel: '' },
            { id: 'mt7-ge4', nome: 'Triângulos', descricao: 'Constrói triângulos, verifica condição de existência e soma dos ângulos internos.', nivel: '' },
            { id: 'mt7-ge5', nome: 'Polígonos regulares', descricao: 'Calcula ângulos internos e externos de polígonos regulares.', nivel: '' },
            { id: 'mt7-ge6', nome: 'Volume e área', descricao: 'Calcula volume de blocos retangulares e áreas de triângulos/quadriláteros.', nivel: '' },
            { id: 'mt7-ge7', nome: 'Circunferência e π', descricao: 'Relaciona medida da circunferência ao diâmetro para compreender o número π.', nivel: '' }
          ]
        },
        {
          id: 'grandezas',
          titulo: 'Grandezas e Medidas',
          icone: '📏',
          criterios: [
            { id: 'mt7-gm1', nome: 'Medidas', descricao: 'Resolve problemas de comprimento, área, volume e tempo em contextos reais.', nivel: '' },
            { id: 'mt7-gm2', nome: 'Equivalência de áreas', descricao: 'Reconhece que figuras diferentes podem ter áreas equivalentes.', nivel: '' }
          ]
        },
        {
          id: 'estatistica',
          titulo: 'Probabilidade e Estatística',
          icone: '📊',
          criterios: [
            { id: 'mt7-pe1', nome: 'Experimentos aleatórios', descricao: 'Planeja e realiza experimentos para estimar probabilidades.', nivel: '' },
            { id: 'mt7-pe2', nome: 'Média e amplitude', descricao: 'Calcula média estatística e relaciona com amplitude de dados.', nivel: '' },
            { id: 'mt7-pe3', nome: 'Pesquisas', descricao: 'Planeja e realiza pesquisas censitárias ou amostrais, organiza dados em tabelas e gráficos.', nivel: '' },
            { id: 'mt7-pe4', nome: 'Gráficos de setores', descricao: 'Interpreta e constrói gráficos de setores, avaliando pertinência.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-nu', dimensao: 'Números', indicadores: 'Inteiros, racionais, frações, porcentagens', observacoes: '' },
        { id: 'sint-al', dimensao: 'Álgebra', indicadores: 'Variáveis, sequências, equações, proporcionalidade', observacoes: '' },
        { id: 'sint-ge', dimensao: 'Geometria', indicadores: 'Transformações, triângulos, polígonos, circunferência', observacoes: '' },
        { id: 'sint-gm', dimensao: 'Grandezas e Medidas', indicadores: 'Comprimento, área, volume, equivalência', observacoes: '' },
        { id: 'sint-pe', dimensao: 'Probabilidade e Estatística', indicadores: 'Experimentos, média, pesquisas, gráficos', observacoes: '' }
      ]
    };
  }

  getAvaliacaoMat8Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Matemática',
      subtitulo: '8º Ano do Ensino Fundamental',
      disciplina: 'Matemática',
      secoes: [
        {
          id: 'numeros',
          titulo: 'Números',
          icone: '🔢',
          criterios: [
            { id: 'mt8-nu1', nome: 'Notação científica', descricao: 'Representa números em notação científica e aplica potenciação.', nivel: '' },
            { id: 'mt8-nu2', nome: 'Potenciação e radiciação', descricao: 'Relaciona radiciação com potenciação de expoente fracionário.', nivel: '' },
            { id: 'mt8-nu3', nome: 'Princípio multiplicativo', descricao: 'Resolve problemas de contagem aplicando o princípio multiplicativo.', nivel: '' },
            { id: 'mt8-nu4', nome: 'Porcentagens', descricao: 'Calcula porcentagens em diferentes contextos, com ou sem tecnologias digitais.', nivel: '' },
            { id: 'mt8-nu5', nome: 'Dízimas periódicas', descricao: 'Obtém fração geratriz de uma dízima periódica.', nivel: '' }
          ]
        },
        {
          id: 'algebra',
          titulo: 'Álgebra',
          icone: '🔣',
          criterios: [
            { id: 'mt8-al1', nome: 'Expressões algébricas', descricao: 'Calcula valor numérico de expressões utilizando propriedades operatórias.', nivel: '' },
            { id: 'mt8-al2', nome: 'Equações lineares', descricao: 'Associa equação linear de 1º grau a uma reta no plano cartesiano.', nivel: '' },
            { id: 'mt8-al3', nome: 'Sistemas de equações', descricao: 'Resolve problemas representados por sistemas de equações lineares com duas incógnitas.', nivel: '' },
            { id: 'mt8-al4', nome: 'Equações quadráticas', descricao: 'Resolve problemas com equações do tipo ax²=b.', nivel: '' },
            { id: 'mt8-al5', nome: 'Sequências', descricao: 'Identifica regularidades em sequências recursivas e não recursivas e constrói algoritmos.', nivel: '' },
            { id: 'mt8-al6', nome: 'Proporcionalidade', descricao: 'Analisa variação de grandezas diretamente ou inversamente proporcionais.', nivel: '' }
          ]
        },
        {
          id: 'geometria',
          titulo: 'Geometria',
          icone: '📐',
          criterios: [
            { id: 'mt8-ge1', nome: 'Congruência', descricao: 'Demonstra propriedades de quadriláteros usando congruência de triângulos.', nivel: '' },
            { id: 'mt8-ge2', nome: 'Construções geométricas', descricao: 'Constrói ângulos (90°, 60°, 45°, 30°), polígonos regulares, mediatriz e bissetriz.', nivel: '' },
            { id: 'mt8-ge3', nome: 'Algoritmos geométricos', descricao: 'Elabora fluxogramas para construção de polígonos regulares.', nivel: '' },
            { id: 'mt8-ge4', nome: 'Transformações', descricao: 'Reconhece e constrói figuras por translação, reflexão e rotação.', nivel: '' }
          ]
        },
        {
          id: 'grandezas',
          titulo: 'Grandezas e Medidas',
          icone: '📏',
          criterios: [
            { id: 'mt8-gm1', nome: 'Área', descricao: 'Calcula áreas de triângulos, quadriláteros e círculos.', nivel: '' },
            { id: 'mt8-gm2', nome: 'Circunferência', descricao: 'Calcula comprimento da circunferência.', nivel: '' },
            { id: 'mt8-gm3', nome: 'Volume', descricao: 'Resolve problemas de volume de blocos retangulares.', nivel: '' },
            { id: 'mt8-gm4', nome: 'Capacidade', descricao: 'Relaciona litro com decímetro cúbico e metro cúbico.', nivel: '' }
          ]
        },
        {
          id: 'estatistica',
          titulo: 'Probabilidade e Estatística',
          icone: '📊',
          criterios: [
            { id: 'mt8-pe1', nome: 'Princípio multiplicativo', descricao: 'Calcula probabilidade usando espaço amostral e princípio multiplicativo.', nivel: '' },
            { id: 'mt8-pe2', nome: 'Gráficos', descricao: 'Avalia adequação de gráficos (barras, colunas, linhas, setores) para representar dados.', nivel: '' },
            { id: 'mt8-pe3', nome: 'Variáveis contínuas', descricao: 'Classifica frequências em classes para resumir dados.', nivel: '' },
            { id: 'mt8-pe4', nome: 'Medidas estatísticas', descricao: 'Calcula média, moda e mediana e relaciona com dispersão (amplitude).', nivel: '' },
            { id: 'mt8-pe5', nome: 'Pesquisas', descricao: 'Planeja e executa pesquisa amostral, selecionando técnica de amostragem adequada.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-nu', dimensao: 'Números', indicadores: 'Notação científica, potenciação, porcentagens, dízimas', observacoes: '' },
        { id: 'sint-al', dimensao: 'Álgebra', indicadores: 'Expressões, equações, sistemas, sequências, proporcionalidade', observacoes: '' },
        { id: 'sint-ge', dimensao: 'Geometria', indicadores: 'Congruência, construções, transformações', observacoes: '' },
        { id: 'sint-gm', dimensao: 'Grandezas e Medidas', indicadores: 'Área, circunferência, volume, capacidade', observacoes: '' },
        { id: 'sint-pe', dimensao: 'Probabilidade e Estatística', indicadores: 'Probabilidade, gráficos, medidas estatísticas, pesquisas', observacoes: '' }
      ]
    };
  }

  getAvaliacaoMat9Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Matemática',
      subtitulo: '9º Ano do Ensino Fundamental',
      disciplina: 'Matemática',
      secoes: [
        {
          id: 'numeros',
          titulo: 'Números',
          icone: '🔢',
          criterios: [
            { id: 'mt9-nu1', nome: 'Números reais', descricao: 'Reconhece necessidade dos números reais para medir segmentos de reta.', nivel: '' },
            { id: 'mt9-nu2', nome: 'Números irracionais', descricao: 'Identifica irracionais como decimais infinitos não periódicos e os localiza na reta.', nivel: '' },
            { id: 'mt9-nu3', nome: 'Potências', descricao: 'Efetua cálculos com expoentes negativos e fracionários.', nivel: '' },
            { id: 'mt9-nu4', nome: 'Notação científica', descricao: 'Resolve problemas com números reais em notação científica.', nivel: '' },
            { id: 'mt9-nu5', nome: 'Porcentagens', descricao: 'Resolve problemas com percentuais sucessivos em contextos financeiros.', nivel: '' }
          ]
        },
        {
          id: 'algebra',
          titulo: 'Álgebra',
          icone: '🔣',
          criterios: [
            { id: 'mt9-al1', nome: 'Funções', descricao: 'Compreende funções como relações unívocas e representa em forma numérica, algébrica e gráfica.', nivel: '' },
            { id: 'mt9-al2', nome: 'Razão entre grandezas', descricao: 'Resolve problemas envolvendo grandezas de espécies diferentes (velocidade, densidade).', nivel: '' },
            { id: 'mt9-al3', nome: 'Proporcionalidade', descricao: 'Resolve problemas de proporcionalidade direta e inversa, incluindo escalas e taxas de variação.', nivel: '' },
            { id: 'mt9-al4', nome: 'Expressões algébricas', descricao: 'Aplica fatoração e produtos notáveis para resolver equações polinomiais do 2º grau.', nivel: '' }
          ]
        },
        {
          id: 'geometria',
          titulo: 'Geometria',
          icone: '📐',
          criterios: [
            { id: 'mt9-ge1', nome: 'Ângulos e retas', descricao: 'Demonstra relações entre ângulos formados por retas paralelas e transversais.', nivel: '' },
            { id: 'mt9-ge2', nome: 'Circunferência', descricao: 'Resolve problemas envolvendo arcos, ângulos centrais e inscritos.', nivel: '' },
            { id: 'mt9-ge3', nome: 'Semelhança de triângulos', descricao: 'Reconhece condições necessárias e suficientes para semelhança.', nivel: '' },
            { id: 'mt9-ge4', nome: 'Teorema de Pitágoras', descricao: 'Demonstra e aplica relações métricas no triângulo retângulo.', nivel: '' },
            { id: 'mt9-ge5', nome: 'Plano cartesiano', descricao: 'Determina ponto médio e distância entre pontos, aplicando em perímetros e áreas.', nivel: '' },
            { id: 'mt9-ge6', nome: 'Vistas ortogonais', descricao: 'Reconhece e desenha vistas ortogonais de figuras espaciais.', nivel: '' },
            { id: 'mt9-ge7', nome: 'Polígonos regulares', descricao: 'Constrói polígonos regulares com régua, compasso ou softwares.', nivel: '' }
          ]
        },
        {
          id: 'grandezas',
          titulo: 'Grandezas e Medidas',
          icone: '📏',
          criterios: [
            { id: 'mt9-gm1', nome: 'Unidades de medida', descricao: 'Reconhece unidades para medidas muito grandes ou muito pequenas (astronomia, informática, biologia).', nivel: '' },
            { id: 'mt9-gm2', nome: 'Volume', descricao: 'Calcula volume de prismas e cilindros retos em situações cotidianas.', nivel: '' }
          ]
        },
        {
          id: 'estatistica',
          titulo: 'Probabilidade e Estatística',
          icone: '📊',
          criterios: [
            { id: 'mt9-pe1', nome: 'Eventos aleatórios', descricao: 'Reconhece eventos dependentes e independentes e calcula suas probabilidades.', nivel: '' },
            { id: 'mt9-pe2', nome: 'Gráficos da mídia', descricao: 'Analisa gráficos divulgados pela mídia e identifica possíveis erros de leitura ou manipulação.', nivel: '' },
            { id: 'mt9-pe3', nome: 'Representação de dados', descricao: 'Escolhe e constrói gráficos adequados (colunas, setores, linhas) para representar dados.', nivel: '' },
            { id: 'mt9-pe4', nome: 'Pesquisa amostral', descricao: 'Planeja e executa pesquisa amostral, apresentando relatório com medidas de tendência central e amplitude.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-nu', dimensao: 'Números', indicadores: 'Reais, irracionais, porcentagens, notação científica', observacoes: '' },
        { id: 'sint-al', dimensao: 'Álgebra', indicadores: 'Funções, proporcionalidade, fatoração', observacoes: '' },
        { id: 'sint-ge', dimensao: 'Geometria', indicadores: 'Ângulos, circunferência, triângulos, Pitágoras, polígonos', observacoes: '' },
        { id: 'sint-gm', dimensao: 'Grandezas e Medidas', indicadores: 'Unidades de medida, volume', observacoes: '' },
        { id: 'sint-pe', dimensao: 'Probabilidade e Estatística', indicadores: 'Eventos, gráficos, pesquisas', observacoes: '' }
      ]
    };
  }

  getAvaliacaoCI1Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Ciências',
      subtitulo: '1º Ano do Ensino Fundamental',
      disciplina: 'Ciências',
      secoes: [
        {
          id: 'materia',
          titulo: 'Matéria e Energia',
          icone: '🔬',
          criterios: [
            { id: 'ci1-me1', nome: 'Materiais', descricao: 'Compara características de diferentes materiais do cotidiano, discutindo origem, descarte e uso consciente.', nivel: '' }
          ]
        },
        {
          id: 'vida',
          titulo: 'Vida e Evolução',
          icone: '🧍',
          criterios: [
            { id: 'ci1-ve1', nome: 'Corpo humano', descricao: 'Localiza, nomeia e representa graficamente partes do corpo e explica suas funções.', nivel: '' },
            { id: 'ci1-ve2', nome: 'Hábitos de higiene', descricao: 'Reconhece importância de práticas de higiene para manutenção da saúde.', nivel: '' },
            { id: 'ci1-ve3', nome: 'Diversidade', descricao: 'Compara características físicas entre colegas, valorizando respeito e acolhimento às diferenças.', nivel: '' }
          ]
        },
        {
          id: 'terra',
          titulo: 'Terra e Universo',
          icone: '🌍',
          criterios: [
            { id: 'ci1-tu1', nome: 'Escalas de tempo', descricao: 'Identifica períodos diários (manhã, tarde, noite) e sucessão de dias, semanas, meses e anos.', nivel: '' },
            { id: 'ci1-tu2', nome: 'Ritmo das atividades', descricao: 'Seleciona exemplos de como a sucessão de dias e noites orienta atividades humanas e de outros seres vivos.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-me', dimensao: 'Matéria e Energia', indicadores: 'Consciência ambiental, uso de materiais', observacoes: '' },
        { id: 'sint-ve', dimensao: 'Vida e Evolução', indicadores: 'Corpo humano, higiene, diversidade', observacoes: '' },
        { id: 'sint-tu', dimensao: 'Terra e Universo', indicadores: 'Escalas de tempo, ritmo das atividades', observacoes: '' }
      ]
    };
  }

  getAvaliacaoCI2Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Ciências',
      subtitulo: '2º Ano do Ensino Fundamental',
      disciplina: 'Ciências',
      secoes: [
        {
          id: 'materia',
          titulo: 'Matéria e Energia',
          icone: '🔬',
          criterios: [
            { id: 'ci2-me1', nome: 'Materiais', descricao: 'Identifica de que materiais são feitos objetos do cotidiano e compara com materiais usados no passado.', nivel: '' },
            { id: 'ci2-me2', nome: 'Propriedades dos materiais', descricao: 'Propõe uso de diferentes materiais considerando propriedades como flexibilidade, dureza e transparência.', nivel: '' },
            { id: 'ci2-me3', nome: 'Prevenção de acidentes', descricao: 'Reconhece cuidados necessários para evitar acidentes domésticos (cortantes, inflamáveis, eletricidade, produtos químicos).', nivel: '' }
          ]
        },
        {
          id: 'vida',
          titulo: 'Vida e Evolução',
          icone: '🌱',
          criterios: [
            { id: 'ci2-ve1', nome: 'Seres vivos', descricao: 'Descreve características de plantas e animais e relaciona ao ambiente em que vivem.', nivel: '' },
            { id: 'ci2-ve2', nome: 'Plantas e vida', descricao: 'Investiga importância da água e da luz para manutenção da vida das plantas.', nivel: '' },
            { id: 'ci2-ve3', nome: 'Partes da planta', descricao: 'Identifica raiz, caule, folhas, flores e frutos, explicando suas funções e relações com o ambiente.', nivel: '' }
          ]
        },
        {
          id: 'terra',
          titulo: 'Terra e Universo',
          icone: '🌍',
          criterios: [
            { id: 'ci2-tu1', nome: 'Movimento do Sol', descricao: 'Descreve posições do Sol em diferentes horários e associa ao tamanho das sombras.', nivel: '' },
            { id: 'ci2-tu2', nome: 'Radiação solar', descricao: 'Compara efeitos da luz e calor do Sol em diferentes superfícies (água, areia, solo, superfícies claras e escuras).', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-me', dimensao: 'Matéria e Energia', indicadores: 'Materiais, propriedades, prevenção de acidentes', observacoes: '' },
        { id: 'sint-ve', dimensao: 'Vida e Evolução', indicadores: 'Seres vivos, plantas, partes da planta', observacoes: '' },
        { id: 'sint-tu', dimensao: 'Terra e Universo', indicadores: 'Movimento do Sol, radiação solar', observacoes: '' }
      ]
    };
  }

  getAvaliacaoCI3Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Ciências',
      subtitulo: '3º Ano do Ensino Fundamental',
      disciplina: 'Ciências',
      secoes: [
        {
          id: 'materia',
          titulo: 'Matéria e Energia',
          icone: '🔬',
          criterios: [
            { id: 'ci3-me1', nome: 'Som', descricao: 'Produz sons a partir da vibração de objetos e identifica variáveis que influenciam o fenômeno.', nivel: '' },
            { id: 'ci3-me2', nome: 'Luz', descricao: 'Experimenta e relata efeitos da luz em objetos transparentes, polidos e opacos.', nivel: '' },
            { id: 'ci3-me3', nome: 'Saúde auditiva e visual', descricao: 'Reconhece hábitos necessários para manter saúde auditiva e visual em relação ao som e à luz.', nivel: '' }
          ]
        },
        {
          id: 'vida',
          titulo: 'Vida e Evolução',
          icone: '🌱',
          criterios: [
            { id: 'ci3-ve1', nome: 'Animais', descricao: 'Identifica características do modo de vida dos animais comuns (alimentação, reprodução, deslocamento).', nivel: '' },
            { id: 'ci3-ve2', nome: 'Desenvolvimento', descricao: 'Descreve alterações desde o nascimento em animais terrestres e aquáticos, incluindo humanos.', nivel: '' },
            { id: 'ci3-ve3', nome: 'Classificação', descricao: 'Compara animais e organiza grupos com base em características externas (penas, pelos, escamas etc.).', nivel: '' }
          ]
        },
        {
          id: 'terra',
          titulo: 'Terra e Universo',
          icone: '🌍',
          criterios: [
            { id: 'ci3-tu1', nome: 'Características da Terra', descricao: 'Identifica formato esférico, presença de água e solo, usando mapas, globos e fotografias.', nivel: '' },
            { id: 'ci3-tu2', nome: 'Observação do céu', descricao: 'Observa e registra períodos em que Sol, Lua, estrelas e planetas estão visíveis.', nivel: '' },
            { id: 'ci3-tu3', nome: 'Solo', descricao: 'Compara amostras de solo quanto a cor, textura, cheiro, permeabilidade e tamanho das partículas.', nivel: '' },
            { id: 'ci3-tu4', nome: 'Usos do solo', descricao: 'Identifica diferentes usos do solo (plantação, extração de materiais) e reconhece sua importância para a vida.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-me', dimensao: 'Matéria e Energia', indicadores: 'Som, luz, saúde auditiva e visual', observacoes: '' },
        { id: 'sint-ve', dimensao: 'Vida e Evolução', indicadores: 'Características, desenvolvimento e classificação dos animais', observacoes: '' },
        { id: 'sint-tu', dimensao: 'Terra e Universo', indicadores: 'Características da Terra, observação do céu, solo', observacoes: '' }
      ]
    };
  }

  getAvaliacaoCI4Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Ciências',
      subtitulo: '4º Ano do Ensino Fundamental',
      disciplina: 'Ciências',
      secoes: [
        {
          id: 'materia',
          titulo: 'Matéria e Energia',
          icone: '🔬',
          criterios: [
            { id: 'ci4-me1', nome: 'Misturas', descricao: 'Identifica misturas no cotidiano com base em propriedades físicas observáveis.', nivel: '' },
            { id: 'ci4-me2', nome: 'Transformações', descricao: 'Testa e relata transformações de materiais expostos a diferentes condições (aquecimento, resfriamento, luz, umidade).', nivel: '' },
            { id: 'ci4-me3', nome: 'Reversibilidade', descricao: 'Conclui quais mudanças são reversíveis (mudança de estado da água) e quais não são (cozimento, queima).', nivel: '' }
          ]
        },
        {
          id: 'vida',
          titulo: 'Vida e Evolução',
          icone: '🌱',
          criterios: [
            { id: 'ci4-ve1', nome: 'Cadeias alimentares', descricao: 'Analisa e constrói cadeias alimentares simples, reconhecendo posição dos seres vivos e papel do Sol como fonte de energia.', nivel: '' },
            { id: 'ci4-ve2', nome: 'Ciclo da matéria e energia', descricao: 'Destaca semelhanças e diferenças entre ciclo da matéria e fluxo de energia em ecossistemas.', nivel: '' },
            { id: 'ci4-ve3', nome: 'Microrganismos', descricao: 'Reconhece participação de fungos e bactérias na decomposição e sua importância ambiental.', nivel: '' },
            { id: 'ci4-ve4', nome: 'Aplicações dos microrganismos', descricao: 'Identifica participação de microrganismos na produção de alimentos, combustíveis e medicamentos.', nivel: '' },
            { id: 'ci4-ve5', nome: 'Prevenção de doenças', descricao: 'Propõe atitudes e medidas adequadas para prevenir doenças transmitidas por vírus, bactérias e protozoários.', nivel: '' }
          ]
        },
        {
          id: 'terra',
          titulo: 'Terra e Universo',
          icone: '🌍',
          criterios: [
            { id: 'ci4-tu1', nome: 'Pontos cardeais', descricao: 'Identifica pontos cardeais por meio da observação da posição do Sol e da sombra de um gnômon.', nivel: '' },
            { id: 'ci4-tu2', nome: 'Comparação de instrumentos', descricao: 'Compara indicações de pontos cardeais obtidas com gnômon e bússola.', nivel: '' },
            { id: 'ci4-tu3', nome: 'Calendários e cultura', descricao: 'Relaciona movimentos cíclicos da Lua e da Terra a períodos regulares e ao uso em calendários de diferentes culturas.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-me', dimensao: 'Matéria e Energia', indicadores: 'Misturas, transformações, reversibilidade', observacoes: '' },
        { id: 'sint-ve', dimensao: 'Vida e Evolução', indicadores: 'Cadeias alimentares, microrganismos, prevenção de doenças', observacoes: '' },
        { id: 'sint-tu', dimensao: 'Terra e Universo', indicadores: 'Pontos cardeais, calendários e cultura', observacoes: '' }
      ]
    };
  }

  getAvaliacaoCI5Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Ciências',
      subtitulo: '5º Ano do Ensino Fundamental',
      disciplina: 'Ciências',
      secoes: [
        {
          id: 'materia',
          titulo: 'Matéria e Energia',
          icone: '🔬',
          criterios: [
            { id: 'ci5-me1', nome: 'Propriedades físicas', descricao: 'Explora fenômenos que evidenciam densidade, condutibilidade, solubilidade, dureza, elasticidade etc.', nivel: '' },
            { id: 'ci5-me2', nome: 'Ciclo hidrológico', descricao: 'Explica mudanças de estado da água e suas implicações na agricultura, clima, energia e ecossistemas.', nivel: '' },
            { id: 'ci5-me3', nome: 'Cobertura vegetal', descricao: 'Justifica importância da vegetação para ciclo da água, conservação do solo e qualidade do ar.', nivel: '' },
            { id: 'ci5-me4', nome: 'Consumo consciente', descricao: 'Identifica usos da água e materiais e propõe formas sustentáveis de utilização.', nivel: '' },
            { id: 'ci5-me5', nome: 'Reciclagem', descricao: 'Cria soluções coletivas para descarte adequado e reutilização/reciclagem de materiais.', nivel: '' }
          ]
        },
        {
          id: 'vida',
          titulo: 'Vida e Evolução',
          icone: '🌱',
          criterios: [
            { id: 'ci5-ve1', nome: 'Nutrição', descricao: 'Explica funções dos sistemas digestório e respiratório no processo de nutrição.', nivel: '' },
            { id: 'ci5-ve2', nome: 'Sistema circulatório', descricao: 'Justifica relação entre circulação, distribuição de nutrientes e eliminação de resíduos.', nivel: '' },
            { id: 'ci5-ve3', nome: 'Hábitos alimentares', descricao: 'Organiza cardápio equilibrado considerando nutrientes, calorias e necessidades individuais.', nivel: '' },
            { id: 'ci5-ve4', nome: 'Distúrbios nutricionais', descricao: 'Discute ocorrência de obesidade, subnutrição etc. a partir da análise de hábitos alimentares e atividade física.', nivel: '' }
          ]
        },
        {
          id: 'terra',
          titulo: 'Terra e Universo',
          icone: '🌍',
          criterios: [
            { id: 'ci5-tu1', nome: 'Constelações', descricao: 'Identifica constelações com apoio de mapas celestes e aplicativos, reconhecendo períodos de visibilidade.', nivel: '' },
            { id: 'ci5-tu2', nome: 'Rotação da Terra', descricao: 'Associa movimento diário do Sol e estrelas ao movimento de rotação da Terra.', nivel: '' },
            { id: 'ci5-tu3', nome: 'Fases da Lua', descricao: 'Conclui sobre periodicidade das fases da Lua com base em observação e registro.', nivel: '' },
            { id: 'ci5-tu4', nome: 'Instrumentos óticos', descricao: 'Constrói dispositivos de observação (luneta, periscópio, lupa, microscópio, câmera) e discute seus usos sociais.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-me', dimensao: 'Matéria e Energia', indicadores: 'Propriedades, ciclo da água, consumo consciente, reciclagem', observacoes: '' },
        { id: 'sint-ve', dimensao: 'Vida e Evolução', indicadores: 'Nutrição, sistemas do corpo, hábitos alimentares', observacoes: '' },
        { id: 'sint-tu', dimensao: 'Terra e Universo', indicadores: 'Constelações, rotação da Terra, fases da Lua, instrumentos óticos', observacoes: '' }
      ]
    };
  }

  getAvaliacaoCI6Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Ciências',
      subtitulo: '6º Ano do Ensino Fundamental',
      disciplina: 'Ciências',
      secoes: [
        {
          id: 'materia',
          titulo: 'Matéria e Energia',
          icone: '🔬',
          criterios: [
            { id: 'ci6-me1', nome: 'Misturas', descricao: 'Classifica misturas como homogêneas ou heterogêneas.', nivel: '' },
            { id: 'ci6-me2', nome: 'Transformações químicas', descricao: 'Identifica evidências de transformações químicas em diferentes materiais.', nivel: '' },
            { id: 'ci6-me3', nome: 'Separação de materiais', descricao: 'Seleciona métodos adequados para separar sistemas heterogêneos.', nivel: '' },
            { id: 'ci6-me4', nome: 'Materiais sintéticos', descricao: 'Relaciona produção de medicamentos e materiais sintéticos ao desenvolvimento científico e tecnológico, avaliando impactos.', nivel: '' }
          ]
        },
        {
          id: 'vida',
          titulo: 'Vida e Evolução',
          icone: '🌱',
          criterios: [
            { id: 'ci6-ve1', nome: 'Célula', descricao: 'Explica organização básica das células e seu papel como unidade da vida.', nivel: '' },
            { id: 'ci6-ve2', nome: 'Organização dos sistemas', descricao: 'Conclui que organismos são arranjos complexos de sistemas interdependentes.', nivel: '' },
            { id: 'ci6-ve3', nome: 'Sistema nervoso', descricao: 'Justifica papel do sistema nervoso na coordenação motora e sensorial.', nivel: '' },
            { id: 'ci6-ve4', nome: 'Visão e lentes', descricao: 'Explica funcionamento do olho humano e seleciona lentes corretivas adequadas.', nivel: '' },
            { id: 'ci6-ve5', nome: 'Interação de sistemas', descricao: 'Deduz que sustentação e movimentação resultam da interação entre sistemas muscular, ósseo e nervoso.', nivel: '' },
            { id: 'ci6-ve6', nome: 'Substâncias psicoativas', descricao: 'Explica como o sistema nervoso pode ser afetado por substâncias psicoativas.', nivel: '' }
          ]
        },
        {
          id: 'terra',
          titulo: 'Terra e Universo',
          icone: '🌍',
          criterios: [
            { id: 'ci6-tu1', nome: 'Estrutura da Terra', descricao: 'Identifica camadas da Terra e suas características.', nivel: '' },
            { id: 'ci6-tu2', nome: 'Rochas e fósseis', descricao: 'Identifica tipos de rochas e relaciona fósseis às rochas sedimentares.', nivel: '' },
            { id: 'ci6-tu3', nome: 'Esfericidade da Terra', descricao: 'Seleciona evidências que demonstram a forma esférica da Terra.', nivel: '' },
            { id: 'ci6-tu4', nome: 'Movimentos da Terra', descricao: 'Explica evidências dos movimentos de rotação e translação e da inclinação do eixo terrestre.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-me', dimensao: 'Matéria e Energia', indicadores: 'Misturas, transformações químicas, separação, materiais sintéticos', observacoes: '' },
        { id: 'sint-ve', dimensao: 'Vida e Evolução', indicadores: 'Célula, sistemas, visão, substâncias psicoativas', observacoes: '' },
        { id: 'sint-tu', dimensao: 'Terra e Universo', indicadores: 'Estrutura da Terra, rochas, esfericidade, movimentos', observacoes: '' }
      ]
    };
  }

  getAvaliacaoCI7Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Ciências',
      subtitulo: '7º Ano do Ensino Fundamental',
      disciplina: 'Ciências',
      secoes: [
        {
          id: 'materia',
          titulo: 'Matéria e Energia',
          icone: '🔬',
          criterios: [
            { id: 'ci7-me1', nome: 'Máquinas simples', descricao: 'Discute aplicações históricas e propõe soluções para tarefas mecânicas cotidianas.', nivel: '' },
            { id: 'ci7-me2', nome: 'Calor e temperatura', descricao: 'Diferencia temperatura, calor e sensação térmica em situações de equilíbrio termodinâmico.', nivel: '' },
            { id: 'ci7-me3', nome: 'Propagação do calor', descricao: 'Justifica uso de materiais condutores e isolantes e explica funcionamento de equipamentos.', nivel: '' },
            { id: 'ci7-me4', nome: 'Equilíbrio termodinâmico', descricao: 'Avalia papel do equilíbrio para a vida na Terra e funcionamento de máquinas térmicas.', nivel: '' },
            { id: 'ci7-me5', nome: 'Combustíveis e máquinas térmicas', descricao: 'Analisa uso histórico de combustíveis e máquinas térmicas, avaliando impactos socioambientais.', nivel: '' },
            { id: 'ci7-me6', nome: 'Tecnologia e sociedade', descricao: 'Avalia mudanças sociais e culturais decorrentes de novos materiais e tecnologias.', nivel: '' }
          ]
        },
        {
          id: 'vida',
          titulo: 'Vida e Evolução',
          icone: '🌱',
          criterios: [
            { id: 'ci7-ve1', nome: 'Ecossistemas', descricao: 'Caracteriza ecossistemas brasileiros e correlaciona características físicas à flora e fauna.', nivel: '' },
            { id: 'ci7-ve2', nome: 'Impactos ambientais', descricao: 'Avalia efeitos de catástrofes naturais ou mudanças ambientais sobre populações e espécies.', nivel: '' },
            { id: 'ci7-ve3', nome: 'Saúde pública', descricao: 'Interpreta indicadores de saúde e avalia políticas públicas.', nivel: '' },
            { id: 'ci7-ve4', nome: 'Vacinação', descricao: 'Argumenta sobre importância da vacinação para saúde individual e coletiva.', nivel: '' },
            { id: 'ci7-ve5', nome: 'Tecnologia e qualidade de vida', descricao: 'Analisa uso histórico da tecnologia e seus impactos ambientais e sociais.', nivel: '' }
          ]
        },
        {
          id: 'terra',
          titulo: 'Terra e Universo',
          icone: '🌍',
          criterios: [
            { id: 'ci7-tu1', nome: 'Composição do ar', descricao: 'Demonstra que o ar é mistura de gases e discute alterações naturais ou antrópicas.', nivel: '' },
            { id: 'ci7-tu2', nome: 'Efeito estufa', descricao: 'Explica mecanismo natural, discute aumento artificial e propõe soluções de controle.', nivel: '' },
            { id: 'ci7-tu3', nome: 'Camada de ozônio', descricao: 'Justifica importância da camada de ozônio e discute medidas de preservação.', nivel: '' },
            { id: 'ci7-tu4', nome: 'Fenômenos naturais', descricao: 'Interpreta vulcões, terremotos e tsunamis e explica rara ocorrência no Brasil.', nivel: '' },
            { id: 'ci7-tu5', nome: 'Deriva continental', descricao: 'Justifica formato das costas brasileira e africana com base na teoria da deriva dos continentes.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-me', dimensao: 'Matéria e Energia', indicadores: 'Máquinas simples, calor, equilíbrio, combustíveis', observacoes: '' },
        { id: 'sint-ve', dimensao: 'Vida e Evolução', indicadores: 'Ecossistemas, impactos ambientais, saúde pública', observacoes: '' },
        { id: 'sint-tu', dimensao: 'Terra e Universo', indicadores: 'Composição do ar, efeito estufa, camada de ozônio, fenômenos naturais', observacoes: '' }
      ]
    };
  }

  getAvaliacaoCI8Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Ciências',
      subtitulo: '8º Ano do Ensino Fundamental',
      disciplina: 'Ciências',
      secoes: [
        {
          id: 'materia',
          titulo: 'Matéria e Energia',
          icone: '🔬',
          criterios: [
            { id: 'ci8-me1', nome: 'Fontes de energia', descricao: 'Identifica e classifica fontes renováveis e não renováveis.', nivel: '' },
            { id: 'ci8-me2', nome: 'Circuitos elétricos', descricao: 'Constrói circuitos simples e compara com circuitos residenciais.', nivel: '' },
            { id: 'ci8-me3', nome: 'Transformação de energia', descricao: 'Classifica equipamentos elétricos segundo o tipo de transformação de energia.', nivel: '' },
            { id: 'ci8-me4', nome: 'Consumo de energia', descricao: 'Calcula consumo de eletrodomésticos e avalia impacto no consumo mensal.', nivel: '' },
            { id: 'ci8-me5', nome: 'Uso consciente', descricao: 'Propõe ações coletivas para otimizar uso de energia elétrica com critérios de sustentabilidade.', nivel: '' },
            { id: 'ci8-me6', nome: 'Usinas de energia', descricao: 'Avalia diferentes tipos de usinas, seus impactos socioambientais e funcionamento.', nivel: '' }
          ]
        },
        {
          id: 'vida',
          titulo: 'Vida e Evolução',
          icone: '🌱',
          criterios: [
            { id: 'ci8-ve1', nome: 'Reprodução', descricao: 'Compara processos reprodutivos em plantas e animais, destacando mecanismos adaptativos.', nivel: '' },
            { id: 'ci8-ve2', nome: 'Puberdade', descricao: 'Analisa transformações da puberdade considerando hormônios e sistema nervoso.', nivel: '' },
            { id: 'ci8-ve3', nome: 'Métodos contraceptivos', descricao: 'Compara eficácia e modo de ação dos métodos contraceptivos, justificando responsabilidade compartilhada.', nivel: '' },
            { id: 'ci8-ve4', nome: 'DST', descricao: 'Identifica sintomas, transmissão e prevenção de doenças sexualmente transmissíveis, com ênfase na AIDS.', nivel: '' },
            { id: 'ci8-ve5', nome: 'Sexualidade', descricao: 'Reconhece múltiplas dimensões da sexualidade (biológica, sociocultural, afetiva e ética).', nivel: '' }
          ]
        },
        {
          id: 'terra',
          titulo: 'Terra e Universo',
          icone: '🌍',
          criterios: [
            { id: 'ci8-tu1', nome: 'Sistema Sol-Terra-Lua', descricao: 'Justifica fases da Lua e eclipses com base nas posições relativas dos astros.', nivel: '' },
            { id: 'ci8-tu2', nome: 'Movimentos da Terra', descricao: 'Representa rotação e translação e analisa papel da inclinação do eixo terrestre nas estações do ano.', nivel: '' },
            { id: 'ci8-tu3', nome: 'Clima', descricao: 'Relaciona climas regionais à circulação atmosférica e oceânica e ao aquecimento desigual da Terra.', nivel: '' },
            { id: 'ci8-tu4', nome: 'Previsão do tempo', descricao: 'Identifica variáveis envolvidas na previsão do tempo e simula medições.', nivel: '' },
            { id: 'ci8-tu5', nome: 'Alterações climáticas', descricao: 'Discute iniciativas para restabelecer equilíbrio ambiental frente às mudanças climáticas regionais e globais.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-me', dimensao: 'Matéria e Energia', indicadores: 'Fontes, circuitos, consumo, usinas, uso consciente', observacoes: '' },
        { id: 'sint-ve', dimensao: 'Vida e Evolução', indicadores: 'Reprodução, puberdade, contraceptivos, DST, sexualidade', observacoes: '' },
        { id: 'sint-tu', dimensao: 'Terra e Universo', indicadores: 'Sistema Sol-Terra-Lua, movimentos, clima, previsão do tempo', observacoes: '' }
      ]
    };
  }

  getAvaliacaoCI9Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Ciências',
      subtitulo: '9º Ano do Ensino Fundamental',
      disciplina: 'Ciências',
      secoes: [
        {
          id: 'materia',
          titulo: 'Matéria e Energia',
          icone: '🔬',
          criterios: [
            { id: 'ci9-me1', nome: 'Transformações químicas', descricao: 'Investiga mudanças de estado físico e explica com base na constituição submicroscópica da matéria.', nivel: '' },
            { id: 'ci9-me2', nome: 'Aspectos quantitativos', descricao: 'Compara reagentes e produtos em transformações químicas, estabelecendo proporções de massa.', nivel: '' },
            { id: 'ci9-me3', nome: 'Estrutura da matéria', descricao: 'Identifica modelos da estrutura da matéria (átomos, moléculas) e reconhece evolução histórica.', nivel: '' },
            { id: 'ci9-me4', nome: 'Radiações', descricao: 'Classifica radiações eletromagnéticas por frequência, fontes e aplicações.', nivel: '' },
            { id: 'ci9-me5', nome: 'Aplicações médicas', descricao: 'Discute uso de radiações na medicina diagnóstica e terapêutica, avaliando benefícios e riscos.', nivel: '' }
          ]
        },
        {
          id: 'vida',
          titulo: 'Vida e Evolução',
          icone: '🌱',
          criterios: [
            { id: 'ci9-ve1', nome: 'Hereditariedade', descricao: 'Associa gametas à transmissão de características hereditárias e aplica ideias de Mendel.', nivel: '' },
            { id: 'ci9-ve2', nome: 'Evolução biológica', descricao: 'Compara ideias de Lamarck e Darwin e discute seleção natural como explicação da diversidade.', nivel: '' },
            { id: 'ci9-ve3', nome: 'Biodiversidade', descricao: 'Justifica importância das unidades de conservação e propõe iniciativas de preservação ambiental.', nivel: '' }
          ]
        },
        {
          id: 'terra',
          titulo: 'Terra e Universo',
          icone: '🌍',
          criterios: [
            { id: 'ci9-tu1', nome: 'Sistema Solar', descricao: 'Descreve composição e estrutura do Sistema Solar e sua localização na Via Láctea.', nivel: '' },
            { id: 'ci9-tu2', nome: 'Astronomia e cultura', descricao: 'Relaciona leituras do céu e explicações sobre origem da Terra e do Sistema Solar às necessidades culturais.', nivel: '' },
            { id: 'ci9-tu3', nome: 'Vida fora da Terra', descricao: 'Avalia viabilidade da sobrevivência humana fora da Terra considerando condições necessárias e distâncias astronômicas.', nivel: '' },
            { id: 'ci9-tu4', nome: 'Ordem de grandeza', descricao: 'Reconhece escalas astronômicas e sua relevância para compreensão do Universo.', nivel: '' },
            { id: 'ci9-tu5', nome: 'Evolução estelar', descricao: 'Analisa ciclo evolutivo do Sol e de estrelas de diferentes dimensões, relacionando efeitos ao planeta Terra.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-me', dimensao: 'Matéria e Energia', indicadores: 'Transformações químicas, estrutura da matéria, radiações', observacoes: '' },
        { id: 'sint-ve', dimensao: 'Vida e Evolução', indicadores: 'Hereditariedade, evolução, biodiversidade', observacoes: '' },
        { id: 'sint-tu', dimensao: 'Terra e Universo', indicadores: 'Sistema Solar, astronomia cultural, vida fora da Terra, evolução estelar', observacoes: '' }
      ]
    };
  }

  getAvaliacaoGEO1Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Geografia',
      subtitulo: '1º Ano do Ensino Fundamental',
      disciplina: 'Geografia',
      secoes: [
        {
          id: 'sujeito',
          titulo: 'O sujeito e seu lugar no mundo',
          icone: '👧',
          criterios: [
            { id: 'geo1-su1', nome: 'Vivência', descricao: 'Descreve características de moradia, escola e outros lugares, identificando semelhanças e diferenças.', nivel: '' },
            { id: 'geo1-su2', nome: 'Brincadeiras', descricao: 'Identifica semelhanças e diferenças entre jogos e brincadeiras de diferentes épocas e lugares.', nivel: '' },
            { id: 'geo1-su3', nome: 'Espaço público', descricao: 'Relata usos de praças e parques para lazer e manifestações.', nivel: '' },
            { id: 'geo1-su4', nome: 'Regras de convívio', descricao: 'Discute e elabora regras coletivas para diferentes espaços (sala de aula, escola etc.).', nivel: '' }
          ]
        },
        {
          id: 'conexoes',
          titulo: 'Conexões e Escalas',
          icone: '🌍',
          criterios: [
            { id: 'geo1-co1', nome: 'Ritmos naturais', descricao: 'Observa e descreve dia/noite, variação de temperatura e umidade, comparando realidades diferentes.', nivel: '' },
            { id: 'geo1-co2', nome: 'Moradias e objetos', descricao: 'Compara tipos de moradia e objetos cotidianos considerando técnicas e materiais.', nivel: '' }
          ]
        },
        {
          id: 'trabalho',
          titulo: 'Mundo do Trabalho',
          icone: '🛠️',
          criterios: [
            { id: 'geo1-tr1', nome: 'Atividades de trabalho', descricao: 'Descreve atividades de trabalho relacionadas ao cotidiano da comunidade.', nivel: '' }
          ]
        },
        {
          id: 'representacao',
          titulo: 'Formas de Representação e Pensamento Espacial',
          icone: '🗺️',
          criterios: [
            { id: 'geo1-re1', nome: 'Mapas mentais', descricao: 'Cria mapas mentais e desenhos com base em itinerários, histórias e brincadeiras.', nivel: '' },
            { id: 'geo1-re2', nome: 'Mapas simples', descricao: 'Elabora e utiliza mapas simples para localizar elementos do local de vivência, usando referenciais espaciais.', nivel: '' }
          ]
        },
        {
          id: 'natureza',
          titulo: 'Natureza, Ambientes e Qualidade de Vida',
          icone: '🌱',
          criterios: [
            { id: 'geo1-na1', nome: 'Ritmos da natureza', descricao: 'Descreve características dos lugares de vivência relacionadas a chuva, vento, calor etc.', nivel: '' },
            { id: 'geo1-na2', nome: 'Hábitos e vestuário', descricao: 'Associa mudanças de vestuário e hábitos alimentares à variação de temperatura e umidade ao longo do ano.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-su', dimensao: 'O sujeito e seu lugar no mundo', indicadores: 'Vivência, brincadeiras, espaço público, regras de convívio', observacoes: '' },
        { id: 'sint-co', dimensao: 'Conexões e Escalas', indicadores: 'Ritmos naturais, moradias e objetos', observacoes: '' },
        { id: 'sint-tr', dimensao: 'Mundo do Trabalho', indicadores: 'Atividades cotidianas', observacoes: '' },
        { id: 'sint-re', dimensao: 'Representação Espacial', indicadores: 'Mapas mentais e simples', observacoes: '' },
        { id: 'sint-na', dimensao: 'Natureza e Qualidade de Vida', indicadores: 'Ritmos da natureza, hábitos e vestuário', observacoes: '' }
      ]
    };
  }

  getAvaliacaoGEO2Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Geografia',
      subtitulo: '2º Ano do Ensino Fundamental',
      disciplina: 'Geografia',
      secoes: [
        {
          id: 'sujeito',
          titulo: 'O sujeito e seu lugar no mundo',
          icone: '👧',
          criterios: [
            { id: 'geo2-su1', nome: 'Migrações', descricao: 'Descreve a história das migrações no bairro ou comunidade.', nivel: '' },
            { id: 'geo2-su2', nome: 'Costumes e tradições', descricao: 'Compara costumes e tradições de diferentes populações, reconhecendo importância do respeito às diferenças.', nivel: '' },
            { id: 'geo2-su3', nome: 'Transportes e comunicação', descricao: 'Compara meios de transporte e comunicação, discutindo riscos e uso responsável.', nivel: '' }
          ]
        },
        {
          id: 'conexoes',
          titulo: 'Conexões e Escalas',
          icone: '🌍',
          criterios: [
            { id: 'geo2-co1', nome: 'Hábitos e modos de viver', descricao: 'Reconhece semelhanças e diferenças nos hábitos e relações com a natureza em diferentes lugares.', nivel: '' },
            { id: 'geo2-co2', nome: 'Mudanças e permanências', descricao: 'Analisa mudanças e permanências comparando imagens de um mesmo lugar em diferentes tempos.', nivel: '' },
            { id: 'geo2-co3', nome: 'Atividades sociais', descricao: 'Relaciona dia e noite a diferentes tipos de atividades sociais (escola, comércio, sono etc.).', nivel: '' }
          ]
        },
        {
          id: 'trabalho',
          titulo: 'Mundo do Trabalho',
          icone: '🛠️',
          criterios: [
            { id: 'geo2-tr1', nome: 'Atividades extrativas', descricao: 'Descreve atividades extrativas (minerais, agropecuárias, industriais) e identifica impactos ambientais.', nivel: '' }
          ]
        },
        {
          id: 'representacao',
          titulo: 'Formas de Representação e Pensamento Espacial',
          icone: '🗺️',
          criterios: [
            { id: 'geo2-re1', nome: 'Representações', descricao: 'Elabora desenhos, mapas mentais e maquetes para representar paisagens.', nivel: '' },
            { id: 'geo2-re2', nome: 'Imagens aéreas e mapas', descricao: 'Identifica objetos e lugares de vivência em imagens aéreas, mapas e fotografias.', nivel: '' },
            { id: 'geo2-re3', nome: 'Localização espacial', descricao: 'Aplica princípios de localização e posição de objetos usando referenciais espaciais.', nivel: '' }
          ]
        },
        {
          id: 'natureza',
          titulo: 'Natureza, Ambientes e Qualidade de Vida',
          icone: '🌱',
          criterios: [
            { id: 'geo2-na1', nome: 'Uso dos recursos naturais', descricao: 'Reconhece importância do solo e da água, identificando usos e impactos na cidade e no campo.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-su', dimensao: 'O sujeito e seu lugar no mundo', indicadores: 'Migrações, costumes, transportes e comunicação', observacoes: '' },
        { id: 'sint-co', dimensao: 'Conexões e Escalas', indicadores: 'Hábitos, mudanças, atividades sociais', observacoes: '' },
        { id: 'sint-tr', dimensao: 'Mundo do Trabalho', indicadores: 'Atividades extrativas', observacoes: '' },
        { id: 'sint-re', dimensao: 'Representação Espacial', indicadores: 'Mapas, imagens aéreas, localização', observacoes: '' },
        { id: 'sint-na', dimensao: 'Natureza e Qualidade de Vida', indicadores: 'Uso do solo e da água', observacoes: '' }
      ]
    };
  }

  getAvaliacaoGEO3Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Geografia',
      subtitulo: '3º Ano do Ensino Fundamental',
      disciplina: 'Geografia',
      secoes: [
        {
          id: 'sujeito',
          titulo: 'O sujeito e seu lugar no mundo',
          icone: '👧',
          criterios: [
            { id: 'geo3-su1', nome: 'Cidade e campo', descricao: 'Identifica e compara aspectos culturais de grupos sociais na cidade e no campo.', nivel: '' },
            { id: 'geo3-su2', nome: 'Contribuições culturais e econômicas', descricao: 'Reconhece marcas de diferentes origens culturais e econômicas nos lugares de vivência.', nivel: '' },
            { id: 'geo3-su3', nome: 'Comunidades tradicionais', descricao: 'Reconhece modos de vida de povos e comunidades tradicionais em distintos lugares.', nivel: '' }
          ]
        },
        {
          id: 'conexoes',
          titulo: 'Conexões e Escalas',
          icone: '🌍',
          criterios: [
            { id: 'geo3-co1', nome: 'Paisagens em transformação', descricao: 'Explica como processos naturais e históricos atuam na produção e mudança das paisagens.', nivel: '' }
          ]
        },
        {
          id: 'trabalho',
          titulo: 'Mundo do Trabalho',
          icone: '🛠️',
          criterios: [
            { id: 'geo3-tr1', nome: 'Matéria-prima e indústria', descricao: 'Identifica alimentos, minerais e produtos extraídos da natureza e compara atividades de trabalho em diferentes lugares.', nivel: '' }
          ]
        },
        {
          id: 'representacao',
          titulo: 'Formas de Representação e Pensamento Espacial',
          icone: '🗺️',
          criterios: [
            { id: 'geo3-re1', nome: 'Cartografia', descricao: 'Identifica e interpreta imagens bidimensionais e tridimensionais em diferentes representações cartográficas.', nivel: '' },
            { id: 'geo3-re2', nome: 'Legendas e símbolos', descricao: 'Reconhece e elabora legendas com símbolos em diferentes escalas cartográficas.', nivel: '' }
          ]
        },
        {
          id: 'natureza',
          titulo: 'Natureza, Ambientes e Qualidade de Vida',
          icone: '🌱',
          criterios: [
            { id: 'geo3-na1', nome: 'Consumo consciente', descricao: 'Relaciona produção de lixo doméstico ou escolar a problemas ambientais e propõe soluções de redução, reúso e reciclagem.', nivel: '' },
            { id: 'geo3-na2', nome: 'Uso da água', descricao: 'Investiga usos da água em atividades cotidianas e discute problemas ambientais provocados por esses usos.', nivel: '' },
            { id: 'geo3-na3', nome: 'Cuidados com a água', descricao: 'Identifica cuidados necessários para uso da água na agricultura e geração de energia, garantindo água potável.', nivel: '' },
            { id: 'geo3-na4', nome: 'Impactos econômicos', descricao: 'Compara impactos das atividades econômicas urbanas e rurais sobre o ambiente físico natural.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-su', dimensao: 'O sujeito e seu lugar no mundo', indicadores: 'Cidade/campo, contribuições culturais, comunidades tradicionais', observacoes: '' },
        { id: 'sint-co', dimensao: 'Conexões e Escalas', indicadores: 'Paisagens naturais e antrópicas', observacoes: '' },
        { id: 'sint-tr', dimensao: 'Mundo do Trabalho', indicadores: 'Matéria-prima e indústria', observacoes: '' },
        { id: 'sint-re', dimensao: 'Representação Espacial', indicadores: 'Cartografia, legendas', observacoes: '' },
        { id: 'sint-na', dimensao: 'Natureza e Qualidade de Vida', indicadores: 'Consumo consciente, uso da água, impactos ambientais', observacoes: '' }
      ]
    };
  }

  getAvaliacaoGEO4Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Geografia',
      subtitulo: '4º Ano do Ensino Fundamental',
      disciplina: 'Geografia',
      secoes: [
        {
          id: 'sujeito',
          titulo: 'O sujeito e seu lugar no mundo',
          icone: '👧',
          criterios: [
            { id: 'geo4-su1', nome: 'Diversidade cultural', descricao: 'Seleciona elementos de distintas culturas (indígenas, afro-brasileiras, europeias etc.), valorizando suas contribuições.', nivel: '' },
            { id: 'geo4-su2', nome: 'Processos migratórios', descricao: 'Descreve migrações e suas contribuições para a formação da sociedade brasileira.', nivel: '' },
            { id: 'geo4-su3', nome: 'Poder público', descricao: 'Distingue funções dos órgãos municipais e canais de participação social (Câmara de Vereadores, Conselhos Municipais).', nivel: '' }
          ]
        },
        {
          id: 'conexoes',
          titulo: 'Conexões e Escalas',
          icone: '🌍',
          criterios: [
            { id: 'geo4-co1', nome: 'Campo e cidade', descricao: 'Reconhece especificidades e analisa interdependência entre campo e cidade (fluxos econômicos, ideias, pessoas).', nivel: '' },
            { id: 'geo4-co2', nome: 'Unidades político-administrativas', descricao: 'Distingue Distrito, Município, Unidade da Federação e regiões, localizando seus lugares de vivência.', nivel: '' },
            { id: 'geo4-co3', nome: 'Territórios étnico-culturais', descricao: 'Identifica e descreve terras indígenas e quilombolas, reconhecendo legitimidade da demarcação.', nivel: '' }
          ]
        },
        {
          id: 'trabalho',
          titulo: 'Mundo do Trabalho',
          icone: '🛠️',
          criterios: [
            { id: 'geo4-tr1', nome: 'Campo e cidade', descricao: 'Compara características do trabalho no campo e na cidade.', nivel: '' },
            { id: 'geo4-tr2', nome: 'Produção e consumo', descricao: 'Descreve e discute processos de produção, circulação e consumo de produtos.', nivel: '' }
          ]
        },
        {
          id: 'representacao',
          titulo: 'Formas de Representação e Pensamento Espacial',
          icone: '🗺️',
          criterios: [
            { id: 'geo4-re1', nome: 'Orientação', descricao: 'Utiliza direções cardeais para localizar componentes físicos e humanos em paisagens.', nivel: '' },
            { id: 'geo4-re2', nome: 'Mapas', descricao: 'Compara diferentes tipos de mapas, identificando características, finalidades e elaboradores.', nivel: '' }
          ]
        },
        {
          id: 'natureza',
          titulo: 'Natureza, Ambientes e Qualidade de Vida',
          icone: '🌱',
          criterios: [
            { id: 'geo4-na1', nome: 'Conservação e degradação', descricao: 'Identifica características das paisagens naturais e antrópicas e avalia ação humana na conservação ou degradação.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-su', dimensao: 'O sujeito e seu lugar no mundo', indicadores: 'Diversidade cultural, migrações, poder público', observacoes: '' },
        { id: 'sint-co', dimensao: 'Conexões e Escalas', indicadores: 'Campo/cidade, unidades político-administrativas, territórios étnico-culturais', observacoes: '' },
        { id: 'sint-tr', dimensao: 'Mundo do Trabalho', indicadores: 'Trabalho no campo e na cidade, produção e consumo', observacoes: '' },
        { id: 'sint-re', dimensao: 'Representação Espacial', indicadores: 'Orientação, mapas', observacoes: '' },
        { id: 'sint-na', dimensao: 'Natureza e Qualidade de Vida', indicadores: 'Conservação e degradação', observacoes: '' }
      ]
    };
  }

  getAvaliacaoGEO5Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Geografia',
      subtitulo: '5º Ano do Ensino Fundamental',
      disciplina: 'Geografia',
      secoes: [
        {
          id: 'sujeito',
          titulo: 'O sujeito e seu lugar no mundo',
          icone: '👧',
          criterios: [
            { id: 'geo5-su1', nome: 'Dinâmica populacional', descricao: 'Analisa dinâmicas populacionais na Unidade da Federação, relacionando migrações e infraestrutura.', nivel: '' },
            { id: 'geo5-su2', nome: 'Diferenças étnico-raciais e culturais', descricao: 'Identifica desigualdades sociais e diferenças étnico-raciais e étnico-culturais em diferentes territórios.', nivel: '' }
          ]
        },
        {
          id: 'conexoes',
          titulo: 'Conexões e Escalas',
          icone: '🌍',
          criterios: [
            { id: 'geo5-co1', nome: 'Urbanização', descricao: 'Identifica formas e funções das cidades e analisa mudanças sociais, econômicas e ambientais provocadas pelo crescimento urbano.', nivel: '' },
            { id: 'geo5-co2', nome: 'Campo e cidade', descricao: 'Reconhece características da cidade e analisa interações entre campo e cidade e entre cidades na rede urbana.', nivel: '' }
          ]
        },
        {
          id: 'trabalho',
          titulo: 'Mundo do Trabalho',
          icone: '🛠️',
          criterios: [
            { id: 'geo5-tr1', nome: 'Trabalho e tecnologia', descricao: 'Compara mudanças nos tipos de trabalho e desenvolvimento tecnológico na agropecuária, indústria, comércio e serviços.', nivel: '' },
            { id: 'geo5-tr2', nome: 'Transportes e comunicação', descricao: 'Identifica e compara transformações nos meios de transporte e comunicação.', nivel: '' },
            { id: 'geo5-tr3', nome: 'Energia', descricao: 'Identifica diferentes tipos de energia utilizados na produção industrial, agrícola e extrativa e no cotidiano.', nivel: '' }
          ]
        },
        {
          id: 'representacao',
          titulo: 'Formas de Representação e Pensamento Espacial',
          icone: '🗺️',
          criterios: [
            { id: 'geo5-re1', nome: 'Mapas e imagens', descricao: 'Analisa transformações das paisagens urbanas comparando fotografias, imagens aéreas e de satélite.', nivel: '' },
            { id: 'geo5-re2', nome: 'Hierarquia urbana', descricao: 'Estabelece conexões e hierarquias entre cidades utilizando mapas temáticos e representações gráficas.', nivel: '' }
          ]
        },
        {
          id: 'natureza',
          titulo: 'Natureza, Ambientes e Qualidade de Vida',
          icone: '🌱',
          criterios: [
            { id: 'geo5-na1', nome: 'Qualidade ambiental', descricao: 'Reconhece atributos da qualidade ambiental e formas de poluição em cursos de água e oceanos.', nivel: '' },
            { id: 'geo5-na2', nome: 'Problemas ambientais locais', descricao: 'Identifica problemas ambientais no entorno da escola e residência e propõe soluções.', nivel: '' },
            { id: 'geo5-na3', nome: 'Gestão pública', descricao: 'Identifica órgãos públicos e canais de participação social responsáveis pela qualidade de vida e discute propostas implementadas.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-su', dimensao: 'O sujeito e seu lugar no mundo', indicadores: 'Dinâmica populacional, diferenças étnico-raciais e culturais', observacoes: '' },
        { id: 'sint-co', dimensao: 'Conexões e Escalas', indicadores: 'Urbanização, campo e cidade', observacoes: '' },
        { id: 'sint-tr', dimensao: 'Mundo do Trabalho', indicadores: 'Trabalho, tecnologia, transportes, energia', observacoes: '' },
        { id: 'sint-re', dimensao: 'Representação Espacial', indicadores: 'Mapas, imagens de satélite, hierarquia urbana', observacoes: '' },
        { id: 'sint-na', dimensao: 'Natureza e Qualidade de Vida', indicadores: 'Qualidade ambiental, poluição, gestão pública', observacoes: '' }
      ]
    };
  }

  getAvaliacaoGEO6Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Geografia',
      subtitulo: '6º Ano do Ensino Fundamental',
      disciplina: 'Geografia',
      secoes: [
        {
          id: 'sujeito',
          titulo: 'O sujeito e seu lugar no mundo',
          icone: '👧',
          criterios: [
            { id: 'geo6-su1', nome: 'Identidade sociocultural', descricao: 'Compara modificações das paisagens nos lugares de vivência e os usos desses lugares em diferentes tempos.', nivel: '' },
            { id: 'geo6-su2', nome: 'Sociedades e paisagens', descricao: 'Analisa modificações de paisagens por diferentes tipos de sociedade, com destaque para povos originários.', nivel: '' }
          ]
        },
        {
          id: 'conexoes',
          titulo: 'Conexões e Escalas',
          icone: '🌍',
          criterios: [
            { id: 'geo6-co1', nome: 'Movimentos da Terra', descricao: 'Descreve movimentos do planeta e sua relação com circulação atmosférica, tempo e padrões climáticos.', nivel: '' },
            { id: 'geo6-co2', nome: 'Ciclo da água', descricao: 'Explica ciclo hidrológico, comparando escoamento urbano e rural, e reconhece componentes das bacias hidrográficas.', nivel: '' },
            { id: 'geo6-co3', nome: 'Clima e natureza', descricao: 'Relaciona padrões climáticos com tipos de solo, relevo e formações vegetais.', nivel: '' }
          ]
        },
        {
          id: 'trabalho',
          titulo: 'Mundo do Trabalho',
          icone: '🛠️',
          criterios: [
            { id: 'geo6-tr1', nome: 'Paisagens transformadas', descricao: 'Identifica características das paisagens transformadas pelo trabalho humano (agropecuária, industrialização).', nivel: '' },
            { id: 'geo6-tr2', nome: 'Urbanização', descricao: 'Explica mudanças na interação humana com a natureza a partir do surgimento das cidades.', nivel: '' }
          ]
        },
        {
          id: 'representacao',
          titulo: 'Formas de Representação e Pensamento Espacial',
          icone: '🗺️',
          criterios: [
            { id: 'geo6-re1', nome: 'Escalas gráficas e numéricas', descricao: 'Mede distâncias na superfície usando escalas gráficas e numéricas dos mapas.', nivel: '' },
            { id: 'geo6-re2', nome: 'Modelos tridimensionais', descricao: 'Elabora blocos-diagramas, perfis topográficos e de vegetação para representar elementos da superfície terrestre.', nivel: '' }
          ]
        },
        {
          id: 'natureza',
          titulo: 'Natureza, Ambientes e Qualidade de Vida',
          icone: '🌱',
          criterios: [
            { id: 'geo6-na1', nome: 'Uso do solo e recursos hídricos', descricao: 'Explica diferentes formas de uso do solo e apropriação de recursos hídricos, avaliando vantagens e desvantagens.', nivel: '' },
            { id: 'geo6-na2', nome: 'Interações sociedade-natureza', descricao: 'Analisa interações das sociedades com a natureza, incluindo transformações da biodiversidade local e mundial.', nivel: '' },
            { id: 'geo6-na3', nome: 'Consumo de água', descricao: 'Identifica consumo dos recursos hídricos e uso das principais bacias hidrográficas no Brasil e no mundo.', nivel: '' },
            { id: 'geo6-na4', nome: 'Dinâmica climática', descricao: 'Analisa consequências das práticas humanas na dinâmica climática (ex.: ilhas de calor).', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-su', dimensao: 'O sujeito e seu lugar no mundo', indicadores: 'Identidade sociocultural, sociedades e paisagens', observacoes: '' },
        { id: 'sint-co', dimensao: 'Conexões e Escalas', indicadores: 'Movimentos da Terra, ciclo da água, clima', observacoes: '' },
        { id: 'sint-tr', dimensao: 'Mundo do Trabalho', indicadores: 'Paisagens transformadas, urbanização', observacoes: '' },
        { id: 'sint-re', dimensao: 'Representação Espacial', indicadores: 'Escalas, modelos tridimensionais', observacoes: '' },
        { id: 'sint-na', dimensao: 'Natureza e Qualidade de Vida', indicadores: 'Uso do solo, recursos hídricos, biodiversidade, clima', observacoes: '' }
      ]
    };
  }

  getAvaliacaoGEO7Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Geografia',
      subtitulo: '7º Ano do Ensino Fundamental',
      disciplina: 'Geografia',
      secoes: [
        {
          id: 'sujeito',
          titulo: 'O sujeito e seu lugar no mundo',
          icone: '👧',
          criterios: [
            { id: 'geo7-su1', nome: 'Formação territorial do Brasil', descricao: 'Avalia ideias e estereótipos sobre paisagens e formação territorial do Brasil.', nivel: '' },
            { id: 'geo7-su2', nome: 'Fluxos econômicos e populacionais', descricao: 'Analisa influência dos fluxos econômicos e populacionais na formação socioeconômica e territorial.', nivel: '' },
            { id: 'geo7-su3', nome: 'Territorialidades', descricao: 'Reconhece direitos legais de povos indígenas, quilombolas, ribeirinhos, caiçaras e outros grupos sociais.', nivel: '' }
          ]
        },
        {
          id: 'conexoes',
          titulo: 'Conexões e Escalas',
          icone: '🌍',
          criterios: [
            { id: 'geo7-co1', nome: 'População brasileira', descricao: 'Analisa distribuição territorial da população considerando diversidade étnico-cultural, renda, sexo e idade.', nivel: '' },
            { id: 'geo7-co2', nome: 'Mercantilismo e capitalismo', descricao: 'Analisa alterações entre o período mercantilista e o advento do capitalismo.', nivel: '' }
          ]
        },
        {
          id: 'trabalho',
          titulo: 'Mundo do Trabalho',
          icone: '🛠️',
          criterios: [
            { id: 'geo7-tr1', nome: 'Produção e consumo', descricao: 'Discute impactos ambientais e sociais da produção, circulação e consumo de mercadorias.', nivel: '' },
            { id: 'geo7-tr2', nome: 'Redes de transporte e comunicação', descricao: 'Analisa papel das redes de transporte e comunicação na configuração do território brasileiro.', nivel: '' },
            { id: 'geo7-tr3', nome: 'Industrialização e inovação', descricao: 'Relaciona industrialização e inovação tecnológica às transformações socioeconômicas do Brasil.', nivel: '' }
          ]
        },
        {
          id: 'representacao',
          titulo: 'Formas de Representação e Pensamento Espacial',
          icone: '🗺️',
          criterios: [
            { id: 'geo7-re1', nome: 'Mapas temáticos', descricao: 'Interpreta e elabora mapas temáticos e históricos, inclusive digitais, com dados demográficos e econômicos.', nivel: '' },
            { id: 'geo7-re2', nome: 'Gráficos', descricao: 'Elabora e interpreta gráficos de barras, setores e histogramas com dados socioeconômicos das regiões brasileiras.', nivel: '' }
          ]
        },
        {
          id: 'natureza',
          titulo: 'Natureza, Ambientes e Qualidade de Vida',
          icone: '🌱',
          criterios: [
            { id: 'geo7-na1', nome: 'Biodiversidade brasileira', descricao: 'Caracteriza dinâmicas dos componentes físico-naturais e biodiversidade (Florestas Tropicais, Cerrados, Caatingas etc.).', nivel: '' },
            { id: 'geo7-na2', nome: 'Unidades de conservação', descricao: 'Compara unidades de conservação locais e nacionais com base no Sistema Nacional de Unidades de Conservação (SNUC).', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-su', dimensao: 'O sujeito e seu lugar no mundo', indicadores: 'Formação territorial, fluxos econômicos, territorialidades', observacoes: '' },
        { id: 'sint-co', dimensao: 'Conexões e Escalas', indicadores: 'População brasileira, mercantilismo e capitalismo', observacoes: '' },
        { id: 'sint-tr', dimensao: 'Mundo do Trabalho', indicadores: 'Produção, consumo, redes de transporte, industrialização', observacoes: '' },
        { id: 'sint-re', dimensao: 'Representação Espacial', indicadores: 'Mapas temáticos, gráficos', observacoes: '' },
        { id: 'sint-na', dimensao: 'Natureza e Qualidade de Vida', indicadores: 'Biodiversidade, unidades de conservação', observacoes: '' }
      ]
    };
  }

  getAvaliacaoGEO8Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Geografia',
      subtitulo: '8º Ano do Ensino Fundamental',
      disciplina: 'Geografia',
      secoes: [
        {
          id: 'sujeito',
          titulo: 'O sujeito e seu lugar no mundo',
          icone: '👧',
          criterios: [
            { id: 'geo8-su1', nome: 'Distribuição populacional', descricao: 'Descreve rotas de dispersão da população humana e principais fluxos migratórios na história.', nivel: '' },
            { id: 'geo8-su2', nome: 'História local e global', descricao: 'Relaciona fatos da história das famílias da comunidade com fluxos migratórios mundiais.', nivel: '' },
            { id: 'geo8-su3', nome: 'Dinâmica demográfica', descricao: 'Analisa perfil etário, crescimento vegetativo e mobilidade espacial da população.', nivel: '' },
            { id: 'geo8-su4', nome: 'Migração na América Latina', descricao: 'Compreende fluxos migratórios voluntários e forçados, áreas de expulsão/atração e políticas migratórias.', nivel: '' },
            { id: 'geo8-su5', nome: 'Trabalho e tecnologia', descricao: 'Analisa influência do desenvolvimento científico e tecnológico nos tipos de trabalho e na economia urbana e rural da América e África.', nivel: '' },
            { id: 'geo8-su6', nome: 'Economia global', descricao: 'Analisa processos de desconcentração, descentralização e recentralização das atividades econômicas a partir do capital estadunidense e chinês.', nivel: '' }
          ]
        },
        {
          id: 'conexoes',
          titulo: 'Conexões e Escalas',
          icone: '🌍',
          criterios: [
            { id: 'geo8-co1', nome: 'Conceitos geopolíticos', descricao: 'Aplica conceitos de Estado, nação, território e governo para entender conflitos contemporâneos na América e África.', nivel: '' },
            { id: 'geo8-co2', nome: 'Organizações mundiais', descricao: 'Analisa atuação de organismos internacionais nos processos de integração cultural e econômica.', nivel: '' },
            { id: 'geo8-co3', nome: 'Potências globais', descricao: 'Avalia impactos da ascensão dos EUA e sua relação com China e Brasil.', nivel: '' },
            { id: 'geo8-co4', nome: 'Ordem mundial pós-guerra', descricao: 'Analisa situação do Brasil, América Latina, África e EUA na ordem mundial pós-guerra.', nivel: '' },
            { id: 'geo8-co5', nome: 'Economia mundial', descricao: 'Analisa padrões de produção, distribuição e intercâmbio de produtos agrícolas e industrializados (EUA e BRICS).', nivel: '' },
            { id: 'geo8-co6', nome: 'Movimentos sociais', descricao: 'Distingue e compara movimentos sociais brasileiros e latino-americanos.', nivel: '' },
            { id: 'geo8-co7', nome: 'Conflitos de fronteira', descricao: 'Analisa áreas de conflito nas fronteiras latino-americanas e papel de organismos de cooperação.', nivel: '' },
            { id: 'geo8-co8', nome: 'Integração regional', descricao: 'Compreende objetivos e importância de organismos como Mercosul, OEA, Nafta, Unasul, Alba etc.', nivel: '' },
            { id: 'geo8-co9', nome: 'Recursos hídricos', descricao: 'Avalia importância dos principais recursos hídricos da América Latina e discute desafios de gestão e comercialização da água.', nivel: '' },
            { id: 'geo8-co10', nome: 'Grandes cidades', descricao: 'Analisa problemáticas comuns às grandes cidades latino-americanas (população, condições de vida e trabalho).', nivel: '' },
            { id: 'geo8-co11', nome: 'Segregação socioespacial', descricao: 'Analisa segregação urbana em favelas, alagados e zonas de risco.', nivel: '' }
          ]
        },
        {
          id: 'trabalho',
          titulo: 'Mundo do Trabalho',
          icone: '🛠️',
          criterios: [
            { id: 'geo8-tr1', nome: 'Representações cartográficas', descricao: 'Elabora mapas e representações para analisar redes urbanas e rurais, ordenamento territorial e usos do solo.', nivel: '' },
            { id: 'geo8-tr2', nome: 'Cartogramas e croquis', descricao: 'Interpreta cartogramas, croquis e anamorfoses geográficas sobre América e África.', nivel: '' },
            { id: 'geo8-tr3', nome: 'Produção e desigualdades', descricao: 'Analisa características populacionais, urbanas, políticas e econômicas dos países da América e África, discutindo desigualdades e pressões sobre a natureza.', nivel: '' }
          ]
        },
        {
          id: 'representacao',
          titulo: 'Formas de Representação e Pensamento Espacial',
          icone: '🗺️',
          criterios: [
            { id: 'geo8-re1', nome: 'Antártica', descricao: 'Analisa papel ambiental e territorial da Antártica no contexto geopolítico e sua relevância para a América do Sul.', nivel: '' },
            { id: 'geo8-re2', nome: 'Recursos naturais', descricao: 'Identifica principais recursos naturais da América Latina e sua relevância para produção e cooperação no Mercosul.', nivel: '' },
            { id: 'geo8-re3', nome: 'Paisagens latino-americanas', descricao: 'Associa paisagens da América Latina aos povos da região, considerando geomorfologia, biogeografia e climatologia.', nivel: '' },
            { id: 'geo8-re4', nome: 'Produção regional', descricao: 'Analisa características produtivas dos países latino-americanos (mineração, agricultura, indústria, pecuária etc.).', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-su', dimensao: 'O sujeito e seu lugar no mundo', indicadores: 'Distribuição populacional, migrações, trabalho, economia global', observacoes: '' },
        { id: 'sint-co', dimensao: 'Conexões e Escalas', indicadores: 'Geopolítica, organismos internacionais, potências globais, cidades, segregação', observacoes: '' },
        { id: 'sint-tr', dimensao: 'Mundo do Trabalho', indicadores: 'Representações cartográficas, desigualdades', observacoes: '' },
        { id: 'sint-re', dimensao: 'Representação Espacial', indicadores: 'Antártica, recursos naturais, paisagens, produção', observacoes: '' }
      ]
    };
  }

  getAvaliacaoGEO9Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de Geografia',
      subtitulo: '9º Ano do Ensino Fundamental',
      disciplina: 'Geografia',
      secoes: [
        {
          id: 'sujeito',
          titulo: 'O sujeito e seu lugar no mundo',
          icone: '👧',
          criterios: [
            { id: 'geo9-su1', nome: 'Hegemonia europeia', descricao: 'Analisa criticamente como a hegemonia europeia foi exercida em diferentes regiões e tempos.', nivel: '' },
            { id: 'geo9-su2', nome: 'Corporações internacionais', descricao: 'Avalia atuação das corporações e organizações econômicas mundiais no consumo, cultura e mobilidade.', nivel: '' },
            { id: 'geo9-su3', nome: 'Manifestações culturais', descricao: 'Identifica manifestações culturais de minorias étnicas, defendendo respeito às diferenças.', nivel: '' }
          ]
        },
        {
          id: 'conexoes',
          titulo: 'Conexões e Escalas',
          icone: '🌍',
          criterios: [
            { id: 'geo9-co1', nome: 'Globalização e mundialização', descricao: 'Compara interpretações sobre integração mundial (econômica, política e cultural).', nivel: '' },
            { id: 'geo9-co2', nome: 'Ocidente e Oriente', descricao: 'Relaciona divisão do mundo com o Sistema Colonial europeu.', nivel: '' },
            { id: 'geo9-co3', nome: 'Eurásia', descricao: 'Analisa componentes físico-naturais e determinantes histórico-geográficos da divisão Europa/Ásia.', nivel: '' },
            { id: 'geo9-co4', nome: 'Transformações territoriais', descricao: 'Analisa fronteiras, tensões e conflitos na Europa, Ásia e Oceania.', nivel: '' },
            { id: 'geo9-co5', nome: 'Aspectos populacionais e econômicos', descricao: 'Analisa características de países europeus, asiáticos e da Oceania, discutindo desigualdades e pressões ambientais.', nivel: '' }
          ]
        },
        {
          id: 'trabalho',
          titulo: 'Mundo do Trabalho',
          icone: '🛠️',
          criterios: [
            { id: 'geo9-tr1', nome: 'Industrialização', descricao: 'Analisa impactos da industrialização na produção e circulação de produtos e culturas.', nivel: '' },
            { id: 'geo9-tr2', nome: 'Trabalho e ciência', descricao: 'Relaciona mudanças técnicas e científicas da industrialização às transformações no trabalho e suas consequências no Brasil.', nivel: '' },
            { id: 'geo9-tr3', nome: 'Urbanização', descricao: 'Relaciona urbanização às transformações agropecuárias, desemprego estrutural e papel do capital financeiro.', nivel: '' },
            { id: 'geo9-tr4', nome: 'Agropecuária', descricao: 'Analisa importância da produção agropecuária na sociedade urbano-industrial e desigualdade mundial de acesso a alimentos.', nivel: '' }
          ]
        },
        {
          id: 'representacao',
          titulo: 'Formas de Representação e Pensamento Espacial',
          icone: '🗺️',
          criterios: [
            { id: 'geo9-re1', nome: 'Mapas e gráficos', descricao: 'Elabora e interpreta gráficos, mapas temáticos, croquis e anamorfoses geográficas para analisar desigualdades mundiais.', nivel: '' },
            { id: 'geo9-re2', nome: 'Regiões do mundo', descricao: 'Compara e classifica regiões com base em informações populacionais, econômicas e socioambientais.', nivel: '' }
          ]
        },
        {
          id: 'natureza',
          titulo: 'Natureza, Ambientes e Qualidade de Vida',
          icone: '🌱',
          criterios: [
            { id: 'geo9-na1', nome: 'Domínios morfoclimáticos', descricao: 'Identifica e compara domínios morfoclimáticos da Europa, Ásia e Oceania.', nivel: '' },
            { id: 'geo9-na2', nome: 'Uso da terra', descricao: 'Explica características físico-naturais e formas de ocupação e uso da terra em diferentes regiões.', nivel: '' },
            { id: 'geo9-na3', nome: 'Recursos naturais e energia', descricao: 'Analisa cadeias industriais e consequências do uso de recursos naturais e fontes de energia (hidrelétrica, eólica, nuclear etc.).', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-su', dimensao: 'O sujeito e seu lugar no mundo', indicadores: 'Hegemonia europeia, corporações, manifestações culturais', observacoes: '' },
        { id: 'sint-co', dimensao: 'Conexões e Escalas', indicadores: 'Globalização, Ocidente/Oriente, Eurásia, transformações territoriais', observacoes: '' },
        { id: 'sint-tr', dimensao: 'Mundo do Trabalho', indicadores: 'Industrialização, urbanização, agropecuária', observacoes: '' },
        { id: 'sint-re', dimensao: 'Representação Espacial', indicadores: 'Mapas, gráficos, classificação de regiões', observacoes: '' },
        { id: 'sint-na', dimensao: 'Natureza e Qualidade de Vida', indicadores: 'Domínios morfoclimáticos, uso da terra, energia', observacoes: '' }
      ]
    };
  }

  getAvaliacaoHIST1Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de História',
      subtitulo: '1º Ano do Ensino Fundamental',
      disciplina: 'História',
      secoes: [
        {
          id: 'mundo-lugar',
          titulo: 'Mundo pessoal: meu lugar no mundo',
          icone: '👧',
          criterios: [
            { id: 'hist1-ml1', nome: 'Crescimento pessoal', descricao: 'Identifica aspectos do próprio crescimento por meio de lembranças pessoais ou familiares.', nivel: '' },
            { id: 'hist1-ml2', nome: 'Histórias familiares e comunitárias', descricao: 'Relaciona suas histórias às da família e comunidade.', nivel: '' },
            { id: 'hist1-ml3', nome: 'Papéis e responsabilidades', descricao: 'Descreve e distingue responsabilidades na família, escola e comunidade.', nivel: '' },
            { id: 'hist1-ml4', nome: 'Ambientes de vivência', descricao: 'Reconhece diferenças entre ambientes doméstico, escolar e comunitário, identificando hábitos e regras.', nivel: '' }
          ]
        },
        {
          id: 'mundo-tempo',
          titulo: 'Mundo pessoal: eu, meu grupo social e meu tempo',
          icone: '🌍',
          criterios: [
            { id: 'hist1-mt1', nome: 'Jogos e brincadeiras', descricao: 'Identifica semelhanças e diferenças entre brincadeiras atuais e de outras épocas e lugares.', nivel: '' },
            { id: 'hist1-mt2', nome: 'Histórias da família e escola', descricao: 'Conhece histórias da família e da escola e identifica papéis desempenhados por diferentes sujeitos.', nivel: '' },
            { id: 'hist1-mt3', nome: 'Organização familiar', descricao: 'Identifica mudanças e permanências nas formas de organização familiar.', nivel: '' },
            { id: 'hist1-mt4', nome: 'Comemorações', descricao: 'Reconhece significado das festas escolares e diferencia das comemorações familiares e comunitárias.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-ml', dimensao: 'Mundo pessoal: meu lugar no mundo', indicadores: 'Crescimento, histórias familiares, papéis sociais, ambientes', observacoes: '' },
        { id: 'sint-mt', dimensao: 'Mundo pessoal: eu, meu grupo social e meu tempo', indicadores: 'Brincadeiras, histórias, organização familiar, comemorações', observacoes: '' }
      ]
    };
  }

  getAvaliacaoHIST2Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de História',
      subtitulo: '2º Ano do Ensino Fundamental',
      disciplina: 'História',
      secoes: [
        {
          id: 'comunidade-registros',
          titulo: 'A comunidade e seus registros',
          icone: '👧',
          criterios: [
            { id: 'hist2-cr1', nome: 'Sociabilidade', descricao: 'Reconhece espaços de convivência e identifica motivos que aproximam ou separam pessoas em grupos sociais.', nivel: '' },
            { id: 'hist2-cr2', nome: 'Papéis sociais', descricao: 'Identifica e descreve práticas e papéis sociais em diferentes comunidades.', nivel: '' },
            { id: 'hist2-cr3', nome: 'Memória e pertencimento', descricao: 'Seleciona situações cotidianas que remetem à percepção de mudança, pertencimento e memória.', nivel: '' },
            { id: 'hist2-cr4', nome: 'Objetos e documentos pessoais', descricao: 'Compreende significado de objetos e documentos como fontes de memória e história.', nivel: '' }
          ]
        },
        {
          id: 'tempo-medida',
          titulo: 'O tempo como medida',
          icone: '🌍',
          criterios: [
            { id: 'hist2-tm1', nome: 'Fontes históricas', descricao: 'Seleciona objetos e documentos pessoais e comunitários, compreendendo função e significado.', nivel: '' },
            { id: 'hist2-tm2', nome: 'Organização temporal', descricao: 'Organiza fatos cotidianos usando noções de tempo (antes, durante, depois).', nivel: '' },
            { id: 'hist2-tm3', nome: 'Marcadores do tempo', descricao: 'Identifica e utiliza relógio, calendário e outros marcadores temporais da comunidade.', nivel: '' },
            { id: 'hist2-tm4', nome: 'Histórias registradas', descricao: 'Compila histórias da família e/ou comunidade registradas em diferentes fontes.', nivel: '' },
            { id: 'hist2-tm5', nome: 'Preservação de objetos', descricao: 'Identifica objetos que remetem à experiência familiar ou comunitária e discute razões de preservação ou descarte.', nivel: '' }
          ]
        },
        {
          id: 'trabalho-sustentabilidade',
          titulo: 'O trabalho e a sustentabilidade na comunidade',
          icone: '🛠️',
          criterios: [
            { id: 'hist2-ts1', nome: 'Formas de trabalho', descricao: 'Identifica diferentes formas de trabalho na comunidade, seus significados e importância.', nivel: '' },
            { id: 'hist2-ts2', nome: 'Impactos ambientais', descricao: 'Reconhece impactos no ambiente causados pelas formas de trabalho existentes na comunidade.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-cr', dimensao: 'A comunidade e seus registros', indicadores: 'Sociabilidade, papéis sociais, memória, objetos/documentos', observacoes: '' },
        { id: 'sint-tm', dimensao: 'O tempo como medida', indicadores: 'Fontes históricas, organização temporal, marcadores, preservação', observacoes: '' },
        { id: 'sint-ts', dimensao: 'Trabalho e sustentabilidade', indicadores: 'Formas de trabalho, impactos ambientais', observacoes: '' }
      ]
    };
  }

  getAvaliacaoHIST3Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de História',
      subtitulo: '3º Ano do Ensino Fundamental',
      disciplina: 'História',
      secoes: [
        {
          id: 'grupos-cidade',
          titulo: 'As pessoas e os grupos que compõem a cidade e o município',
          icone: '👧',
          criterios: [
            { id: 'hist3-gc1', nome: 'Grupos populacionais', descricao: 'Identifica grupos que formam a cidade/município e os eventos que marcam sua formação (migrações, empresas, desmatamentos).', nivel: '' },
            { id: 'hist3-gc2', nome: 'Acontecimentos locais', descricao: 'Registra acontecimentos da cidade ou região por meio de diferentes fontes.', nivel: '' },
            { id: 'hist3-gc3', nome: 'Pontos de vista', descricao: 'Compara diferentes perspectivas sobre eventos significativos, destacando culturas africanas, indígenas e migrantes.', nivel: '' }
          ]
        },
        {
          id: 'lugar-vive',
          titulo: 'O lugar em que vive',
          icone: '🌍',
          criterios: [
            { id: 'hist3-lv1', nome: 'Patrimônios históricos e culturais', descricao: 'Identifica patrimônios da cidade/região e discute razões culturais, sociais e políticas para sua preservação.', nivel: '' },
            { id: 'hist3-lv2', nome: 'Marcos históricos', descricao: 'Reconhece marcos históricos locais e compreende seus significados.', nivel: '' },
            { id: 'hist3-lv3', nome: 'Memória urbana', descricao: 'Identifica registros de memória (nomes de ruas, monumentos, edifícios) e discute critérios de escolha.', nivel: '' },
            { id: 'hist3-lv4', nome: 'Comunidades locais', descricao: 'Compara semelhanças e diferenças entre comunidades da cidade/região e descreve papel dos grupos sociais.', nivel: '' },
            { id: 'hist3-lv5', nome: 'Cidade e campo', descricao: 'Identifica modos de vida urbanos e rurais no presente e compara com os do passado.', nivel: '' }
          ]
        },
        {
          id: 'espaco-publico',
          titulo: 'A noção de espaço público e privado',
          icone: '🛠️',
          criterios: [
            { id: 'hist3-ep1', nome: 'Espaços públicos', descricao: 'Mapeia espaços públicos (ruas, praças, escolas, hospitais, prefeitura etc.) e identifica suas funções.', nivel: '' },
            { id: 'hist3-ep2', nome: 'Espaços privados e conservação', descricao: 'Diferencia espaço doméstico, público e áreas de conservação ambiental, reconhecendo sua importância.', nivel: '' }
          ]
        },
        {
          id: 'cidade-atividades',
          titulo: 'A cidade e suas atividades',
          icone: '🎭',
          criterios: [
            { id: 'hist3-ca1', nome: 'Trabalho urbano e rural', descricao: 'Identifica diferenças entre formas de trabalho na cidade e no campo, considerando uso da tecnologia.', nivel: '' },
            { id: 'hist3-ca2', nome: 'Trabalho e lazer', descricao: 'Compara relações de trabalho e lazer do presente com as de outros tempos e espaços, analisando mudanças e permanências.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-gc', dimensao: 'Cidade e município', indicadores: 'Grupos populacionais, acontecimentos, pontos de vista', observacoes: '' },
        { id: 'sint-lv', dimensao: 'Lugar em que vive', indicadores: 'Patrimônios, marcos históricos, memória urbana, comunidades, cidade/campo', observacoes: '' },
        { id: 'sint-ep', dimensao: 'Espaço público e privado', indicadores: 'Mapeamento, conservação', observacoes: '' },
        { id: 'sint-ca', dimensao: 'Atividades da cidade', indicadores: 'Trabalho urbano/rural, lazer', observacoes: '' }
      ]
    };
  }

  getAvaliacaoHIST4Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de História',
      subtitulo: '4º Ano do Ensino Fundamental',
      disciplina: 'História',
      secoes: [
        {
          id: 'transformacoes-permanencias',
          titulo: 'Transformações e permanências nas trajetórias dos grupos humanos',
          icone: '👧',
          criterios: [
            { id: 'hist4-tp1', nome: 'História como ação humana', descricao: 'Reconhece a história como resultado da ação do ser humano no tempo e espaço.', nivel: '' },
            { id: 'hist4-tp2', nome: 'Marcos históricos da humanidade', descricao: 'Identifica mudanças e permanências em grandes marcos (nomadismo, agricultura, indústria etc.).', nivel: '' },
            { id: 'hist4-tp3', nome: 'Transformações urbanas', descricao: 'Analisa mudanças na cidade ao longo do tempo e seus impactos nos modos de vida.', nivel: '' }
          ]
        },
        {
          id: 'circulacao-pessoas',
          titulo: 'Circulação de pessoas, produtos e culturas',
          icone: '🌍',
          criterios: [
            { id: 'hist4-cp1', nome: 'Nomadismo e fixação', descricao: 'Discute significado do nomadismo e da fixação das primeiras comunidades humanas.', nivel: '' },
            { id: 'hist4-cp2', nome: 'Ocupação do campo', descricao: 'Relaciona processos de ocupação do campo às intervenções na natureza e seus resultados.', nivel: '' },
            { id: 'hist4-cp3', nome: 'Deslocamentos e mercadorias', descricao: 'Identifica transformações nos deslocamentos de pessoas e mercadorias e suas consequências.', nivel: '' },
            { id: 'hist4-cp4', nome: 'Rotas comerciais', descricao: 'Descreve importância dos caminhos terrestres, fluviais e marítimos para a vida comercial.', nivel: '' },
            { id: 'hist4-cp5', nome: 'Meios de comunicação', descricao: 'Identifica transformações nos meios de comunicação (oralidade, imprensa, rádio, TV, internet) e discute significados sociais.', nivel: '' }
          ]
        },
        {
          id: 'migracoes',
          titulo: 'Questões históricas relativas às migrações',
          icone: '🛠️',
          criterios: [
            { id: 'hist4-mi1', nome: 'Motivações migratórias', descricao: 'Identifica motivações dos processos migratórios em diferentes tempos e espaços.', nivel: '' },
            { id: 'hist4-mi2', nome: 'Fluxos populacionais', descricao: 'Analisa diferentes fluxos populacionais e suas contribuições para a formação da sociedade brasileira.', nivel: '' },
            { id: 'hist4-mi3', nome: 'Migração interna e internacional', descricao: 'Avalia mudanças associadas à migração na sociedade atual.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-tp', dimensao: 'Transformações e permanências', indicadores: 'História como ação humana, marcos históricos, transformações urbanas', observacoes: '' },
        { id: 'sint-cp', dimensao: 'Circulação de pessoas e culturas', indicadores: 'Nomadismo, ocupação do campo, deslocamentos, rotas comerciais, comunicação', observacoes: '' },
        { id: 'sint-mi', dimensao: 'Migrações', indicadores: 'Motivações, fluxos populacionais, migração interna/internacional', observacoes: '' }
      ]
    };
  }

  getAvaliacaoHIST5Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de História',
      subtitulo: '5º Ano do Ensino Fundamental',
      disciplina: 'História',
      secoes: [
        {
          id: 'povos-culturas',
          titulo: 'Povos e culturas: meu lugar no mundo e meu grupo social',
          icone: '👧',
          criterios: [
            { id: 'hist5-pc1', nome: 'Formação dos povos', descricao: 'Identifica processos de formação das culturas e povos, relacionando-os ao espaço geográfico ocupado.', nivel: '' },
            { id: 'hist5-pc2', nome: 'Organização política', descricao: 'Reconhece mecanismos de organização do poder político e compreende a ideia de Estado e outras formas de ordenação social.', nivel: '' },
            { id: 'hist5-pc3', nome: 'Culturas e religiões', descricao: 'Analisa papel das culturas e religiões na identidade dos povos antigos.', nivel: '' },
            { id: 'hist5-pc4', nome: 'Cidadania e diversidade', descricao: 'Associa cidadania ao respeito à diversidade, pluralidade e direitos humanos.', nivel: '' },
            { id: 'hist5-pc5', nome: 'Cidadania como conquista histórica', descricao: 'Relaciona cidadania à conquista de direitos dos povos e sociedades.', nivel: '' }
          ]
        },
        {
          id: 'registros-historia',
          titulo: 'Registros da história: linguagens e culturas',
          icone: '🌍',
          criterios: [
            { id: 'hist5-rh1', nome: 'Linguagens e tecnologias', descricao: 'Compara diferentes linguagens e tecnologias de comunicação, avaliando significados sociais, políticos e culturais.', nivel: '' },
            { id: 'hist5-rh2', nome: 'Marcos de memória', descricao: 'Identifica processos de produção, hierarquização e difusão dos marcos de memória, discutindo presença/ausência de grupos sociais.', nivel: '' },
            { id: 'hist5-rh3', nome: 'Marcação do tempo', descricao: 'Identifica formas de marcação do tempo em diferentes sociedades (indígenas, africanas etc.).', nivel: '' },
            { id: 'hist5-rh4', nome: 'Fontes históricas', descricao: 'Compara pontos de vista sobre temas atuais usando diferentes fontes, incluindo relatos orais.', nivel: '' },
            { id: 'hist5-rh5', nome: 'Patrimônios da humanidade', descricao: 'Inventaria patrimônios materiais e imateriais e analisa mudanças e permanências ao longo do tempo.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-pc', dimensao: 'Povos e culturas', indicadores: 'Formação, organização política, culturas, cidadania', observacoes: '' },
        { id: 'sint-rh', dimensao: 'Registros da história', indicadores: 'Linguagens, marcos de memória, marcação do tempo, fontes, patrimônios', observacoes: '' }
      ]
    };
  }

  getAvaliacaoHIST6Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de História',
      subtitulo: '6º Ano do Ensino Fundamental',
      disciplina: 'História',
      secoes: [
        {
          id: 'tempo-registros',
          titulo: 'História: tempo, espaço e formas de registros',
          icone: '👧',
          criterios: [
            { id: 'hist6-tr1', nome: 'Noção de tempo', descricao: 'Identifica diferentes formas de compreensão do tempo e periodização histórica (continuidades e rupturas).', nivel: '' },
            { id: 'hist6-tr2', nome: 'Fontes históricas', descricao: 'Analisa significado das fontes e formas de registro em diferentes sociedades e épocas.', nivel: '' },
            { id: 'hist6-tr3', nome: 'Origens da humanidade', descricao: 'Reconhece hipóteses científicas sobre surgimento da espécie humana e analisa mitos de fundação.', nivel: '' },
            { id: 'hist6-tr4', nome: 'Homem americano', descricao: 'Conhece teorias sobre a origem do homem americano.', nivel: '' }
          ]
        },
        {
          id: 'antiguidade-classico',
          titulo: 'Povos da Antiguidade e Mundo Clássico',
          icone: '🌍',
          criterios: [
            { id: 'hist6-ac1', nome: 'Paisagens e sociedades', descricao: 'Descreve modificações da natureza e paisagem por diferentes sociedades (indígenas e africanos).', nivel: '' },
            { id: 'hist6-ac2', nome: 'Rotas de povoamento', descricao: 'Identifica geograficamente rotas de povoamento no território americano.', nivel: '' },
            { id: 'hist6-ac3', nome: 'Sociedades antigas', descricao: 'Reconhece registros culturais e materiais de sociedades africanas, mesopotâmicas e americanas pré-colombianas.', nivel: '' },
            { id: 'hist6-ac4', nome: 'Astecas, maias e incas', descricao: 'Identifica espaços ocupados e aportes culturais, científicos e sociais desses povos e indígenas brasileiros.', nivel: '' },
            { id: 'hist6-ac5', nome: 'Antiguidade Clássica', descricao: 'Discute conceito, alcance e limites da tradição ocidental e seus impactos em outras culturas.', nivel: '' },
            { id: 'hist6-ac6', nome: 'Grécia Antiga', descricao: 'Explica formação da pólis e transformações políticas, sociais e culturais.', nivel: '' },
            { id: 'hist6-ac7', nome: 'Roma Antiga', descricao: 'Caracteriza formação de Roma e suas configurações sociais e políticas nos períodos monárquico e republicano.', nivel: '' },
            { id: 'hist6-ac8', nome: 'Cidadania', descricao: 'Associa conceito de cidadania às dinâmicas de inclusão e exclusão na Grécia e Roma.', nivel: '' },
            { id: 'hist6-ac9', nome: 'Império', descricao: 'Conceitua "império" e analisa lógicas de conquista, conflito e negociação.', nivel: '' }
          ]
        },
        {
          id: 'antigo-medieval',
          titulo: 'Do mundo antigo ao medieval',
          icone: '🛠️',
          criterios: [
            { id: 'hist6-am1', nome: 'Contatos e exclusões', descricao: 'Analisa diferentes formas de contato, adaptação ou exclusão entre populações.', nivel: '' },
            { id: 'hist6-am2', nome: 'Mediterrâneo', descricao: 'Descreve circulação de pessoas, produtos e culturas no Mediterrâneo e seus significados.', nivel: '' },
            { id: 'hist6-am3', nome: 'Trabalho e sociedade', descricao: 'Compara formas de organização do trabalho e vida social (senhores e servos).', nivel: '' },
            { id: 'hist6-am4', nome: 'Escravidão e servidão', descricao: 'Diferencia escravidão, servidão e trabalho livre no mundo antigo e medieval.', nivel: '' },
            { id: 'hist6-am5', nome: 'Religião cristã', descricao: 'Analisa papel da religião cristã na cultura e organização social medieval.', nivel: '' },
            { id: 'hist6-am6', nome: 'Mulheres na história', descricao: 'Descreve papéis sociais das mulheres na Grécia, Roma e sociedades medievais.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-tr', dimensao: 'Tempo e registros', indicadores: 'Noção de tempo, fontes, origens da humanidade', observacoes: '' },
        { id: 'sint-ac', dimensao: 'Antiguidade e Mundo Clássico', indicadores: 'Povos antigos, Grécia, Roma, cidadania, império', observacoes: '' },
        { id: 'sint-am', dimensao: 'Mundo medieval', indicadores: 'Contatos, Mediterrâneo, trabalho, escravidão, religião, mulheres', observacoes: '' }
      ]
    };
  }

  getAvaliacaoHIST7Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de História',
      subtitulo: '7º Ano do Ensino Fundamental',
      disciplina: 'História',
      secoes: [
        {
          id: 'mundo-moderno',
          titulo: 'O mundo moderno e a conexão entre sociedades',
          icone: '👧',
          criterios: [
            { id: 'hist7-mm1', nome: 'Modernidade', descricao: 'Explica significado de "modernidade" e suas lógicas de inclusão e exclusão.', nivel: '' },
            { id: 'hist7-mm2', nome: 'Conexões globais', descricao: 'Identifica interações entre Europa, África, Ásia e Novo Mundo no contexto das navegações.', nivel: '' },
            { id: 'hist7-mm3', nome: 'Sociedades africanas e americanas', descricao: 'Reconhece aspectos e processos específicos antes da chegada dos europeus.', nivel: '' }
          ]
        },
        {
          id: 'humanismos-renascimentos',
          titulo: 'Humanismos, Renascimentos e o Novo Mundo',
          icone: '🌍',
          criterios: [
            { id: 'hist7-hr1', nome: 'Humanismos e Renascimentos', descricao: 'Identifica características e significados dos Humanismos e Renascimentos culturais.', nivel: '' },
            { id: 'hist7-hr2', nome: 'Reformas religiosas', descricao: 'Relaciona reformas religiosas aos processos culturais e sociais da Europa e América.', nivel: '' },
            { id: 'hist7-hr3', nome: 'Navegações', descricao: 'Compara navegações no Atlântico e Pacífico entre séculos XIV e XVI.', nivel: '' }
          ]
        },
        {
          id: 'poder-colonial',
          titulo: 'Organização do poder e dinâmicas coloniais',
          icone: '🛠️',
          criterios: [
            { id: 'hist7-pc1', nome: 'Monarquias europeias', descricao: 'Descreve formação e consolidação das monarquias e razões da centralização política.', nivel: '' },
            { id: 'hist7-pc2', nome: 'Conquista da América', descricao: 'Analisa formas de organização política de indígenas e europeus, conflitos e resistências.', nivel: '' },
            { id: 'hist7-pc3', nome: 'Impactos da conquista', descricao: 'Avalia impactos da conquista europeia sobre populações ameríndias e formas de resistência.', nivel: '' },
            { id: 'hist7-pc4', nome: 'Documentos históricos', descricao: 'Analisa diferentes interpretações sobre sociedades americanas coloniais.', nivel: '' },
            { id: 'hist7-pc5', nome: 'América portuguesa', descricao: 'Analisa formação histórico-geográfica do território por meio de mapas históricos.', nivel: '' },
            { id: 'hist7-pc6', nome: 'População brasileira', descricao: 'Identifica distribuição territorial da população em diferentes épocas, considerando diversidade étnico-racial e cultural.', nivel: '' }
          ]
        },
        {
          id: 'comercio-mercantil',
          titulo: 'Lógicas comerciais e mercantis da modernidade',
          icone: '🎭',
          criterios: [
            { id: 'hist7-cm1', nome: 'Domínio europeu', descricao: 'Caracteriza ação dos europeus e suas lógicas mercantis no mundo atlântico.', nivel: '' },
            { id: 'hist7-cm2', nome: 'Comércio africano e americano', descricao: 'Descreve dinâmicas comerciais das sociedades africanas e americanas e suas interações globais.', nivel: '' },
            { id: 'hist7-cm3', nome: 'Escravidão moderna', descricao: 'Discute conceito de escravidão moderna e distingue do escravismo antigo e da servidão medieval.', nivel: '' },
            { id: 'hist7-cm4', nome: 'Tráfico de escravizados', descricao: 'Analisa dinâmicas do comércio de escravizados, agentes responsáveis e regiões de origem.', nivel: '' },
            { id: 'hist7-cm5', nome: 'Mercantilismo e capitalismo', descricao: 'Discute razões da passagem do mercantilismo para o capitalismo.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-mm', dimensao: 'Mundo moderno e conexões', indicadores: 'Modernidade, interações globais, sociedades africanas e americanas', observacoes: '' },
        { id: 'sint-hr', dimensao: 'Humanismos e Renascimentos', indicadores: 'Humanismos, reformas religiosas, navegações', observacoes: '' },
        { id: 'sint-pc', dimensao: 'Poder e colonização', indicadores: 'Monarquias, conquista da América, impactos, América portuguesa, população', observacoes: '' },
        { id: 'sint-cm', dimensao: 'Comércio e escravidão', indicadores: 'Lógicas mercantis, escravidão moderna, tráfico, capitalismo', observacoes: '' }
      ]
    };
  }

  getAvaliacaoHIST8Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de História',
      subtitulo: '8º Ano do Ensino Fundamental',
      disciplina: 'História',
      secoes: [
        {
          id: 'antigo-regime-crise',
          titulo: 'O mundo contemporâneo: o Antigo Regime em crise',
          icone: '👧',
          criterios: [
            { id: 'hist8-ar1', nome: 'Iluminismo e liberalismo', descricao: 'Identifica aspectos conceituais e discute sua relação com a organização do mundo contemporâneo.', nivel: '' },
            { id: 'hist8-ar2', nome: 'Revoluções inglesas', descricao: 'Reconhece particularidades político-sociais da Inglaterra do século XVII e seus desdobramentos.', nivel: '' },
            { id: 'hist8-ar3', nome: 'Revolução Industrial', descricao: 'Analisa impactos na produção e circulação de povos, produtos e culturas.', nivel: '' },
            { id: 'hist8-ar4', nome: 'Revolução Francesa', descricao: 'Relaciona processos e desdobramentos na Europa e no mundo.', nivel: '' },
            { id: 'hist8-ar5', nome: 'Rebeliões na América portuguesa', descricao: 'Explica movimentos como conjurações mineira e baiana e suas interfaces com processos globais.', nivel: '' }
          ]
        },
        {
          id: 'independencias-americas',
          titulo: 'Os processos de independência nas Américas',
          icone: '🌍',
          criterios: [
            { id: 'hist8-ia1', nome: 'Independência dos EUA', descricao: 'Identifica especificidades do processo norte-americano.', nivel: '' },
            { id: 'hist8-ia2', nome: 'Independências hispano-americanas', descricao: 'Conhece ideário dos líderes e conformações territoriais.', nivel: '' },
            { id: 'hist8-ia3', nome: 'Revolução de São Domingo (Haiti)', descricao: 'Reconhece como evento singular e avalia implicações.', nivel: '' },
            { id: 'hist8-ia4', nome: 'Independência do Brasil', descricao: 'Analisa caminhos até 1822 e protagonismo de diferentes grupos sociais e étnicos.', nivel: '' },
            { id: 'hist8-ia5', nome: 'Tutela e escravidão', descricao: 'Discute tutela indígena, escravidão negra e permanências de preconceitos e violências.', nivel: '' }
          ]
        },
        {
          id: 'brasil-seculo-xix',
          titulo: 'O Brasil no século XIX',
          icone: '🛠️',
          criterios: [
            { id: 'hist8-bx1', nome: 'Primeiro e Segundo Reinado', descricao: 'Analisa disputas políticas, rebeliões e diversidade regional.', nivel: '' },
            { id: 'hist8-bx2', nome: 'Territórios e fronteiras', descricao: 'Relaciona transformações territoriais e tensões, incluindo a Guerra do Paraguai.', nivel: '' },
            { id: 'hist8-bx3', nome: 'Escravismo e abolicionismo', descricao: 'Avalia plantations, revoltas, políticas migratórias e legado da escravidão.', nivel: '' },
            { id: 'hist8-bx4', nome: 'Políticas indígenas', descricao: 'Identifica políticas de extermínio e marginalização durante o Império.', nivel: '' },
            { id: 'hist8-bx5', nome: 'Cultura e identidade', descricao: 'Discute papel das artes, letras e cultura popular na construção do imaginário nacional.', nivel: '' }
          ]
        },
        {
          id: 'configuracoes-seculo-xix',
          titulo: 'Configurações do mundo no século XIX',
          icone: '🎭',
          criterios: [
            { id: 'hist8-cx1', nome: 'Nacionalismo e revoluções', descricao: 'Caracteriza novas nações europeias e suas dinâmicas.', nivel: '' },
            { id: 'hist8-cx2', nome: 'Capitalismo industrial', descricao: 'Analisa demandas globais e lugar das economias africanas e asiáticas.', nivel: '' },
            { id: 'hist8-cx3', nome: 'EUA e América Latina', descricao: 'Contextualiza relações políticas e econômicas no século XIX.', nivel: '' },
            { id: 'hist8-cx4', nome: 'Imperialismo europeu', descricao: 'Reconhece impactos da partilha da África e Ásia.', nivel: '' },
            { id: 'hist8-cx5', nome: 'Darwinismo e racismo', descricao: 'Relaciona ideologias raciais ao imperialismo e seus impactos.', nivel: '' },
            { id: 'hist8-cx6', nome: 'Resistência indígena', descricao: 'Analisa discursos civilizatórios e resistências de povos indígenas e comunidades negras.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-ar', dimensao: 'Antigo Regime em crise', indicadores: 'Iluminismo, revoluções, industrialização, rebeliões', observacoes: '' },
        { id: 'sint-ia', dimensao: 'Independências nas Américas', indicadores: 'EUA, Hispano-América, Haiti, Brasil, tutela indígena e negra', observacoes: '' },
        { id: 'sint-bx', dimensao: 'Brasil no século XIX', indicadores: 'Reinos, fronteiras, escravismo, políticas indígenas, cultura', observacoes: '' },
        { id: 'sint-cx', dimensao: 'Configurações globais', indicadores: 'Nacionalismo, capitalismo, imperialismo, racismo, resistências', observacoes: '' }
      ]
    };
  }

  getAvaliacaoHIST9Ano(): AvaliacaoBNCC {
    return {
      titulo: 'Avaliação de História',
      subtitulo: '9º Ano do Ensino Fundamental',
      disciplina: 'História',
      secoes: [
        {
          id: 'republica-brasil',
          titulo: 'O nascimento da República no Brasil e processos até a metade do século XX',
          icone: '👧',
          criterios: [
            { id: 'hist9-rb1', nome: 'Emergência da República', descricao: 'Contextualiza aspectos sociais, culturais, econômicos e políticos da proclamação da República.', nivel: '' },
            { id: 'hist9-rb2', nome: 'Ciclos republicanos', descricao: 'Compreende ciclos da história republicana até 1954, incluindo particularidades locais e regionais.', nivel: '' },
            { id: 'hist9-rb3', nome: 'Inserção dos negros', descricao: 'Identifica mecanismos de inserção pós-abolição e avalia seus resultados.', nivel: '' },
            { id: 'hist9-rb4', nome: 'Cultura afro-brasileira', descricao: 'Discute importância da participação negra na formação econômica, política e cultural do Brasil.', nivel: '' },
            { id: 'hist9-rb5', nome: 'Urbanização e modernização', descricao: 'Analisa processos de urbanização e seus impactos sociais e regionais.', nivel: '' },
            { id: 'hist9-rb6', nome: 'Trabalhismo', descricao: 'Identifica papel do trabalhismo como força política e cultural.', nivel: '' },
            { id: 'hist9-rb7', nome: 'Questão indígena', descricao: 'Explica pautas indígenas e afrodescendentes no contexto republicano até 1964.', nivel: '' }
          ]
        },
        {
          id: 'totalitarismos-conflitos',
          titulo: 'Totalitarismos e conflitos mundiais',
          icone: '🌍',
          criterios: [
            { id: 'hist9-tc1', nome: 'Conflitos mundiais', descricao: 'Relaciona dinâmicas do capitalismo, crises e grandes conflitos mundiais.', nivel: '' },
            { id: 'hist9-tc2', nome: 'Revolução Russa', descricao: 'Identifica especificidades e desdobramentos da Revolução Russa.', nivel: '' },
            { id: 'hist9-tc3', nome: 'Crise de 1929', descricao: 'Analisa impactos da crise capitalista de 1929 na economia global.', nivel: '' },
            { id: 'hist9-tc4', nome: 'Fascismo e nazismo', descricao: 'Contextualiza emergência dos regimes totalitários e práticas de extermínio (Holocausto).', nivel: '' },
            { id: 'hist9-tc5', nome: 'Colonialismo e resistências', descricao: 'Caracteriza colonialismo africano e asiático e resistências locais.', nivel: '' },
            { id: 'hist9-tc6', nome: 'ONU e Direitos Humanos', descricao: 'Discute criação da ONU e relaciona Carta dos Direitos Humanos à defesa da dignidade humana.', nivel: '' }
          ]
        },
        {
          id: 'ditadura-redemocratizacao',
          titulo: 'Modernização, ditadura civil-militar e redemocratização',
          icone: '🛠️',
          criterios: [
            { id: 'hist9-dr1', nome: 'Brasil pós-1946', descricao: 'Analisa processos sociais, econômicos e culturais a partir de 1946.', nivel: '' },
            { id: 'hist9-dr2', nome: 'Urbanização e desigualdades', descricao: 'Relaciona transformações urbanas e impactos na cultura e desigualdades regionais.', nivel: '' },
            { id: 'hist9-dr3', nome: 'Ditadura civil-militar', descricao: 'Compreende causas, memória e justiça sobre violações de direitos humanos.', nivel: '' },
            { id: 'hist9-dr4', nome: 'Resistência e reorganização', descricao: 'Discute processos de resistência e reorganização da sociedade durante a ditadura.', nivel: '' },
            { id: 'hist9-dr5', nome: 'Demandas indígenas e quilombolas', descricao: 'Identifica contestação ao modelo desenvolvimentista da ditadura.', nivel: '' },
            { id: 'hist9-dr6', nome: 'Redemocratização', descricao: 'Analisa mobilização social até a Constituição de 1988.', nivel: '' },
            { id: 'hist9-dr7', nome: 'Constituição de 1988', descricao: 'Identifica direitos civis, políticos e sociais e sua relação com cidadania e combate ao preconceito.', nivel: '' },
            { id: 'hist9-dr8', nome: 'Brasil pós-1989', descricao: 'Analisa transformações políticas, sociais e culturais até os dias atuais.', nivel: '' },
            { id: 'hist9-dr9', nome: 'Violência contra marginalizados', descricao: 'Discute causas da violência contra negros, indígenas, mulheres, LGBTQIA+, pobres etc.', nivel: '' },
            { id: 'hist9-dr10', nome: 'Globalização', descricao: 'Relaciona mudanças econômicas e sociais ao papel do Brasil no cenário internacional.', nivel: '' }
          ]
        },
        {
          id: 'historia-recente',
          titulo: 'A história recente e o mundo',
          icone: '🎭',
          criterios: [
            { id: 'hist9-hr1', nome: 'Guerra Fria', descricao: 'Analisa principais conflitos e tensões geopolíticas entre blocos soviético e estadunidense.', nivel: '' },
            { id: 'hist9-hr2', nome: 'Ditaduras latino-americanas', descricao: 'Descreve experiências ditatoriais e movimentos de contestação.', nivel: '' },
            { id: 'hist9-hr3', nome: 'Descolonização', descricao: 'Avalia processos de descolonização na África e Ásia.', nivel: '' },
            { id: 'hist9-hr4', nome: 'Globalização', descricao: 'Analisa mudanças e permanências associadas ao processo de globalização.', nivel: '' },
            { id: 'hist9-hr5', nome: 'Tecnologias digitais', descricao: 'Discute impactos das TIC nas relações políticas locais e globais.', nivel: '' },
            { id: 'hist9-hr6', nome: 'Políticas econômicas latino-americanas', descricao: 'Analisa motivações e impactos sociais das políticas econômicas na região.', nivel: '' },
            { id: 'hist9-hr7', nome: 'Terrorismo', descricao: 'Avalia fenômeno do terrorismo e seus impactos culturais e migratórios.', nivel: '' },
            { id: 'hist9-hr8', nome: 'Diversidades identitárias', descricao: 'Identifica e discute pluralidades identitárias no século XXI, combatendo preconceitos.', nivel: '' }
          ]
        }
      ],
      camposAtuacao: [],
      sintese: [
        { id: 'sint-rb', dimensao: 'República e Brasil até 1954', indicadores: 'Emergência da República, inserção negra, trabalhismo, urbanização', observacoes: '' },
        { id: 'sint-tc', dimensao: 'Conflitos mundiais', indicadores: 'Guerras, Revolução Russa, crise de 1929, fascismo/nazismo, ONU', observacoes: '' },
        { id: 'sint-dr', dimensao: 'Ditadura e redemocratização', indicadores: 'Brasil pós-1946, ditadura, resistência, Constituição de 1988, globalização', observacoes: '' },
        { id: 'sint-hr', dimensao: 'História recente e mundo', indicadores: 'Guerra Fria, ditaduras, descolonização, globalização, terrorismo, identidades', observacoes: '' }
      ]
    };
  }

  ativarSecao(secaoId: string): void {
    this.secaoAtiva = secaoId;
  }

  definirNivel(criterio: Criterio, nivel: NivelDesempenho): void {
    criterio.nivel = nivel;
    this.calcularProgresso();
  }

  calcularProgresso(): void {
    if (!this.avaliacao) return;
    const total = this.avaliacao.secoes.reduce((acc, s) => acc + s.criterios.length, 0);
    const preenchidos = this.avaliacao.secoes.reduce(
      (acc, s) => acc + s.criterios.filter(c => c.nivel !== '').length, 0
    );
    this.progresso = total > 0 ? Math.round((preenchidos / total) * 100) : 0;
  }

  secaoCompleta(secao: Secao): boolean {
    return secao.criterios.every(c => c.nivel !== '');
  }

  totalCriteriosSecao(secao: Secao): number {
    return secao.criterios.length;
  }

  criteriosPreenchidosSecao(secao: Secao): number {
    return secao.criterios.filter(c => c.nivel !== '').length;
  }

  podeSalvar(): boolean {
    return !!this.educandoSelecionado && !!this.bimestreSelecionado;
  }

  getNomeEducando(): string {
    const e = this.educandosMock.find(x => x.id === this.educandoSelecionado);
    return e ? e.nome : '';
  }

  enviarAvaliacao(): void {
    if (!this.podeSalvar()) {
      alert('Selecione o educando e o bimestre antes de salvar.');
      return;
    }
    this.enviando = true;
    setTimeout(() => {
      this.enviando = false;
      this.enviado = true;
    }, 1200);
  }

  novaAvaliacao(): void {
    this.enviado = false;
    this.educandoSelecionado = '';
    this.bimestreSelecionado = '1';
    this.avaliacao = null;
    this.ngOnInit();
  }

  voltar(): void {
    this.router.navigate(['/avaliacoes']);
  }

  getNivelClass(nivel: NivelDesempenho): string {
    const map: Record<string, string> = {
      'excelente': 'nivel-excelente',
      'bom': 'nivel-bom',
      'regular': 'nivel-regular',
      'precisa-apoio': 'nivel-apoio'
    };
    return map[nivel] || '';
  }
}
