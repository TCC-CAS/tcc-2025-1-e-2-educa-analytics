import { Component, OnInit } from '@angular/core';
import { AvaliacaoApiService, DashboardEscolarData, DashboardFormulario, DashboardTurma, DiversidadeData } from '../../../avaliacoes/services/avaliacao-api.service';

// Map of question IDs to human-readable labels per form
const PERGUNTAS_LABELS: { [tipo: string]: { [id: string]: string } } = {
  'infraestrutura': {
    'conservacao-salas':        'Conservação das salas de aula',
    'higiene-banheiros':        'Higiene dos banheiros',
    'espacos-recreacao':        'Espaços de recreação',
    'biblioteca':               'Biblioteca / sala de leitura',
    'materiais-didaticos':      'Materiais didáticos',
    'equipamentos-tecnologicos':'Equipamentos tecnológicos',
    'internet':                 'Conexão à internet',
    'seguranca-acesso':         'Segurança e controle de acesso',
    'acessibilidade':           'Acessibilidade',
    'equipamentos-seguranca':   'Equipamentos de segurança',
    'limpeza-organizacao':      'Limpeza e organização',
    'bem-estar-ambiente':       'Bem-estar no ambiente escolar',
    'avaliacao-geral':          'Avaliação geral da infraestrutura',
  },
  'clima-socioemocional': {
    'respeito':    'Respeito e inclusão',
    'comunicacao': 'Comunicação efetiva',
    'colaboracao': 'Colaboração e trabalho em equipe',
    'bem-estar':   'Bem-estar emocional',
    'conflitos':   'Resolução de conflitos',
    'apoio':       'Suporte emocional disponível',
  },
  'gestao-escolar': {
    'lideranca':           'Qualidade da liderança',
    'transparencia':       'Transparência nas decisões',
    'processos':           'Eficiência dos processos',
    'comunicacao-gestao':  'Comunicação gestão–equipe',
    'delegacao':           'Delegação de responsabilidades',
    'resolucao-problemas': 'Resolução de problemas',
  },
  'qualidade-ensino': {
    'relevancia-conteudo': 'Relevância do conteúdo',
    'metodologia':         'Metodologias de ensino',
    'recursos-didaticos':  'Recursos didáticos',
    'aprendizado':         'Compreensão dos educandos',
    'avaliacao':           'Processos avaliativos',
    'retorno-alunos':      'Feedback aos educandos',
  },
};

interface FormularioView extends DashboardFormulario {
  aberto: boolean;
  perguntasArray: { id: string; label: string; media: number }[];
}

interface ParticipacaoData {
  papel: string;
  label: string;
  cor: string;
  emoji: string;
  responderam: number;
  total: number;
  pct: number;
  arc: number;
  circ: number;
}

@Component({
  selector: 'app-dashboard-escolar',
  templateUrl: './dashboard-escolar.component.html',
  styleUrls: ['./dashboard-escolar.component.scss']
})
export class DashboardEscolarComponent implements OnInit {
  isLoading = true;
  erro: string | null = null;

  formularios: FormularioView[] = [];
  totais: DashboardEscolarData['totais'] = { total_respondentes: 0, por_papel: {} };
  totaisInstituicao: { [papel: string]: number } = {};
  porTurma: DashboardTurma[] = [];

  // Diversidade
  diversidade: DiversidadeData = { total: 0, cor_raca: [], genero: [], faixas: [], nacionalidade: [] };
  isLoadingDiversidade = true;

  dataAtualizacao = new Date().toLocaleDateString('pt-BR');

  constructor(private api: AvaliacaoApiService) {}

  ngOnInit(): void {
    this.api.getDashboard().subscribe({
      next: (data) => {
        this.totais = data.totais;
        this.totaisInstituicao = data.totais_instituicao || {};
        this.porTurma = data.por_turma || [];
        this.formularios = (data.formularios || []).map(f => {
          const labelsMap = PERGUNTAS_LABELS[f.tipo] || {};
          const perguntasArray = Object.entries(f.por_pergunta || {})
            .map(([id, media]) => ({
              id,
              label: labelsMap[id] || id,
              media: media as number,
            }))
            .sort((a, b) => b.media - a.media);
          return { ...f, aberto: false, perguntasArray };
        });
        this.diversidade = data.diversidade ?? { total: 0, cor_raca: [], genero: [], faixas: [], nacionalidade: [] };
        this.isLoading = false;
        this.isLoadingDiversidade = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar os dados do dashboard.';
        this.isLoading = false;
        this.isLoadingDiversidade = false;
      }
    });
  }

  toggleFormulario(f: FormularioView): void {
    f.aberto = !f.aberto;
  }

  corScore(val: number): string {
    if (val >= 80) return 'excelente';
    if (val >= 60) return 'bom';
    if (val >= 40) return 'regular';
    return 'atencao';
  }

