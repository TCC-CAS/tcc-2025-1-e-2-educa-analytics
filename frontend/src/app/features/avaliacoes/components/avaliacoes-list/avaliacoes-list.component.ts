import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AvaliacaoApiService } from '../../services/avaliacao-api.service';

interface Avaliacao {
  id: string;
  titulo: string;
  descricao: string;
  publico: string[];
  icone: string;
  cor: string;
  respondida: boolean;
  dataResposta?: string;
  xpRecompensa: number;
  categoria?: 'institucional' | 'bncc';
  disciplina?: string;
  series?: string;
}

@Component({
  selector: 'app-avaliacoes-list',
  templateUrl: './avaliacoes-list.component.html',
  styleUrls: ['./avaliacoes-list.component.scss']
})
export class AvaliacoesListComponent implements OnInit {
  avaliacoes: Avaliacao[] = [];
  usuarioTipo: string = 'educador';
  carregandoRespondidas = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private avaliacaoApi: AvaliacaoApiService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.usuarioTipo = user?.tipo || 'educador';

    // Redireciona para /avaliacoes/:id se o ID não estiver na URL
    const idNaRota = this.route.snapshot.paramMap.get('id');
    if (!idNaRota && user?.id) {
      this.router.navigate(['/avaliacoes', user.id], { replaceUrl: true });
      return;
    }

