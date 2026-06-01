import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Pergunta {
  id: string;
  texto: string;
  tipo: 'escala' | 'aberta';
  obrigatoria: boolean;
}

interface Secao {
  numero: number;
  titulo: string;
  icone: string;
  perguntas: Pergunta[];
}

@Component({
  selector: 'app-avaliacao-infraestrutura-form',
  templateUrl: './avaliacao-infraestrutura-form.component.html',
  styleUrls: ['./avaliacao-infraestrutura-form.component.scss']
})
export class AvaliacaoInfraestruturaFormComponent implements OnInit {

  respostas: { [key: string]: any } = {};
  showCompletion = false;
  submitted = false;

  readonly escalaLabels = ['Muito insatisfeito', 'Insatisfeito', 'Regular', 'Satisfeito', 'Muito satisfeito'];
  readonly escalaEmojis = ['😞', '😕', '😐', '🙂', '😄'];

  secoes: Secao[] = [
    {
      numero: 1,
      titulo: 'Instalações físicas',
      icone: '🏫',
      perguntas: [
        {
          id: 'conservacao-salas',
          texto: 'Como você avalia o estado de conservação das salas de aula?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'higiene-banheiros',
          texto: 'Os banheiros da escola apresentam condições adequadas de higiene e manutenção?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'espacos-recreacao',
          texto: 'A escola dispõe de espaços adequados para recreação e atividades físicas (quadra, pátio, áreas externas)?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'biblioteca',
          texto: 'A biblioteca ou sala de leitura possui acervo atualizado e ambiente apropriado para estudo?',
          tipo: 'escala',
          obrigatoria: true
        }
      ]
    },
    {
      numero: 2,
      titulo: 'Recursos materiais e tecnológicos',
      icone: '💻',
      perguntas: [
        {
          id: 'materiais-didaticos',
          texto: 'Os materiais didáticos disponíveis (livros, apostilas, recursos pedagógicos) são suficientes e de boa qualidade?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'equipamentos-tecnologicos',
          texto: 'A escola oferece acesso a equipamentos tecnológicos (computadores, tablets, projetores) em quantidade e qualidade adequadas?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'internet',
          texto: 'A conexão à internet utilizada para fins pedagógicos é estável e acessível?',
          tipo: 'escala',
          obrigatoria: true
        }
      ]
    },
    {
      numero: 3,
      titulo: 'Segurança e acessibilidade',
      icone: '🔒',
      perguntas: [
        {
          id: 'seguranca-acesso',
          texto: 'As condições de segurança da escola (portaria, vigilância, controle de acesso) são satisfatórias?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'acessibilidade',
          texto: 'A infraestrutura da escola é acessível para estudantes com deficiência ou mobilidade reduzida?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'equipamentos-seguranca',
          texto: 'Os equipamentos de segurança (extintores, sinalização de emergência) estão visíveis e em bom estado?',
          tipo: 'escala',
          obrigatoria: true
        }
      ]
    },
    {
      numero: 4,
      titulo: 'Ambiente escolar',
      icone: '🌿',
      perguntas: [
        {
          id: 'limpeza-organizacao',
          texto: 'Como você avalia a limpeza e organização dos espaços comuns (corredores, refeitório, pátio)?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'bem-estar',
          texto: 'O ambiente escolar favorece o bem-estar e a permanência dos estudantes?',
          tipo: 'escala',
          obrigatoria: true
        }
      ]
    },
    {
      numero: 5,
      titulo: 'Avaliação geral',
      icone: '⭐',
      perguntas: [
        {
          id: 'avaliacao-geral',
          texto: 'Em uma escala de 1 a 5, como você avalia a infraestrutura da escola de forma geral?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'prioridades-melhoria',
          texto: 'Quais aspectos da infraestrutura você considera prioritários para melhoria?',
          tipo: 'aberta',
          obrigatoria: false
        }
      ]
    }
  ];

  get todasPerguntas(): Pergunta[] {
    return this.secoes.flatMap(s => s.perguntas);
  }

  get totalPerguntas(): number {
    return this.todasPerguntas.filter(p => p.tipo === 'escala').length;
  }

  get perguntasRespondidas(): number {
    return this.todasPerguntas
      .filter(p => p.tipo === 'escala' && this.respostas[p.id] !== undefined)
      .length;
  }

  get progresso(): number {
    if (!this.totalPerguntas) return 0;
    return Math.round((this.perguntasRespondidas / this.totalPerguntas) * 100);
  }

  get xpEarned(): number {
    return this.perguntasRespondidas * 100 + (this.showCompletion ? 500 : 0);
  }

  constructor(private router: Router) {}

  ngOnInit(): void {}

  responder(perguntaId: string, valor: any): void {
    this.respostas[perguntaId] = valor;
  }

  obterResposta(perguntaId: string): any {
    return this.respostas[perguntaId];
  }

  camposObrigatoriosFaltando(): string[] {
    return this.todasPerguntas
      .filter(p => p.obrigatoria && (this.respostas[p.id] === undefined || this.respostas[p.id] === null))
      .map(p => p.id);
  }

  enviar(): void {
    this.submitted = true;
    const faltando = this.camposObrigatoriosFaltando();
    if (faltando.length > 0) {
      const firstEl = document.getElementById('pergunta-' + faltando[0]);
      if (firstEl) {
        firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    this.showCompletion = true;
    console.log('Avaliação de Infraestrutura enviada:', {
      respostas: this.respostas,
      dataEnvio: new Date()
    });
  }

  voltar(): void {
    this.router.navigate(['/avaliacoes']);
  }
}
