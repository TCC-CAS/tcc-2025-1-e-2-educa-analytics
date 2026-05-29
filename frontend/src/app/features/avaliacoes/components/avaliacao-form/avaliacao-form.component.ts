import { Component, OnInit, HostListener } from '@angular/core';
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

  // ── Step navigation ─────────────────────────────────────────────────────
  currentQuestionIndex = 0;

  // ── Animation state ─────────────────────────────────────────────────────
  isExiting = false;
  exitDirection: 'forward' | 'backward' = 'forward';
  isEntering = false;

  // ── Gamification ────────────────────────────────────────────────────────
  xpEarned = 0;
  streak = 0;
  maxStreak = 0;
  answeredQuestions = new Set<string>();
  showCompletion = false;
  autoAdvancing = false;
  startTime = Date.now();

  readonly XP_PER_QUESTION = 100;
  readonly XP_COMPLETION_BONUS = 500;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.tipoAvaliacao = this.route.snapshot.paramMap.get('tipo') || '';
    this.carregarAvaliacao();
    this.startTime = Date.now();
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get currentQuestion(): Pergunta | undefined {
    return this.avaliacao?.perguntas[this.currentQuestionIndex];
  }

  get totalQuestions(): number {
    return this.avaliacao?.perguntas.length || 0;
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.totalQuestions - 1;
  }

  get isFirstQuestion(): boolean {
    return this.currentQuestionIndex === 0;
  }

  get canAdvance(): boolean {
    const q = this.currentQuestion;
    if (!q) return false;
    if (!q.obrigatoria) return true;
    const r = this.respostas[q.id];
    return r !== undefined && r !== null && r !== '';
  }

  get xpLevel(): number {
    return Math.floor(this.xpEarned / 300) + 1;
  }

  get xpProgressPercent(): number {
    return ((this.xpEarned % 300) / 300) * 100;
  }

  get tempoDecorrido(): string {
    const secs = Math.floor((Date.now() - this.startTime) / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  goToNext(): void {
    if (this.autoAdvancing || this.isExiting) return;
    if (!this.canAdvance) return;

    if (this.isLastQuestion) {
      this.finalizarAvaliacao();
      return;
    }

    this.doTransition('forward', () => {
      this.currentQuestionIndex++;
      this.calcularProgresso();
    });
  }

  goToPrevious(): void {
    if (this.isFirstQuestion || this.autoAdvancing || this.isExiting) return;
    this.doTransition('backward', () => {
      this.currentQuestionIndex--;
    });
  }

  private doTransition(direction: 'forward' | 'backward', callback: () => void): void {
    this.exitDirection = direction;
    this.isExiting = true;
    this.isEntering = false;
    setTimeout(() => {
      callback();
      this.isExiting = false;
      this.isEntering = true;
      setTimeout(() => { this.isEntering = false; }, 380);
    }, 200);
  }

  // ── Answers ──────────────────────────────────────────────────────────────

  responderPergunta(perguntaId: string, valor: any): void {
    const wasNew = !this.answeredQuestions.has(perguntaId);
    this.respostas[perguntaId] = valor;

    if (wasNew) {
      this.answeredQuestions.add(perguntaId);
      this.xpEarned += this.XP_PER_QUESTION;
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;
    }

    this.calcularProgresso();

    // Auto-advance for non-text questions
    const q = this.currentQuestion;
    if (q && q.tipo !== 'aberta') {
      if (this.isLastQuestion) {
        this.autoAdvancing = true;
        setTimeout(() => {
          this.autoAdvancing = false;
          this.finalizarAvaliacao();
        }, 500);
      } else {
        this.autoAdvancing = true;
        setTimeout(() => {
          this.autoAdvancing = false;
          this.goToNext();
        }, 480);
      }
    }
  }

  calcularProgresso(): void {
    if (!this.avaliacao) return;
    const obrigatorias = this.avaliacao.perguntas.filter(p => p.obrigatoria).length;
    const respondidas = this.avaliacao.perguntas
      .filter(p => p.obrigatoria && this.respostas[p.id] !== undefined)
      .length;
    this.progresso = obrigatorias > 0 ? Math.round((respondidas / obrigatorias) * 100) : 0;
  }

  finalizarAvaliacao(): void {
    const obrigatorias = this.avaliacao?.perguntas.filter(p => p.obrigatoria) || [];
    const primeiraFaltando = obrigatorias.findIndex(
      p => this.respostas[p.id] === undefined || this.respostas[p.id] === ''
    );

    if (primeiraFaltando >= 0) {
      const idx = this.avaliacao!.perguntas.indexOf(obrigatorias[primeiraFaltando]);
      this.doTransition(idx > this.currentQuestionIndex ? 'forward' : 'backward', () => {
        this.currentQuestionIndex = idx;
      });
      return;
    }

    this.xpEarned += this.XP_COMPLETION_BONUS;
    this.showCompletion = true;

    console.log('Avaliação enviada:', {
      tipo: this.tipoAvaliacao,
      respostas: this.respostas,
      xpEarned: this.xpEarned,
      maxStreak: this.maxStreak,
      dataEnvio: new Date()
    });
  }

  voltarParaLista(): void {
    this.router.navigate(['/avaliacoes']);
  }

  voltar(): void {
    this.router.navigate(['/avaliacoes']);
  }

  // ── Keyboard support ─────────────────────────────────────────────────────

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (this.showCompletion || this.autoAdvancing || this.isExiting) return;
    const q = this.currentQuestion;
    if (!q) return;

    if (e.key === 'Enter' && q.tipo !== 'aberta') {
      this.goToNext();
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowRight') { this.goToNext();     e.preventDefault(); return; }
    if (e.key === 'ArrowLeft')  { this.goToPrevious(); e.preventDefault(); return; }

    if (q.tipo === 'escala') {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) { this.responderPergunta(q.id, num); e.preventDefault(); }
    }

    if (q.tipo === 'sim_nao') {
      if (e.key.toLowerCase() === 's') { this.responderPergunta(q.id, 'sim'); e.preventDefault(); }
      if (e.key.toLowerCase() === 'n') { this.responderPergunta(q.id, 'nao'); e.preventDefault(); }
    }
  }

  // ── Survey data ───────────────────────────────────────────────────────────

  carregarAvaliacao(): void {
    switch (this.tipoAvaliacao) {
      case 'condicoes-trabalho':     this.avaliacao = this.getAvaliacaoCondicoesTrabalho(); break;
      case 'participacao-educandos': this.avaliacao = this.getAvaliacaoParticipacao();      break;
      case 'infraestrutura':         this.avaliacao = this.getAvaliacaoInfraestrutura();    break;
      case 'clima-socioemocional':   this.avaliacao = this.getAvaliacaoClima();             break;
      case 'autonomia':              this.avaliacao = this.getAvaliacaoAutonomia();         break;
      case 'gestao-escolar':         this.avaliacao = this.getAvaliacaoGestao();            break;
      case 'qualidade-ensino':       this.avaliacao = this.getAvaliacaoQualidade();         break;
    }
  }

  getAvaliacaoCondicoesTrabalho(): Avaliacao {
    return {
      titulo: 'Condições de Trabalho',
      descricao: 'Avalie as condições de trabalho oferecidas pela instituição',
      perguntas: [
        { id: 'remuneracao',    texto: 'Como você avalia a remuneração oferecida?',                         tipo: 'escala', obrigatoria: true },
        { id: 'ambiente-fisico',texto: 'As condições do ambiente físico de trabalho são adequadas?',        tipo: 'escala', obrigatoria: true },
        { id: 'recursos',       texto: 'Você tem acesso aos recursos necessários para realizar seu trabalho?', tipo: 'escala', obrigatoria: true },
        { id: 'reconhecimento', texto: 'Sente-se reconhecido(a) em seu trabalho?',                          tipo: 'escala', obrigatoria: true },
        { id: 'desenvolvimento',texto: 'Há oportunidades de desenvolvimento profissional?',                 tipo: 'escala', obrigatoria: true },
        { id: 'seguranca',      texto: 'Sente-se seguro(a) em seu ambiente de trabalho?',                   tipo: 'escala', obrigatoria: true },
        { id: 'sugestoes',      texto: 'Deixe suas sugestões para melhorias nas condições de trabalho',     tipo: 'aberta', obrigatoria: false }
      ]
    };
  }

  getAvaliacaoParticipacao(): Avaliacao {
    return {
      titulo: 'Participação dos Educandos',
      descricao: 'Avalie o nível de participação dos educandos nas atividades escolares',
      perguntas: [
        { id: 'participacao-aulas',  texto: 'Qual o nível geral de participação dos educandos nas aulas?',   tipo: 'escala', obrigatoria: true },
        { id: 'atividades-extras',   texto: 'Como é a participação em atividades e projetos especiais?',      tipo: 'escala', obrigatoria: true },
        { id: 'trabalhos-grupo',     texto: 'Os educandos participam ativamente em trabalhos em grupo?',      tipo: 'escala', obrigatoria: true },
        { id: 'discussoes',          texto: 'Há participação em discussões e debates?',                       tipo: 'escala', obrigatoria: true },
        { id: 'entrega-atividades',  texto: 'A maioria cumpre com as atividades solicitadas?',                tipo: 'escala', obrigatoria: true },
        { id: 'interesse',           texto: 'Percebe interesse genuíno dos educandos nas aulas?',             tipo: 'escala', obrigatoria: true },
        { id: 'observacoes',         texto: 'Observações adicionais sobre a participação',                    tipo: 'aberta', obrigatoria: false }
      ]
    };
  }

  getAvaliacaoInfraestrutura(): Avaliacao {
    return {
      titulo: 'Infraestrutura',
      descricao: 'Avalie as condições das instalações, equipamentos e recursos',
      perguntas: [
        { id: 'salas-aula',     texto: 'Como você avalia o estado das salas de aula?',                         tipo: 'escala', obrigatoria: true },
        { id: 'laboratorios',   texto: 'Laboratórios e salas especializadas estão bem equipados?',             tipo: 'escala', obrigatoria: true },
        { id: 'tecnologia',     texto: 'A disponibilidade de recursos tecnológicos é adequada?',               tipo: 'escala', obrigatoria: true },
        { id: 'limpeza',        texto: 'Os ambientes mantêm padrões adequados de limpeza e higiene?',          tipo: 'escala', obrigatoria: true },
        { id: 'acessibilidade', texto: 'A infraestrutura é acessível para pessoas com deficiência?',           tipo: 'escala', obrigatoria: true },
        { id: 'areas-comuns',   texto: 'Áreas comuns (refeitório, pátio) são adequadas?',                     tipo: 'escala', obrigatoria: true },
        { id: 'melhorias',      texto: 'Que melhorias de infraestrutura você sugeriria?',                      tipo: 'aberta', obrigatoria: false }
      ]
    };
  }

  getAvaliacaoClima(): Avaliacao {
    return {
      titulo: 'Clima Socioemocional',
      descricao: 'Avalie o ambiente, relacionamento e bem-estar emocional',
      perguntas: [
        { id: 'respeito',      texto: 'Há respeito e inclusão entre os membros da comunidade escolar?',        tipo: 'escala', obrigatoria: true },
        { id: 'comunicacao',   texto: 'A comunicação é clara e efetiva entre equipe e educandos?',             tipo: 'escala', obrigatoria: true },
        { id: 'colaboracao',   texto: 'Há espírito de colaboração e trabalho em equipe?',                     tipo: 'escala', obrigatoria: true },
        { id: 'bem-estar',     texto: 'Sente-se bem-estar emocional neste ambiente?',                         tipo: 'escala', obrigatoria: true },
        { id: 'conflitos',     texto: 'Os conflitos são resolvidos de forma construtiva?',                    tipo: 'escala', obrigatoria: true },
        { id: 'apoio',         texto: 'Há suporte emocional e psicológico disponível?',                       tipo: 'escala', obrigatoria: true },
        { id: 'comentarios',   texto: 'Comentários adicionais sobre o clima da instituição',                  tipo: 'aberta', obrigatoria: false }
      ]
    };
  }

  getAvaliacaoAutonomia(): Avaliacao {
    return {
      titulo: 'Autonomia',
      descricao: 'Avalie se há liberdade para tomada de decisões e iniciativas',
      perguntas: [
        { id: 'liberdade-decisao',  texto: 'Há liberdade para tomar decisões em seu trabalho?',               tipo: 'escala', obrigatoria: true },
        { id: 'criatividade',       texto: 'Pode expressar criatividade e inovação?',                         tipo: 'escala', obrigatoria: true },
        { id: 'iniciativas',        texto: 'Suas iniciativas e sugestões são valorizadas?',                   tipo: 'escala', obrigatoria: true },
        { id: 'autonomia-recursos', texto: 'Tem autonomia na gestão de recursos em sua área?',                tipo: 'escala', obrigatoria: true },
        { id: 'participacao-dir',   texto: 'Participa de discussões sobre direcionamento organizacional?',    tipo: 'escala', obrigatoria: true },
        { id: 'apoio-gestao',       texto: 'Recebe apoio da gestão para suas iniciativas?',                   tipo: 'escala', obrigatoria: true }
      ]
    };
  }

  getAvaliacaoGestao(): Avaliacao {
    return {
      titulo: 'Gestão Escolar',
      descricao: 'Avalie a efetividade da administração e liderança',
      perguntas: [
        { id: 'lideranca',           texto: 'Como você avalia a qualidade da liderança?',                     tipo: 'escala', obrigatoria: true },
        { id: 'transparencia',       texto: 'As decisões administrativas são transparentes?',                 tipo: 'escala', obrigatoria: true },
        { id: 'processos',           texto: 'Os processos administrativos são eficientes?',                   tipo: 'escala', obrigatoria: true },
        { id: 'comunicacao-gestao',  texto: 'Há boa comunicação entre gestão e equipe?',                     tipo: 'escala', obrigatoria: true },
        { id: 'delegacao',           texto: 'As responsabilidades são bem delegadas?',                        tipo: 'escala', obrigatoria: true },
        { id: 'resolucao-problemas', texto: 'Os problemas são resolvidos de forma adequada?',                 tipo: 'escala', obrigatoria: true },
        { id: 'feedback-gestao',     texto: 'Qual sua avaliação geral da gestão escolar?',                   tipo: 'aberta', obrigatoria: false }
      ]
    };
  }

  getAvaliacaoQualidade(): Avaliacao {
    return {
      titulo: 'Qualidade de Ensino',
      descricao: 'Avalie a qualidade das aulas, conteúdos e metodologias',
      perguntas: [
        { id: 'relevancia-conteudo', texto: 'O conteúdo é relevante e bem estruturado?',                      tipo: 'escala', obrigatoria: true },
        { id: 'metodologia',         texto: 'As metodologias de ensino são eficazes?',                        tipo: 'escala', obrigatoria: true },
        { id: 'recursos-didaticos',  texto: 'Há uso adequado de recursos didáticos?',                        tipo: 'escala', obrigatoria: true },
        { id: 'aprendizado',         texto: 'Os educandos demonstram compreensão dos conteúdos?',             tipo: 'escala', obrigatoria: true },
        { id: 'avaliacao',           texto: 'Os processos de avaliação são justos e claros?',                 tipo: 'escala', obrigatoria: true },
        { id: 'retorno-alunos',      texto: 'Há feedback adequado aos educandos?',                           tipo: 'escala', obrigatoria: true },
        { id: 'aprimoramentos',      texto: 'Sugestões para aprimorar a qualidade de ensino',                tipo: 'aberta', obrigatoria: false }
      ]
    };
  }

  enviarAvaliacao(form: any): void {
    this.finalizarAvaliacao();
  }
}