    this.carregarAvaliacoes();
    this.carregarRespondidas();
    this.carregarFormulariosCustomizados();
  }

  carregarRespondidas(): void {
    this.carregandoRespondidas = true;
    this.avaliacaoApi.getRespondidas().subscribe({
      next: (res) => {
        this.carregandoRespondidas = false;
        const respondidas = res.respondidas || [];
        respondidas.forEach(r => {
          const av = this.avaliacoes.find(a => a.id === r.tipo);
          if (av) {
            av.respondida = true;
            if (r.dataResposta) av.dataResposta = r.dataResposta;
          }
        });
      },
      error: () => { this.carregandoRespondidas = false; }
    });
  }

  carregarFormulariosCustomizados(): void {
    this.avaliacaoApi.getFormulariosCustomizados().subscribe(res => {
      const forms = res.formularios || [];
      forms.forEach(f => {
        if (!this.avaliacoes.find(a => a.id === f.id)) {
          this.avaliacoes.push({
            id: f.id,
            titulo: f.titulo,
            descricao: f.descricao,
            publico: f.publico || [],
            icone: f.icone || '📋',
            cor: f.cor || 'azul',
            respondida: false,
            xpRecompensa: 0,
            categoria: 'institucional'
          });
        }
      });
      // Re-aplica estado de respondidas para os novos formulários
      this.carregarRespondidas();
    });
  }

  get avaliacoesBncc(): Avaliacao[] {
    return this.avaliacoes.filter(a => a.categoria === 'bncc');
  }

  get avaliacoesInstitucionais(): Avaliacao[] {
    return this.avaliacoes.filter(a => a.categoria !== 'bncc');
  }

  carregarAvaliacoes(): void {
    const todas: Avaliacao[] = [
      // ── BNCC – Língua Portuguesa ──
      {
        id: 'lp-anos-1-2',
        titulo: 'Língua Portuguesa – 1º e 2º Ano',
        descricao: 'Avaliação BNCC: leitura, escrita, oralidade e análise linguística para os anos iniciais do Ensino Fundamental.',
        publico: ['educador'],
        icone: '📖',
        cor: 'azul',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Língua Portuguesa',
        series: '1º e 2º Ano'
      },
      {
        id: 'lp-anos-3-5',
        titulo: 'Língua Portuguesa – 3º ao 5º Ano',
        descricao: 'Avaliação BNCC: fluência leitora, produção textual, oralidade e morfossintaxe para os anos intermediários.',
        publico: ['educador'],
        icone: '📖',
        cor: 'verde',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Língua Portuguesa',
        series: '3º ao 5º Ano'
      },
      {
        id: 'lp-anos-6-9',
        titulo: 'Língua Portuguesa – 6º ao 9º Ano',
        descricao: 'Avaliação BNCC: compreensão crítica, multiletramentos, argumentação e análise semiótica para os anos finais.',
        publico: ['educador'],
        icone: '📖',
        cor: 'roxo',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Língua Portuguesa',
        series: '6º ao 9º Ano'
      },
      // ── BNCC – História ──
      {
        id: 'hist-ano-1',
        titulo: 'História – 1º Ano',
        descricao: 'Avaliação BNCC: mundo pessoal, histórias familiares, brincadeiras e comemorações para o 1º ano.',
        publico: ['educador'],
        icone: '🏛️',
        cor: 'amarelo',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'História',
        series: '1º Ano'
      },
      {
        id: 'hist-ano-2',
        titulo: 'História – 2º Ano',
        descricao: 'Avaliação BNCC: comunidade, registros, tempo como medida e trabalho sustentável para o 2º ano.',
        publico: ['educador'],
        icone: '🏛️',
        cor: 'rosa',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'História',
        series: '2º Ano'
      },
      {
        id: 'hist-ano-3',
        titulo: 'História – 3º Ano',
        descricao: 'Avaliação BNCC: cidade, patrimônios, espaço público e privado e atividades urbanas para o 3º ano.',
        publico: ['educador'],
        icone: '🏛️',
        cor: 'roxo',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'História',
        series: '3º Ano'
      },
      {
        id: 'hist-ano-4',
        titulo: 'História – 4º Ano',
        descricao: 'Avaliação BNCC: transformações históricas, circulação de culturas e migrações para o 4º ano.',
        publico: ['educador'],
        icone: '🏛️',
        cor: 'laranja',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'História',
        series: '4º Ano'
      },
      {
        id: 'hist-ano-5',
        titulo: 'História – 5º Ano',
        descricao: 'Avaliação BNCC: povos e culturas, cidadania, registros históricos e patrimônios para o 5º ano.',
        publico: ['educador'],
        icone: '🏛️',
        cor: 'cinza',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'História',
        series: '5º Ano'
      },
      {
        id: 'hist-ano-6',
        titulo: 'História – 6º Ano',
        descricao: 'Avaliação BNCC: tempo, fontes históricas, Antiguidade Clássica e mundo medieval para o 6º ano.',
        publico: ['educador'],
        icone: '🏛️',
        cor: 'azul',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'História',
        series: '6º Ano'
      },
      {
        id: 'hist-ano-7',
        titulo: 'História – 7º Ano',
        descricao: 'Avaliação BNCC: modernidade, Renascimento, colonização americana e escravidão para o 7º ano.',
        publico: ['educador'],
        icone: '🏛️',
        cor: 'verde',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'História',
        series: '7º Ano'
      },
      {
        id: 'hist-ano-8',
        titulo: 'História – 8º Ano',
        descricao: 'Avaliação BNCC: Iluminismo, independências americanas, Brasil Império e imperialismo para o 8º ano.',
        publico: ['educador'],
        icone: '🏛️',
        cor: 'amarelo',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'História',
        series: '8º Ano'
      },
      {
        id: 'hist-ano-9',
        titulo: 'História – 9º Ano',
        descricao: 'Avaliação BNCC: República, totalitarismos, ditadura civil-militar e história recente para o 9º ano.',
        publico: ['educador'],
        icone: '🏛️',
        cor: 'rosa',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'História',
        series: '9º Ano'
      },
      // ── BNCC – Geografia ──
      {
        id: 'geo-ano-1',
        titulo: 'Geografia – 1º Ano',
        descricao: 'Avaliação BNCC: sujeito e lugar, conexões, trabalho, representação e natureza para o 1º ano.',
        publico: ['educador'],
        icone: '🗺️',
        cor: 'verde',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Geografia',
        series: '1º Ano'
      },
      {
        id: 'geo-ano-2',
        titulo: 'Geografia – 2º Ano',
        descricao: 'Avaliação BNCC: comunidade, bairro, percursos, meios de comunicação e paisagem para o 2º ano.',
        publico: ['educador'],
        icone: '🗺️',
        cor: 'azul',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Geografia',
        series: '2º Ano'
      },
      {
        id: 'geo-ano-3',
        titulo: 'Geografia – 3º Ano',
        descricao: 'Avaliação BNCC: cidade, campo, trabalho, representação cartográfica e fenômenos naturais para o 3º ano.',
        publico: ['educador'],
        icone: '🗺️',
        cor: 'amarelo',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Geografia',
        series: '3º Ano'
      },
      {
        id: 'geo-ano-4',
        titulo: 'Geografia – 4º Ano',
        descricao: 'Avaliação BNCC: identidade regional, divisão territorial, trabalho, mapas e biomas para o 4º ano.',
        publico: ['educador'],
        icone: '🗺️',
        cor: 'rosa',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Geografia',
        series: '4º Ano'
      },
      {
        id: 'geo-ano-5',
        titulo: 'Geografia – 5º Ano',
        descricao: 'Avaliação BNCC: Brasil, globalização, trabalho, projeções cartográficas e questões ambientais para o 5º ano.',
        publico: ['educador'],
        icone: '🗺️',
        cor: 'roxo',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Geografia',
        series: '5º Ano'
      },
      {
        id: 'geo-ano-6',
        titulo: 'Geografia – 6º Ano',
        descricao: 'Avaliação BNCC: sujeito, território, globalização, escala cartográfica e dinâmicas naturais para o 6º ano.',
        publico: ['educador'],
        icone: '🗺️',
        cor: 'laranja',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Geografia',
        series: '6º Ano'
      },
      {
        id: 'geo-ano-7',
        titulo: 'Geografia – 7º Ano',
        descricao: 'Avaliação BNCC: diversidade cultural, América Latina, trabalho, fusos horários e biomas para o 7º ano.',
        publico: ['educador'],
        icone: '🗺️',
        cor: 'cinza',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Geografia',
        series: '7º Ano'
      },
      {
        id: 'geo-ano-8',
        titulo: 'Geografia – 8º Ano',
        descricao: 'Avaliação BNCC: identidade, capitalismo, geopolítica, projeções e conflitos ambientais para o 8º ano.',
        publico: ['educador'],
        icone: '🗺️',
        cor: 'azul',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Geografia',
        series: '8º Ano'
      },
      {
        id: 'geo-ano-9',
        titulo: 'Geografia – 9º Ano',
        descricao: 'Avaliação BNCC: globalização, geopolítica mundial, trabalho, cartografia digital e desafios ambientais para o 9º ano.',
        publico: ['educador'],
        icone: '🗺️',
        cor: 'verde',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Geografia',
        series: '9º Ano'
      },
      // ── BNCC – Ciências ──
      {
        id: 'ci-ano-1',
        titulo: 'Ciências – 1º Ano',
        descricao: 'Avaliação BNCC: materiais, corpo humano, higiene e escalas de tempo para o 1º ano.',
        publico: ['educador'],
        icone: '🔬',
        cor: 'verde',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Ciências',
        series: '1º Ano'
      },
      {
        id: 'ci-ano-2',
        titulo: 'Ciências – 2º Ano',
        descricao: 'Avaliação BNCC: propriedades dos materiais, plantas, movimento do Sol e radiação solar para o 2º ano.',
        publico: ['educador'],
        icone: '🔬',
        cor: 'azul',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Ciências',
        series: '2º Ano'
      },
      {
        id: 'ci-ano-3',
        titulo: 'Ciências – 3º Ano',
        descricao: 'Avaliação BNCC: som, luz, animais, observação do céu e solo para o 3º ano.',
        publico: ['educador'],
        icone: '🔬',
        cor: 'amarelo',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Ciências',
        series: '3º Ano'
      },
      {
        id: 'ci-ano-4',
        titulo: 'Ciências – 4º Ano',
        descricao: 'Avaliação BNCC: misturas, cadeias alimentares, microrganismos e pontos cardeais para o 4º ano.',
        publico: ['educador'],
        icone: '🔬',
        cor: 'rosa',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Ciências',
        series: '4º Ano'
      },
      {
        id: 'ci-ano-5',
        titulo: 'Ciências – 5º Ano',
        descricao: 'Avaliação BNCC: ciclo hidrológico, nutrição, sistemas do corpo, fases da Lua e constelações para o 5º ano.',
        publico: ['educador'],
        icone: '🔬',
        cor: 'roxo',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Ciências',
        series: '5º Ano'
      },
      {
        id: 'ci-ano-6',
        titulo: 'Ciências – 6º Ano',
        descricao: 'Avaliação BNCC: misturas, célula, sistemas do corpo, estrutura da Terra e movimentos terrestres para o 6º ano.',
        publico: ['educador'],
        icone: '🔬',
        cor: 'laranja',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Ciências',
        series: '6º Ano'
      },
      {
        id: 'ci-ano-7',
        titulo: 'Ciências – 7º Ano',
        descricao: 'Avaliação BNCC: calor, ecossistemas, efeito estufa, camada de ozônio e deriva continental para o 7º ano.',
        publico: ['educador'],
        icone: '🔬',
        cor: 'cinza',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Ciências',
        series: '7º Ano'
      },
      {
        id: 'ci-ano-8',
        titulo: 'Ciências – 8º Ano',
        descricao: 'Avaliação BNCC: circuitos elétricos, reprodução, sexualidade, sistema Sol-Terra-Lua e clima para o 8º ano.',
        publico: ['educador'],
        icone: '🔬',
        cor: 'azul',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Ciências',
        series: '8º Ano'
      },
      {
        id: 'ci-ano-9',
        titulo: 'Ciências – 9º Ano',
        descricao: 'Avaliação BNCC: estrutura da matéria, radiações, hereditariedade, evolução e Sistema Solar para o 9º ano.',
        publico: ['educador'],
        icone: '🔬',
        cor: 'verde',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Ciências',
        series: '9º Ano'
      },
      // ── BNCC – Matemática ──
      {
        id: 'mat-ano-1',
        titulo: 'Matemática – 1º Ano',
        descricao: 'Avaliação BNCC: números, geometria, grandezas e medidas e probabilidade para o 1º ano.',
        publico: ['educador'],
        icone: '🔢',
        cor: 'azul',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Matemática',
        series: '1º Ano'
      },
      {
        id: 'mat-ano-2',
        titulo: 'Matemática – 2º Ano',
        descricao: 'Avaliação BNCC: sistema decimal, frações simples, geometria e estatística para o 2º ano.',
        publico: ['educador'],
        icone: '🔢',
        cor: 'verde',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Matemática',
        series: '2º Ano'
      },
      {
        id: 'mat-ano-3',
        titulo: 'Matemática – 3º Ano',
        descricao: 'Avaliação BNCC: milhar, multiplicação, frações, geometria espacial e plana para o 3º ano.',
        publico: ['educador'],
        icone: '🔢',
        cor: 'amarelo',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Matemática',
        series: '3º Ano'
      },
      {
        id: 'mat-ano-4',
        titulo: 'Matemática – 4º Ano',
        descricao: 'Avaliação BNCC: dezenas de milhar, frações unitárias, ângulos, simetria e temperatura para o 4º ano.',
        publico: ['educador'],
        icone: '🔢',
        cor: 'rosa',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Matemática',
        series: '4º Ano'
      },
      {
        id: 'mat-ano-5',
        titulo: 'Matemática – 5º Ano',
        descricao: 'Avaliação BNCC: racionais, porcentagem, plano cartesiano, volume e probabilidade para o 5º ano.',
        publico: ['educador'],
        icone: '🔢',
        cor: 'roxo',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Matemática',
        series: '5º Ano'
      },
      {
        id: 'mat-ano-6',
        titulo: 'Matemática – 6º Ano',
        descricao: 'Avaliação BNCC: frações, potenciação, álgebra, geometria no plano cartesiano e probabilidade para o 6º ano.',
        publico: ['educador'],
        icone: '🔢',
        cor: 'laranja',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Matemática',
        series: '6º Ano'
      },
      {
        id: 'mat-ano-7',
        titulo: 'Matemática – 7º Ano',
        descricao: 'Avaliação BNCC: inteiros, equações do 1º grau, transformações geométricas, π e gráficos de setores para o 7º ano.',
        publico: ['educador'],
        icone: '🔢',
        cor: 'cinza',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Matemática',
        series: '7º Ano'
      },
      {
        id: 'mat-ano-8',
        titulo: 'Matemática – 8º Ano',
        descricao: 'Avaliação BNCC: notação científica, sistemas de equações, congruência, áreas e medidas estatísticas para o 8º ano.',
        publico: ['educador'],
        icone: '🔢',
        cor: 'azul',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Matemática',
        series: '8º Ano'
      },
      {
        id: 'mat-ano-9',
        titulo: 'Matemática – 9º Ano',
        descricao: 'Avaliação BNCC: números reais, funções, Teorema de Pitágoras, volume e análise de gráficos da mídia para o 9º ano.',
        publico: ['educador'],
        icone: '🔢',
        cor: 'verde',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Matemática',
        series: '9º Ano'
      },
      // ── BNCC – Língua Inglesa ──
      {
        id: 'li-ano-6',
        titulo: 'Língua Inglesa – 6º Ano',
        descricao: 'Avaliação BNCC: oralidade, leitura, escrita, conhecimentos linguísticos e dimensão intercultural para o 6º ano.',
        publico: ['educador'],
        icone: '🌍',
        cor: 'azul',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Língua Inglesa',
        series: '6º Ano'
      },
      {
        id: 'li-ano-7',
        titulo: 'Língua Inglesa – 7º Ano',
        descricao: 'Avaliação BNCC: narrativas orais, inferência, produção textual e análise intercultural para o 7º ano.',
        publico: ['educador'],
        icone: '🌍',
        cor: 'verde',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Língua Inglesa',
        series: '7º Ano'
      },
      {
        id: 'li-ano-8',
        titulo: 'Língua Inglesa – 8º Ano',
        descricao: 'Avaliação BNCC: uso do futuro, análise crítica, revisão textual e repertório cultural para o 8º ano.',
        publico: ['educador'],
        icone: '🌍',
        cor: 'roxo',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Língua Inglesa',
        series: '8º Ano'
      },
      {
        id: 'li-ano-9',
        titulo: 'Língua Inglesa – 9º Ano',
        descricao: 'Avaliação BNCC: argumentação oral e escrita, gêneros digitais, condicionais e identidades globais para o 9º ano.',
        publico: ['educador'],
        icone: '🌍',
        cor: 'laranja',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Língua Inglesa',
        series: '9º Ano'
      },
      // ── BNCC – Educação Física ──
      {
        id: 'ef-anos-1-2',
        titulo: 'Educação Física – 1º e 2º Ano',
        descricao: 'Avaliação BNCC: brincadeiras e jogos, esportes, ginástica e dança para os anos iniciais do Ensino Fundamental.',
        publico: ['educador'],
        icone: '⚽',
        cor: 'verde',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Educação Física',
        series: '1º e 2º Ano'
      },
      {
        id: 'ef-anos-3-5',
        titulo: 'Educação Física – 3º ao 5º Ano',
        descricao: 'Avaliação BNCC: brincadeiras, esportes, ginástica, dança e lutas para os anos intermediários do Ensino Fundamental.',
        publico: ['educador'],
        icone: '🏅',
        cor: 'laranja',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Educação Física',
        series: '3º ao 5º Ano'
      },
      {
        id: 'ef-anos-6-7',
        titulo: 'Educação Física – 6º e 7º Ano',
        descricao: 'Avaliação BNCC: jogos eletrônicos, esportes, ginástica, danças urbanas, lutas e práticas de aventura urbana.',
        publico: ['educador'],
        icone: '🧗',
        cor: 'roxo',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Educação Física',
        series: '6º e 7º Ano'
      },
      {
        id: 'ef-anos-8-9',
        titulo: 'Educação Física – 8º e 9º Ano',
        descricao: 'Avaliação BNCC: esportes avançados, ginástica de condicionamento, danças de salão, lutas do mundo e aventura na natureza.',
        publico: ['educador'],
        icone: '🏆',
        cor: 'azul',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Educação Física',
        series: '8º e 9º Ano'
      },
      // ── BNCC – Arte ──
      {
        id: 'arte-anos-1-5',
        titulo: 'Arte – 1º ao 5º Ano',
        descricao: 'Avaliação BNCC: artes visuais, dança, música, teatro e artes integradas para os anos iniciais e intermediários.',
        publico: ['educador'],
        icone: '🎨',
        cor: 'rosa',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Arte',
        series: '1º ao 5º Ano'
      },
      {
        id: 'arte-anos-6-9',
        titulo: 'Arte – 6º ao 9º Ano',
        descricao: 'Avaliação BNCC: apreciação crítica, criação, interdisciplinaridade e tecnologias digitais nas quatro linguagens artísticas.',
        publico: ['educador'],
        icone: '🎭',
        cor: 'roxo',
        respondida: false,
        xpRecompensa: 0,
        categoria: 'bncc',
        disciplina: 'Arte',
        series: '6º ao 9º Ano'
      },
      // ── Avaliações Institucionais ──
      {
        id: 'condicoes-trabalho',
        titulo: 'Condições de Trabalho',
        descricao: 'Avalie os ambientes, recursos e equipamentos oferecidos pela instituição.',
        publico: ['administrativo'],
        icone: '💼',
        cor: 'azul',
        respondida: false,
        xpRecompensa: 700,
        categoria: 'institucional'
      },
      {
        id: 'participacao-educandos',
        titulo: 'Participação dos Educandos',
        descricao: 'Avalie o engajamento e participação nas atividades escolares.',
        publico: ['administrativo'],
        icone: '🎓',
        cor: 'verde',
        respondida: false,
        xpRecompensa: 700,
        categoria: 'institucional'
      },
      {
        id: 'infraestrutura',
        titulo: 'Infraestrutura',
        descricao: 'Avalie instalações, equipamentos e recursos da instituição.',
        publico: ['educador', 'educando', 'responsavel', 'administrativo'],
        icone: '🏫',
        cor: 'amarelo',
        respondida: false,
        xpRecompensa: 700,
        categoria: 'institucional'
      },
      {
        id: 'clima-socioemocional',
        titulo: 'Clima Socioemocional',
        descricao: 'Avalie o bem-estar, respeito e inclusão na instituição.',
        publico: ['educador', 'educando', 'responsavel', 'administrativo'],
        icone: '💝',
        cor: 'rosa',
        respondida: false,
        xpRecompensa: 700,
        categoria: 'institucional'
      },
      {
        id: 'autonomia',
        titulo: 'Autonomia',
        descricao: 'Avalie a liberdade para iniciativas e tomada de decisões.',
        publico: ['administrativo'],
        icone: '🚀',
        cor: 'roxo',
        respondida: false,
        xpRecompensa: 600,
        categoria: 'institucional'
      },
      {
        id: 'gestao-escolar',
        titulo: 'Gestão Escolar',
        descricao: 'Avalie a efetividade da administração e liderança.',
        publico: ['educador', 'educando', 'responsavel', 'administrativo'],
        icone: '⚙️',
        cor: 'cinza',
        respondida: false,
        xpRecompensa: 700,
        categoria: 'institucional'
      },
      {
        id: 'qualidade-ensino',
        titulo: 'Qualidade de Ensino',
        descricao: 'Avalie aulas, conteúdos e metodologias de ensino.',
        publico: ['educador', 'educando', 'responsavel', 'administrativo'],
        icone: '📚',
        cor: 'laranja',
        respondida: false,
        xpRecompensa: 700,
        categoria: 'institucional'
      }
    ];

    this.avaliacoes = todas.filter(a => a.publico.includes(this.usuarioTipo));
  }

  // ── Filtros ───────────────────────────────────────────────────────────────

  obterAvaliacoesRespondidas(): Avaliacao[] {
    return this.avaliacoesInstitucionais.filter(a => a.respondida);
  }

  obterAvaliacoesPendentes(): Avaliacao[] {
    return this.avaliacoesInstitucionais.filter(a => !a.respondida);
  }

  // ── Gamification ──────────────────────────────────────────────────────────

  get totalXp(): number {
    return this.obterAvaliacoesRespondidas().reduce((sum, a) => sum + a.xpRecompensa, 0);
  }

  get xpParaProximoNivel(): number {
    return 1000 - (this.totalXp % 1000);
  }

  get xpProgressPercent(): number {
    return ((this.totalXp % 1000) / 1000) * 100;
  }

  get nivel(): number {
    return Math.floor(this.totalXp / 1000) + 1;
  }

  get nivelLabel(): string {
    const labels = ['Iniciante', 'Explorador', 'Participante', 'Colaborador', 'Especialista', 'Embaixador'];
    return labels[Math.min(this.nivel - 1, labels.length - 1)];
  }

  get percConcluido(): number {
    if (!this.avaliacoesInstitucionais.length) return 0;
    return Math.round((this.obterAvaliacoesRespondidas().length / this.avaliacoesInstitucionais.length) * 100);
  }

  get xpPendente(): number {
    return this.obterAvaliacoesPendentes().reduce((sum, a) => sum + a.xpRecompensa, 0);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  responderAvaliacao(avaliacao: Avaliacao): void {
    if (avaliacao.respondida && avaliacao.categoria !== 'bncc') {
      return; // Formulários institucionais não permitem reedição
    }
    this.router.navigate([`/avaliacoes/${avaliacao.id}`]);
  }

  visualizarResposta(avaliacao: Avaliacao): void {
    this.router.navigate([`/avaliacoes/${avaliacao.id}`]);
  }
}
