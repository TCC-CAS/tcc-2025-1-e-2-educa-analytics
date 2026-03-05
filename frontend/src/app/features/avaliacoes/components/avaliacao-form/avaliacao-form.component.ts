import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface Pergunta {
  id: string;
  texto: string;
  tipo: 'escala' | 'multipla' | 'aberta' | 'sim_nao';
  opcoes?: string[];
  obrigatoria: boolean;
}

interface Avaliacao {
  titulo: string;
  descricao: string;
  perguntas: Pergunta[];
}

@Component({
  selector: 'app-avaliacao-form',
  templateUrl: './avaliacao-form.component.html',
  styleUrls: ['./avaliacao-form.component.scss']
})
export class AvaliacaoFormComponent implements OnInit {
  tipoAvaliacao: string = '';
  avaliacao: Avaliacao | null = null;
  respostas: any = {};
  progresso: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.tipoAvaliacao = this.route.snapshot.paramMap.get('tipo') || '';
    this.carregarAvaliacao();
  }

  carregarAvaliacao(): void {
    // Carregar configuração da avaliação com base no tipo
    switch (this.tipoAvaliacao) {
      case 'condicoes-trabalho':
        this.avaliacao = this.getAvaliacaoCondicoesTrabalho();
        break;
      case 'participacao-educandos':
        this.avaliacao = this.getAvaliacaoParticipacao();
        break;
      case 'infraestrutura':
        this.avaliacao = this.getAvaliacaoInfraestrutura();
        break;
      case 'clima-socioemocional':
        this.avaliacao = this.getAvaliacaoClima();
        break;
      case 'autonomia':
        this.avaliacao = this.getAvaliacaoAutonomia();
        break;
      case 'gestao-escolar':
        this.avaliacao = this.getAvaliacaoGestao();
        break;
      case 'qualidade-ensino':
        this.avaliacao = this.getAvaliacaoQualidade();
        break;
    }
  }

  getAvaliacaoCondicoesTrabalho(): Avaliacao {
    return {
      titulo: 'Avaliação de Condições de Trabalho',
      descricao: 'Avalie as condições de trabalho oferecidas pela instituição',
      perguntas: [
        {
          id: 'remuneracao',
          texto: 'Como você avalia a remuneração oferecida?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'ambiente-fisico',
          texto: 'As condições do ambiente físico de trabalho são adequadas?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'recursos',
          texto: 'Você tem acesso aos recursos necessários para realizar seu trabalho?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'reconhecimento',
          texto: 'Sente-se reconhecido(a) em seu trabalho?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'desenvolvimento',
          texto: 'Há oportunidades de desenvolvimento profissional?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'seguranca',
          texto: 'Sente-se seguro(a) em seu ambiente de trabalho?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'sugestoes',
          texto: 'Deixe suas sugestões para melhorias nas condições de trabalho',
          tipo: 'aberta',
          obrigatoria: false
        }
      ]
    };
  }

  getAvaliacaoParticipacao(): Avaliacao {
    return {
      titulo: 'Avaliação de Participação dos Educandos',
      descricao: 'Avalie o nível de participação dos educandos nas atividades escolares',
      perguntas: [
        {
          id: 'participacao-aulas',
          texto: 'Qual o nível geral de participação dos educandos nas aulas?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'atividades-extras',
          texto: 'Como é a participação em atividades e projetos especiais?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'trabalhos-grupo',
          texto: 'Os educandos participam ativamente em trabalhos em grupo?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'discussoes',
          texto: 'Há participação em discussões e debates?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'entrega-atividades',
          texto: 'A maioria cumpre com as atividades solicitadas?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'interesse',
          texto: 'Percebe interesse genuíno dos educandos nas aulas?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'observacoes',
          texto: 'Observações adicionais sobre a participação',
          tipo: 'aberta',
          obrigatoria: false
        }
      ]
    };
  }

  getAvaliacaoInfraestrutura(): Avaliacao {
    return {
      titulo: 'Avaliação de Infraestrutura',
      descricao: 'Avalie as condições das instalações, equipamentos e recursos',
      perguntas: [
        {
          id: 'salas-aula',
          texto: 'Como você avalia o estado das salas de aula?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'laboratorios',
          texto: 'Laboratórios e salas especializadas estão bem equipados?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'tecnologia',
          texto: 'A disponibilidade de recursos tecnológicos é adequada?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'limpeza',
          texto: 'Os ambientes mantêm padrões adequados de limpeza e higiene?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'acessibilidade',
          texto: 'A infraestrutura é acessível para pessoas com deficiência?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'areas-comuns',
          texto: 'Áreas comuns (refeitório, pátio) são adequadas?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'melhorias',
          texto: 'Que melhorias de infraestrutura você sugeriria?',
          tipo: 'aberta',
          obrigatoria: false
        }
      ]
    };
  }

  getAvaliacaoClima(): Avaliacao {
    return {
      titulo: 'Avaliação do Clima Socioemocional',
      descricao: 'Avalie o ambiente, relacionamento e bem-estar emocional',
      perguntas: [
        {
          id: 'respeito',
          texto: 'Há respeito e inclusão entre os membros da comunidade escolar?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'comunicacao',
          texto: 'A comunicação é clara e efetiva entre equipe e educandos?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'colaboracao',
          texto: 'Há espírito de colaboração e trabalho em equipe?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'bem-estar',
          texto: 'Sente-se bem-estar emocional neste ambiente?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'conflitos',
          texto: 'Os conflitos são resolvidos de forma construtiva?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'apoio',
          texto: 'Há suporte emocional e psicológico disponível?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'comentarios',
          texto: 'Comentários adicionais sobre o clima da instituição',
          tipo: 'aberta',
          obrigatoria: false
        }
      ]
    };
  }

  getAvaliacaoAutonomia(): Avaliacao {
    return {
      titulo: 'Avaliação de Autonomia',
      descricao: 'Avalie se há liberdade para tomada de decisões e iniciativas',
      perguntas: [
        {
          id: 'liberdade-decisao',
          texto: 'Há liberdade para tomar decisões em seu trabalho?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'criatividade',
          texto: 'Pode expressar criatividade e inovação?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'iniciativas',
          texto: 'Suas iniciativas e sugestões são valorizadas?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'autonomia-recursos',
          texto: 'Tem autonomia na gestão de recursos em sua área?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'discussoes',
          texto: 'Participa de discussões sobre direcionamento organizacional?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'apoio',
          texto: 'Recebe apoio da gestão para suas iniciativas?',
          tipo: 'escala',
          obrigatoria: true
        }
      ]
    };
  }

  getAvaliacaoGestao(): Avaliacao {
    return {
      titulo: 'Avaliação de Gestão Escolar',
      descricao: 'Avalie a efetividade da administração e liderança',
      perguntas: [
        {
          id: 'lideranca',
          texto: 'Como você avalia a qualidade da liderança?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'transparencia',
          texto: 'As decisões administrativas são transparentes?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'processos',
          texto: 'Os processos administrativos são eficientes?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'comunicacao-gestao',
          texto: 'Há boa comunicação entre gestão e equipe?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'delegacao',
          texto: 'As responsabilidades são bem delegadas?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'resolucao-problemas',
          texto: 'Os problemas são resolvidos de forma adequada?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'feedback-gestao',
          texto: 'Qual sua avaliação geral da gestão escolar?',
          tipo: 'aberta',
          obrigatoria: false
        }
      ]
    };
  }

  getAvaliacaoQualidade(): Avaliacao {
    return {
      titulo: 'Avaliação de Qualidade de Ensino',
      descricao: 'Avalie a qualidade das aulas, conteúdos e metodologias',
      perguntas: [
        {
          id: 'relevancia-conteudo',
          texto: 'O conteúdo é relevante e bem estruturado?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'metodologia',
          texto: 'As metodologias de ensino são eficazes?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'recursos-didaticos',
          texto: 'Há uso adequado de recursos didáticos?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'aprendizado',
          texto: 'Os educandos demonstram compreensão dos conteúdos?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'avaliacao',
          texto: 'Os processos de avaliação são justos e claros?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'retorno-alunos',
          texto: 'Há feedback adequado aos educandos?',
          tipo: 'escala',
          obrigatoria: true
        },
        {
          id: 'aprimoramentos',
          texto: 'Sugestões para aprimorar a qualidade de ensino',
          tipo: 'aberta',
          obrigatoria: false
        }
      ]
    };
  }

  responderPergunta(perguntaId: string, valor: any): void {
    this.respostas[perguntaId] = valor;
    this.calcularProgresso();
  }

  calcularProgresso(): void {
    if (!this.avaliacao) return;
    const obrigatorias = this.avaliacao.perguntas.filter(p => p.obrigatoria).length;
    const respondidas = this.avaliacao.perguntas
      .filter(p => p.obrigatoria && this.respostas[p.id] !== undefined)
      .length;
    this.progresso = Math.round((respondidas / obrigatorias) * 100);
  }

  enviarAvaliacao(form: any): void {
    if (!form.valid) {
      alert('Por favor, responda todas as perguntas obrigatórias');
      return;
    }

    console.log('Avaliação enviada:', {
      tipo: this.tipoAvaliacao,
      respostas: this.respostas,
      dataEnvio: new Date()
    });

    alert('Obrigado! Sua avaliação foi enviada com sucesso.');
    this.router.navigate(['/avaliacoes']);
  }

  voltar(): void {
    this.router.navigate(['/avaliacoes']);
  }
}
