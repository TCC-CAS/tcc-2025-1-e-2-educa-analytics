import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Avaliacao {
  id: string;
  titulo: string;
  descricao: string;
  publico: string[];
  icone: string;
  cor: string;
  respondida: boolean;
  dataResposta?: string;
}

@Component({
  selector: 'app-avaliacoes-list',
  templateUrl: './avaliacoes-list.component.html',
  styleUrls: ['./avaliacoes-list.component.scss']
})
export class AvaliacoesListComponent implements OnInit {
  avaliacoes: Avaliacao[] = [];
  usuarioTipo: string = 'educador'; // educador, educando, tutor, administrativo

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.carregarAvaliacoes();
  }

  carregarAvaliacoes(): void {
    this.avaliacoes = [
      {
        id: 'condicoes-trabalho',
        titulo: 'Avaliação de Condições de Trabalho',
        descricao: 'Avalie as condições de trabalho oferecidas pela instituição (ambientes, recursos, equipamentos).',
        publico: ['educador'],
        icone: '💼',
        cor: 'azul',
        respondida: false
      },
      {
        id: 'participacao-educandos',
        titulo: 'Avaliação de Participação dos Educandos',
        descricao: 'Avalie o nível de participação dos educandos nas atividades escolares e engajamento geral.',
        publico: ['educador'],
        icone: '🎓',
        cor: 'verde',
        respondida: true,
        dataResposta: '15/02/2026'
      },
      {
        id: 'infraestrutura',
        titulo: 'Avaliação de Infraestrutura',
        descricao: 'Avalie as condições das instalações, equipamentos e recursos da instituição.',
        publico: ['educador', 'educando', 'tutor', 'administrativo'],
        icone: '🏫',
        cor: 'amarelo',
        respondida: false
      },
      {
        id: 'clima-socioemocional',
        titulo: 'Avaliação do Clima Socioemocional',
        descricao: 'Avalie o ambiente relacionamento, inclusão e bem-estar emocional na instituição.',
        publico: ['educador', 'educando', 'tutor', 'administrativo'],
        icone: '💝',
        cor: 'rosa',
        respondida: false
      },
      {
        id: 'autonomia',
        titulo: 'Avaliação de Autonomia',
        descricao: 'Avalie se há liberdade para tomada de decisões e iniciativas na instituição.',
        publico: ['educador', 'administrativo'],
        icone: '🚀',
        cor: 'roxo',
        respondida: false
      },
      {
        id: 'gestao-escolar',
        titulo: 'Avaliação de Gestão Escolar',
        descricao: 'Avalie a efetividade da administração, liderança e processos gestores.',
        publico: ['educador', 'tutor', 'administrativo'],
        icone: '⚙️',
        cor: 'cinza',
        respondida: true,
        dataResposta: '10/02/2026'
      },
      {
        id: 'qualidade-ensino',
        titulo: 'Avaliação de Qualidade de Ensino',
        descricao: 'Avalie a qualidade das aulas, conteúdos e metodologias de ensino.',
        publico: ['educando', 'tutor', 'administrativo'],
        icone: '📚',
        cor: 'laranja',
        respondida: false
      }
    ];

    // Filtrar apenas avaliações permitidas para o tipo de usuário
    this.avaliacoes = this.avaliacoes.filter(a => a.publico.includes(this.usuarioTipo));
  }

  obterAvaliacoesRespondidas(): Avaliacao[] {
    return this.avaliacoes.filter(a => a.respondida);
  }

  obterAvaliacoesPendentes(): Avaliacao[] {
    return this.avaliacoes.filter(a => !a.respondida);
  }

  responderAvaliacao(avaliacao: Avaliacao): void {
    this.router.navigate([`/avaliacoes/${avaliacao.id}`]);
  }

  visualizarResposta(avaliacao: Avaliacao): void {
    this.router.navigate([`/avaliacoes/${avaliacao.id}`]);
  }

  editarResposta(avaliacao: Avaliacao): void {
    this.router.navigate([`/avaliacoes/${avaliacao.id}`]);
  }
}