  labelScore(val: number): string {
    if (val >= 80) return 'Excelente';
    if (val >= 60) return 'Bom';
    if (val >= 40) return 'Regular';
    return 'Atenção';
  }

  totalPapel(papel: string): number {
    return this.totais.por_papel?.[papel] || 0;
  }

  pctPapel(papel: string): number {
    const total = this.totais.total_respondentes;
    if (!total) return 0;
    return Math.round((this.totalPapel(papel) / total) * 100);
  }

  mediaFormulario(f: DashboardFormulario, papel: string): number {
    return f.por_papel?.[papel]?.media || 0;
  }

  respondeuFormulario(f: DashboardFormulario, papel: string): number {
    return f.por_papel?.[papel]?.responderam || 0;
  }

  get temDados(): boolean {
    return this.totais.total_respondentes > 0;
  }

  get dadosParticipacao(): ParticipacaoData[] {
    const circ = 2 * Math.PI * 50;
    const entries = [
      { papel: 'educador',    label: 'Educadores',  cor: '#b5b2fb', emoji: '👨‍🏫' },
      { papel: 'educando',   label: 'Educandos',   cor: '#d4aaee', emoji: '🎓'  },
      { papel: 'responsavel',label: 'Responsáveis',cor: '#e8baf0', emoji: '👨‍👧' },
    ];
    return entries.map(e => {
      const responderam = this.totalPapel(e.papel);
      const total = Math.max(this.totaisInstituicao[e.papel] || 0, responderam);
      const pct = total > 0 ? Math.round((responderam / total) * 100) : 0;
      const arc  = total > 0 ? (responderam / total) * circ : 0;
      return { ...e, responderam, total, pct, arc, circ };
    });
  }

  totalInstituicao(papel: string): number {
    return this.totaisInstituicao[papel] || 0;
  }

  // ── Helpers de diversidade ────────────────────────────────────────────────

  // Cores pasteis para raça (ordem: Branco, Pardo, Preto, Amarelo, Indígena, Não Declarado)
  readonly COR_RACA_COLORS: Record<string, string> = {
    'Branco':         '#93c5fd',
    'Pardo':          '#fde68a',
    'Preto':          '#c4b5fd',
    'Amarelo':        '#fca5a5',
    'Indígena':       '#6ee7b7',
    'Não Declarado':  '#d1d5db',
  };

  readonly GENERO_COLORS: Record<string, { fill: string; text: string }> = {
    'Masculino':    { fill: '#93c5fd', text: '#1e3a8a' },
    'Feminino':     { fill: '#f9a8d4', text: '#831843' },
    'Outro':        { fill: '#fde68a', text: '#78350f' },
    'Não Declarado':{ fill: '#d1d5db', text: '#374151' },
  };

  corRacaColor(label: string): string {
    return this.COR_RACA_COLORS[label] || '#e2e8f0';
  }

  // Paleta de cores para nacionalidade (cíclica)
  private readonly _NAC_PALETTE = [
    '#818cf8','#34d399','#fb923c','#f472b6','#38bdf8','#a78bfa','#4ade80','#fbbf24',
  ];
  nacColor(index: number): string {
    return this._NAC_PALETTE[index % this._NAC_PALETTE.length];
  }

  generoFill(label: string): string {
    return (this.GENERO_COLORS[label] || { fill: '#e2e8f0' }).fill;
  }

  generoText(label: string): string {
    return (this.GENERO_COLORS[label] || { text: '#374151' }).text;
  }

  get maxPiramide(): number {
    if (!this.diversidade.faixas.length) return 1;
    return Math.max(
      ...this.diversidade.faixas.map(f => Math.max(f.masculino, f.feminino, f.outro)),
      1
    );
  }

  // Gera os segmentos do donut SVG de raça/cor
  // SVG viewBox 0 0 120 120, r=46, cx/cy=60
  get donutRacaSegmentos(): { label: string; pct: number; dash: string; offset: number; color: string }[] {
    const total = this.diversidade.cor_raca.reduce((s, i) => s + i.total, 0) || 1;
    const circ  = 2 * Math.PI * 46;
    let offset  = 0;
    return this.diversidade.cor_raca.map(item => {
      const arc  = (item.total / total) * circ;
      const seg  = { label: item.label, pct: item.pct, dash: `${arc} ${circ - arc}`, offset, color: this.corRacaColor(item.label) };
      offset += arc;
      return seg;
    });
  }

  get dadosComparativo(): { titulo: string; icone: string; educador: number; educando: number; responsavel: number }[] {
    return this.formularios.map(f => ({
      titulo: f.titulo,
      icone:  f.icone,
      educador:    Math.round(f.por_papel?.['educador']?.media    || 0),
      educando:    Math.round(f.por_papel?.['educando']?.media    || 0),
      responsavel: Math.round(f.por_papel?.['responsavel']?.media || 0),
    }));
  }
}
