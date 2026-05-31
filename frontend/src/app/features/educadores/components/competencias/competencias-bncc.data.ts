export type NivelDesempenho = 'excelente' | 'bom' | 'regular' | 'precisa-apoio' | '';

export interface Criterio {
  id: string;
  nome: string;
  descricao: string;
  nivel: NivelDesempenho;
}

export interface Secao {
  id: string;
  titulo: string;
  icone: string;
  criterios: Criterio[];
}

export interface CampoAtuacao {
  campo: string;
  generos: string;
  objetivo: string;
}

export interface SinteseItem {
  id: string;
  dimensao: string;
  indicadores: string;
  observacoes: string;
}

export interface AvaliacaoBNCC {
  titulo: string;
  subtitulo: string;
  disciplina: string;
  secoes: Secao[];
  camposAtuacao: CampoAtuacao[];
  sintese: SinteseItem[];
}

function c(id: string, nome: string, descricao: string): Criterio {
  return { id, nome, descricao, nivel: '' };
}

// ══════════════════════════════════════════════════════════
// LÍNGUA PORTUGUESA
// ══════════════════════════════════════════════════════════

export const LP_1_2: AvaliacaoBNCC = {
  titulo: 'Avaliação de Língua Portuguesa',
  subtitulo: '1º e 2º Ano do Ensino Fundamental',
  disciplina: 'Língua Portuguesa',
  secoes: [
    {
      id: 'leitura', titulo: 'Leitura / Escuta', icone: '📖',
      criterios: [
        c('dec-flu',   'Decodificação e fluência',   'Lê palavras e frases com precisão e ritmo adequado.'),
        c('comp-txt',  'Compreensão de textos',       'Entende o sentido global de textos curtos e identifica informações explícitas.'),
        c('rec-gen',   'Reconhecimento de gêneros',   'Identifica o tipo de texto (lista, convite, cantiga, quadrinha etc.) e sua finalidade.'),
        c('lei-comp',  'Leitura compartilhada',       'Participa da leitura com o professor e colegas, demonstrando envolvimento.'),
      ]
    },
    {
      id: 'escrita', titulo: 'Escrita', icone: '✍️',
      criterios: [
        c('sis-alf',   'Sistema alfabético',    'Relaciona fonemas e grafemas, escreve palavras e frases de forma alfabética.'),
        c('ort-pon',   'Ortografia e pontuação','Usa letras maiúsculas, ponto final, interrogação e exclamação corretamente.'),
        c('prod-txt',  'Produção textual',      'Planeja e escreve textos curtos (bilhetes, listas, convites, relatos).'),
        c('rev-edi',   'Revisão e edição',      'Revisa o texto com ajuda do professor, corrigindo e aprimorando.'),
      ]
    },
    {
      id: 'oralidade', titulo: 'Oralidade', icone: '🗣️',
      criterios: [
        c('exp-oral',   'Expressão oral',           'Fala com clareza, boa articulação e tom de voz adequado.'),
        c('esc-ativa',  'Escuta ativa',              'Ouve atentamente e responde de forma pertinente.'),
        c('par-conv',   'Participação em conversas', 'Respeita turnos de fala e usa formas de tratamento adequadas.'),
        c('rec-canto',  'Recitação e canto',         'Recita parlendas e canta cantigas com ritmo e entonação.'),
      ]
    },
    {
      id: 'analise', titulo: 'Análise Linguística / Semiótica', icone: '🧠',
      criterios: [
        c('rec-alf',   'Reconhecimento do alfabeto', 'Nomeia letras e distingue formatos (imprensa/cursiva, maiúsculas/minúsculas).'),
        c('seg-sil',   'Segmentação e sílabas',      'Separa palavras em sílabas e identifica sons iniciais, mediais e finais.'),
        c('vocab',     'Vocabulário',                'Identifica sinônimos, antônimos e forma aumentativos/diminutivos.'),
        c('asp-gra',   'Aspectos gráficos',          'Reconhece sinais de pontuação e seus efeitos na entonação.'),
      ]
    }
  ],
  camposAtuacao: [
    { campo: 'Vida Cotidiana',      generos: 'Listas, bilhetes, convites, receitas, cantigas',     objetivo: 'Avaliar leitura e escrita de textos do cotidiano.' },
    { campo: 'Vida Pública',        generos: 'Cartazes, regras, campanhas, notícias',               objetivo: 'Desenvolver consciência cidadã e linguagem informativa.' },
    { campo: 'Estudo e Pesquisa',   generos: 'Relatos, entrevistas, verbetes, diagramas',           objetivo: 'Estimular curiosidade e práticas de investigação.' },
    { campo: 'Artístico-Literário', generos: 'Parlendas, quadrinhas, poemas, contos',               objetivo: 'Promover fruição estética e formação do leitor literário.' },
  ],
  sintese: [
    { id: 's-lei', dimensao: 'Leitura',              indicadores: 'Decodificação, compreensão, envolvimento',          observacoes: '' },
    { id: 's-esc', dimensao: 'Escrita',               indicadores: 'Planejamento, ortografia, adequação ao gênero',    observacoes: '' },
    { id: 's-ora', dimensao: 'Oralidade',             indicadores: 'Clareza, escuta, participação',                    observacoes: '' },
    { id: 's-ana', dimensao: 'Análise Linguística',   indicadores: 'Segmentação, vocabulário, pontuação',              observacoes: '' },
  ]
};

export const LP_3_5: AvaliacaoBNCC = {
  titulo: 'Avaliação de Língua Portuguesa',
  subtitulo: '3º, 4º e 5º Ano do Ensino Fundamental',
  disciplina: 'Língua Portuguesa',
  secoes: [
    {
      id: 'leitura', titulo: 'Leitura / Escuta', icone: '📖',
      criterios: [
        c('flu',    'Fluência',              'Lê textos em voz alta com autonomia e ritmo adequado.'),
        c('cg',     'Compreensão global',    'Identifica ideia central e recupera informações explícitas.'),
        c('inf',    'Inferência',            'Deduz informações implícitas e sentidos de palavras pelo contexto.'),
        c('estr',   'Estratégias de leitura','Relaciona partes do texto, reconhece pronomes anafóricos e coesão.'),
      ]
    },
    {
      id: 'escrita', titulo: 'Produção de Textos (Escrita)', icone: '✍️',
      criterios: [
        c('og',   'Ortografia e gramática', 'Aplica regras de ortografia, concordância e pontuação.'),
        c('coes', 'Coesão e progressão',    'Usa pronomes, articuladores e organiza o texto em parágrafos.'),
        c('adg',  'Adequação ao gênero',    'Produz textos conforme convenções (cartas, notícias, receitas, resenhas etc.).'),
        c('dig',  'Uso de recursos digitais','Planeja e produz textos multimodais (vídeos, vlogs, tutoriais).'),
      ]
    },
    {
      id: 'oralidade', titulo: 'Oralidade', icone: '🗣️',
      criterios: [
        c('par',  'Participação',          'Reconhece e utiliza gêneros orais (debates, entrevistas, telejornais).'),
        c('var',  'Variedades linguísticas','Identifica e respeita diferentes variedades regionais e culturais.'),
        c('exp',  'Expressão oral',        'Argumenta com clareza, respeitando pontos de vista diferentes.'),
        c('perf', 'Performances',          'Produz apresentações, declamações e vídeos com entonação e expressão corporal adequadas.'),
      ]
    },
    {
      id: 'analise', titulo: 'Análise Linguística / Semiótica', icone: '🧠',
      criterios: [
        c('ort',  'Ortografia',     'Usa corretamente acentuação, dígrafos e grafias regulares/irregulares.'),
        c('morf', 'Morfossintaxe',  'Identifica substantivos, adjetivos, verbos e aplica concordância.'),
        c('voc',  'Vocabulário',    'Reconhece palavras primitivas, derivadas, compostas e polissêmicas.'),
        c('pont', 'Pontuação',      'Usa vírgula, ponto e vírgula, aspas, reticências e outros sinais com sentido adequado.'),
      ]
    }
  ],
  camposAtuacao: [
    { campo: 'Vida Cotidiana',      generos: 'Cartas pessoais, diários, receitas, regras de jogos, piadas',  objetivo: 'Avaliar escrita e leitura de textos do cotidiano.' },
    { campo: 'Vida Pública',        generos: 'Notícias, reportagens, campanhas, cartas de leitor',            objetivo: 'Desenvolver consciência cidadã e linguagem informativa.' },
    { campo: 'Estudo e Pesquisa',   generos: 'Relatos, verbetes, gráficos, tabelas, infográficos',            objetivo: 'Estimular investigação e produção científica escolar.' },
    { campo: 'Artístico-Literário', generos: 'Contos, poemas, quadrinhos, textos dramáticos',                 objetivo: 'Promover fruição estética e formação do leitor literário.' },
  ],
  sintese: [
    { id: 's-lei', dimensao: 'Leitura',            indicadores: 'Fluência, compreensão, inferência',                    observacoes: '' },
    { id: 's-esc', dimensao: 'Escrita',             indicadores: 'Ortografia, coesão, adequação ao gênero',              observacoes: '' },
    { id: 's-ora', dimensao: 'Oralidade',           indicadores: 'Participação, clareza, respeito à diversidade',         observacoes: '' },
    { id: 's-ana', dimensao: 'Análise Linguística', indicadores: 'Morfossintaxe, vocabulário, pontuação',                 observacoes: '' },
  ]
};

export const LP_6_9: AvaliacaoBNCC = {
  titulo: 'Avaliação de Língua Portuguesa',
  subtitulo: '6º ao 9º Ano do Ensino Fundamental',
  disciplina: 'Língua Portuguesa',
  secoes: [
    {
      id: 'leitura', titulo: 'Leitura / Escuta', icone: '📖',
      criterios: [
        c('cc',   'Compreensão crítica',     'Diferencia fato, opinião e discurso de ódio; identifica fake news.'),
        c('esl',  'Estratégias de leitura',  'Analisa contexto de produção, circulação e efeitos de sentido.'),
        c('mult', 'Multiletramentos',         'Interpreta textos multissemióticos (memes, charges, infográficos).'),
        c('cid',  'Consciência cidadã',       'Reconhece textos legais e normativos, compreendendo sua função social.'),
      ]
    },
    {
      id: 'escrita', titulo: 'Produção de Textos (Escrita)', icone: '✍️',
      criterios: [
        c('ag',   'Adequação ao gênero',      'Produz notícias, reportagens, artigos de opinião, resenhas, campanhas.'),
        c('pr',   'Planejamento e revisão',   'Planeja, revisa e edita textos, ajustando ortografia, coesão e estilo.'),
        c('dig',  'Uso de recursos digitais', 'Produz textos multimidiáticos (podcasts, vlogs, infográficos).'),
        c('arg',  'Argumentação',             'Sustenta pontos de vista com clareza, coesão e progressão temática.'),
      ]
    },
    {
      id: 'oralidade', titulo: 'Oralidade', icone: '🗣️',
      criterios: [
        c('deb',  'Participação em debates',  'Argumenta oralmente em discussões, respeitando turnos e opiniões.'),
        c('exp',  'Expressão oral',           'Usa entonação, ritmo, gestualidade e postura adequadas.'),
        c('prod', 'Produções orais',          'Realiza apresentações, entrevistas, telejornais e podcasts.'),
        c('crit', 'Consciência crítica',      'Refuta discursos de ódio e posiciona-se eticamente em debates.'),
      ]
    },
    {
      id: 'analise', titulo: 'Análise Linguística / Semiótica', icone: '🧠',
      criterios: [
        c('op',   'Ortografia e pontuação',   'Usa corretamente acentuação, sinais de pontuação e convenções gráficas.'),
        c('coe',  'Coesão e coerência',       'Emprega articuladores e operadores de conexão adequados.'),
        c('est',  'Recursos estilísticos',    'Analisa efeitos de sentido em textos jornalísticos, publicitários e literários.'),
        c('mod',  'Modalização',              'Reconhece usos de obrigatoriedade, permissão e apreciação em textos legais e políticos.'),
      ]
    }
  ],
  camposAtuacao: [
    { campo: 'Jornalístico-midiático',  generos: 'Notícias, reportagens, memes, charges, podcasts, vlogs',     objetivo: 'Desenvolver leitura crítica e produção ética da informação.' },
    { campo: 'Vida Pública',            generos: 'Estatutos, regimentos, cartas abertas, campanhas políticas',  objetivo: 'Promover cidadania, direitos humanos e participação democrática.' },
    { campo: 'Estudo e Pesquisa',       generos: 'Relatórios, artigos científicos, infográficos, verbetes',     objetivo: 'Estimular investigação, análise de dados e divulgação científica.' },
    { campo: 'Artístico-literário',     generos: 'Contos, crônicas, poemas, textos dramáticos',                 objetivo: 'Formar leitores críticos e sensíveis, valorizando diversidade cultural.' },
    { campo: 'Vida Cotidiana/Pessoal',  generos: 'Cartas, diários, relatos, resenhas',                          objetivo: 'Ampliar autonomia e protagonismo nas práticas sociais.' },
  ],
  sintese: [
    { id: 's-lei', dimensao: 'Leitura',            indicadores: 'Compreensão crítica, multiletramentos, análise de fake news', observacoes: '' },
    { id: 's-esc', dimensao: 'Escrita',             indicadores: 'Planejamento, revisão, adequação ao gênero',                  observacoes: '' },
    { id: 's-ora', dimensao: 'Oralidade',           indicadores: 'Participação em debates, produções orais',                    observacoes: '' },
    { id: 's-ana', dimensao: 'Análise Linguística', indicadores: 'Ortografia, coesão, modalização',                             observacoes: '' },
  ]
};

// ══════════════════════════════════════════════════════════
// ARTE
// ══════════════════════════════════════════════════════════

export const ARTE_1_5: AvaliacaoBNCC = {
  titulo: 'Avaliação de Arte',
  subtitulo: '1º ao 5º Ano do Ensino Fundamental',
  disciplina: 'Arte',
  secoes: [
    {
      id: 'artes-visuais', titulo: 'Artes Visuais', icone: '🎨',
      criterios: [
        c('pe',  'Percepção estética', 'Identifica e aprecia diferentes formas de artes visuais.'),
        c('ev',  'Elementos visuais',  'Reconhece ponto, linha, forma, cor, espaço e movimento.'),
        c('exp', 'Experimentação',     'Explora técnicas variadas (desenho, pintura, colagem, escultura etc.).'),
        c('cc',  'Criação coletiva',   'Produz trabalhos individuais e colaborativos, dialogando com colegas.'),
      ]
    },
    {
      id: 'danca', titulo: 'Dança', icone: '💃',
      criterios: [
        c('rc',  'Repertório corporal',  'Reconhece e aprecia diferentes manifestações da dança.'),
        c('mov', 'Movimento',            'Explora deslocamentos, planos, direções e ritmos variados.'),
        c('cr',  'Criação',              'Cria e improvisa movimentos individuais e coletivos.'),
        c('rd',  'Respeito e diálogo',   'Compartilha experiências pessoais e coletivas sem preconceito.'),
      ]
    },
    {
      id: 'musica', titulo: 'Música', icone: '🎵',
      criterios: [
        c('am',  'Apreciação musical',  'Reconhece diferentes gêneros e funções da música.'),
        c('em',  'Elementos musicais',  'Explora altura, intensidade, timbre, melodia e ritmo.'),
        c('fs',  'Fontes sonoras',      'Utiliza corpo, natureza e objetos como instrumentos.'),
        c('cm',  'Criação musical',     'Experimenta improvisações, composições e sonorização de histórias.'),
      ]
    },
    {
      id: 'teatro', titulo: 'Teatro', icone: '🎭',
      criterios: [
        c('at',  'Apreciação teatral',      'Reconhece e aprecia diferentes manifestações do teatro.'),
        c('tc',  'Teatralidade cotidiana',  'Identifica elementos teatrais em situações do dia a dia.'),
        c('imp', 'Improvisação',            'Participa de jogos e encenações coletivas e criativas.'),
        c('cp',  'Criação de personagens',  'Explora movimento e voz na construção de personagens.'),
      ]
    },
    {
      id: 'integradas', titulo: 'Artes Integradas', icone: '🌐',
      criterios: [
        c('ic',  'Interculturalidade',    'Valoriza brinquedos, jogos, danças e histórias de diferentes culturas.'),
        c('pc',  'Patrimônio cultural',   'Reconhece e valoriza o patrimônio material e imaterial brasileiro.'),
        c('td',  'Tecnologias digitais',  'Explora recursos digitais (vídeo, fotografia, softwares, animações).'),
        c('pi',  'Projetos integrados',   'Participa de produções que articulam diferentes linguagens artísticas.'),
      ]
    }
  ],
  camposAtuacao: [],
  sintese: [
    { id: 's-cri',  dimensao: 'Criação',   indicadores: 'Produção artística individual e coletiva',          observacoes: '' },
    { id: 's-crt',  dimensao: 'Crítica',   indicadores: 'Reflexão sobre manifestações culturais',            observacoes: '' },
    { id: 's-est',  dimensao: 'Estesia',   indicadores: 'Sensibilidade e percepção corporal/visual',         observacoes: '' },
    { id: 's-exp',  dimensao: 'Expressão', indicadores: 'Exteriorização de ideias e sentimentos',            observacoes: '' },
    { id: 's-fru',  dimensao: 'Fruição',   indicadores: 'Apreciação estética e prazer artístico',            observacoes: '' },
    { id: 's-ref',  dimensao: 'Reflexão',  indicadores: 'Argumentação e análise crítica',                   observacoes: '' },
  ]
};

export const ARTE_6_9: AvaliacaoBNCC = {
  titulo: 'Avaliação de Arte',
  subtitulo: '6º ao 9º Ano do Ensino Fundamental',
  disciplina: 'Arte',
  secoes: [
    {
      id: 'artes-visuais', titulo: 'Artes Visuais', icone: '🎨',
      criterios: [
        c('ac',  'Apreciação crítica',  'Analisa obras tradicionais e contemporâneas em diferentes contextos.'),
        c('ev',  'Elementos visuais',   'Reconhece e utiliza ponto, linha, forma, cor, espaço, movimento etc.'),
        c('exp', 'Experimentação',      'Produz trabalhos variados (desenho, pintura, escultura, fotografia, performance).'),
        c('pc',  'Processo criativo',   'Desenvolve projetos individuais e coletivos com materiais convencionais e digitais.'),
      ]
    },
    {
      id: 'danca', titulo: 'Dança', icone: '💃',
      criterios: [
        c('ap',  'Apreciação',              'Reconhece e valoriza diferentes estilos e matrizes culturais da dança.'),
        c('em',  'Elementos do movimento',  'Explora tempo, peso, fluência e espaço no movimento dançado.'),
        c('ci',  'Criação e improvisação',  'Cria vocabulários próprios e composições autorais.'),
        c('rc',  'Reflexão crítica',        'Discute experiências pessoais e coletivas, problematizando estereótipos.'),
      ]
    },
    {
      id: 'musica', titulo: 'Música', icone: '🎵',
      criterios: [
        c('am',  'Apreciação musical',   'Analisa usos e funções da música em diferentes contextos sociais e culturais.'),
        c('em',  'Elementos musicais',   'Explora altura, intensidade, timbre, melodia e ritmo.'),
        c('cm',  'Criação musical',      'Produz improvisações, composições, arranjos e trilhas sonoras.'),
        c('tm',  'Tecnologias musicais', 'Utiliza registros gráficos, partituras e recursos digitais de áudio e vídeo.'),
      ]
    },
    {
      id: 'teatro', titulo: 'Teatro', icone: '🎭',
      criterios: [
        c('at',  'Apreciação teatral',       'Reconhece estilos cênicos e aprecia produções nacionais e internacionais.'),
        c('ec',  'Elementos cênicos',        'Explora figurinos, cenários, iluminação e sonoplastia.'),
        c('cc',  'Criação coletiva',         'Participa de improvisações e jogos teatrais colaborativos.'),
        c('pd',  'Personagens e dramaturgia','Cria personagens e composições cênicas com criatividade e reflexão crítica.'),
      ]
    },
    {
      id: 'integradas', titulo: 'Artes Integradas', icone: '🌐',
      criterios: [
        c('id',  'Interdisciplinaridade',  'Relaciona práticas artísticas às dimensões sociais, culturais e políticas.'),
        c('pi',  'Projetos integrados',    'Participa de produções que articulam diferentes linguagens artísticas.'),
        c('pc',  'Patrimônio cultural',    'Valoriza patrimônio material e imaterial, especialmente o brasileiro.'),
        c('td',  'Tecnologias digitais',   'Utiliza recursos digitais para criar, registrar e compartilhar produções artísticas.'),
      ]
    }
  ],
  camposAtuacao: [],
  sintese: [
    { id: 's-cri',  dimensao: 'Criação',   indicadores: 'Produção artística individual e coletiva',   observacoes: '' },
    { id: 's-crt',  dimensao: 'Crítica',   indicadores: 'Reflexão sobre manifestações culturais',     observacoes: '' },
    { id: 's-est',  dimensao: 'Estesia',   indicadores: 'Sensibilidade e percepção corporal/visual',  observacoes: '' },
    { id: 's-exp',  dimensao: 'Expressão', indicadores: 'Exteriorização de ideias e sentimentos',     observacoes: '' },
    { id: 's-fru',  dimensao: 'Fruição',   indicadores: 'Apreciação estética e prazer artístico',     observacoes: '' },
    { id: 's-ref',  dimensao: 'Reflexão',  indicadores: 'Argumentação e análise crítica',             observacoes: '' },
  ]
};

// ══════════════════════════════════════════════════════════
// EDUCAÇÃO FÍSICA
// ══════════════════════════════════════════════════════════

function secEF(id: string, titulo: string, icone: string, crit: [string, string, string][]): Secao {
  return { id, titulo, icone, criterios: crit.map(([i, n, d]) => c(i, n, d)) };
}
function sinteseEF(): SinteseItem[] {
  return [
    { id: 's-jog',  dimensao: 'Brincadeiras/Jogos', indicadores: 'Participação, criatividade, respeito às culturas', observacoes: '' },
    { id: 's-esp',  dimensao: 'Esportes',           indicadores: 'Cooperação, respeito às regras, protagonismo',     observacoes: '' },
    { id: 's-gin',  dimensao: 'Ginástica',          indicadores: 'Coordenação, segurança, limites corporais',        observacoes: '' },
    { id: 's-dan',  dimensao: 'Dança',              indicadores: 'Expressividade, respeito cultural, ritmo',         observacoes: '' },
    { id: 's-lut',  dimensao: 'Lutas',              indicadores: 'Estratégia, respeito ao oponente, segurança',      observacoes: '' },
  ];
}

export const EF_1_2: AvaliacaoBNCC = {
  titulo: 'Avaliação de Educação Física',
  subtitulo: '1º e 2º Ano do Ensino Fundamental',
  disciplina: 'Educação Física',
  secoes: [
    secEF('jogos', 'Brincadeiras e Jogos', '🎲', [
      ['bj1', 'Experimenta e recria brincadeiras', 'Experimenta e recria brincadeiras populares locais.'],
      ['bj2', 'Explica por múltiplas linguagens',  'Explica brincadeiras por múltiplas linguagens (oral, escrita, corporal).'],
      ['bj3', 'Planeja estratégias',               'Planeja estratégias para resolver desafios em jogos.'],
      ['bj4', 'Colabora na divulgação',            'Colabora na divulgação de brincadeiras na escola/comunidade.'],
    ]),
    secEF('esportes', 'Esportes', '🏅', [
      ['esp1', 'Experimenta esportes',  'Experimenta esportes de marca e precisão.'],
      ['esp2', 'Respeita normas',       'Respeita normas e regras para segurança.'],
    ]),
    secEF('ginastica', 'Ginástica', '🤸', [
      ['gin1', 'Experimenta elementos básicos', 'Experimenta elementos básicos (saltos, giros, equilíbrios).'],
      ['gin2', 'Planeja estratégias seguras',   'Planeja estratégias para execução segura.'],
      ['gin3', 'Reconhece limites',             'Reconhece limites e potencialidades do corpo.'],
    ]),
    secEF('danca', 'Dança', '💃', [
      ['dan1', 'Experimenta e recria danças', 'Experimenta e recria danças comunitárias e regionais.'],
      ['dan2', 'Identifica elementos',        'Identifica ritmo, espaço e gestos nas danças.'],
    ]),
  ],
  camposAtuacao: [],
  sintese: sinteseEF().filter(s => ['s-jog','s-esp','s-gin','s-dan'].includes(s.id))
};

export const EF_3_5: AvaliacaoBNCC = {
  titulo: 'Avaliação de Educação Física',
  subtitulo: '3º ao 5º Ano do Ensino Fundamental',
  disciplina: 'Educação Física',
  secoes: [
    secEF('jogos', 'Brincadeiras e Jogos', '🎲', [
      ['bj1', 'Experimenta jogos do mundo',   'Experimenta e recria jogos populares do Brasil e do mundo.'],
      ['bj2', 'Planeja participação segura',  'Planeja estratégias para participação segura.'],
      ['bj3', 'Explica por linguagens',       'Explica jogos por múltiplas linguagens.'],
      ['bj4', 'Valoriza patrimônio',          'Valoriza patrimônio cultural das brincadeiras.'],
    ]),
    secEF('esportes', 'Esportes', '🏅', [
      ['esp1', 'Experimenta variados esportes', 'Experimenta esportes de campo e taco, rede/parede e invasão.'],
      ['esp2', 'Diferencia jogo e esporte',     'Diferencia jogo e esporte, reconhecendo manifestações.'],
    ]),
    secEF('ginastica', 'Ginástica', '🤸', [
      ['gin1', 'Experimenta ginástica geral',       'Experimenta combinações de elementos da ginástica geral.'],
      ['gin2', 'Planeja apresentações coletivas',   'Planeja estratégias para apresentações coletivas.'],
    ]),
    secEF('danca', 'Dança', '💃', [
      ['dan1', 'Experimenta danças do mundo',   'Experimenta danças populares do Brasil e do mundo.'],
      ['dan2', 'Compara elementos',             'Compara elementos constitutivos (ritmo, espaço, gestos).'],
      ['dan3', 'Identifica preconceito',        'Identifica situações de preconceito e discute alternativas.'],
    ]),
    secEF('lutas', 'Lutas', '🥋', [
      ['lut1', 'Experimenta lutas comunitárias',   'Experimenta e recria lutas comunitárias e de matriz indígena/africana.'],
      ['lut2', 'Planeja estratégias básicas',       'Planeja estratégias básicas respeitando normas de segurança.'],
      ['lut3', 'Diferencia lutas de brigas',        'Diferencia lutas de brigas e outras práticas corporais.'],
    ]),
  ],
  camposAtuacao: [],
  sintese: sinteseEF()
};

export const EF_6_7: AvaliacaoBNCC = {
  titulo: 'Avaliação de Educação Física',
  subtitulo: '6º e 7º Ano do Ensino Fundamental',
  disciplina: 'Educação Física',
  secoes: [
    secEF('jogos', 'Brincadeiras e Jogos', '🎮', [
      ['bj1', 'Experimenta jogos eletrônicos',      'Experimenta e respeita diferentes jogos eletrônicos.'],
      ['bj2', 'Identifica transformações dos jogos', 'Identifica transformações dos jogos eletrônicos com base nas tecnologias.'],
    ]),
    secEF('esportes', 'Esportes', '🏅', [
      ['esp1', 'Experimenta diversas modalidades',  'Experimenta esportes de marca, precisão, invasão e técnico-combinatórios.'],
      ['esp2', 'Pratica com respeito às regras',    'Pratica esportes respeitando regras e habilidades básicas.'],
      ['esp3', 'Planeja estratégias',               'Planeja estratégias para desafios técnico-táticos.'],
      ['esp4', 'Analisa transformações históricas',  'Analisa transformações históricas e sociais dos esportes.'],
    ]),
    secEF('ginastica', 'Ginástica', '🤸', [
      ['gin1', 'Experimenta exercícios físicos', 'Experimenta exercícios físicos variados (força, resistência, flexibilidade).'],
      ['gin2', 'Diferencia exercício e atividade', 'Diferencia exercício físico de atividade física.'],
    ]),
    secEF('danca', 'Danças', '💃', [
      ['dan1', 'Experimenta danças urbanas',  'Experimenta e recria danças urbanas.'],
      ['dan2', 'Planeja aprendizagem',        'Planeja estratégias para aprender elementos das danças urbanas.'],
      ['dan3', 'Diferencia danças urbanas',   'Diferencia danças urbanas de outras manifestações.'],
    ]),
    secEF('lutas', 'Lutas', '🥋', [
      ['lut1', 'Experimenta lutas do Brasil',     'Experimenta e recria lutas do Brasil.'],
      ['lut2', 'Planeja estratégias seguras',      'Planeja estratégias básicas respeitando segurança.'],
      ['lut3', 'Identifica elementos táticos',     'Identifica códigos, rituais e elementos técnico-táticos das lutas.'],
    ]),
    secEF('aventura', 'Práticas de Aventura', '🧗', [
      ['av1', 'Experimenta práticas urbanas',    'Experimenta práticas urbanas com segurança.'],
      ['av2', 'Identifica riscos',               'Identifica riscos e planeja estratégias de superação.'],
      ['av3', 'Respeita patrimônio público',     'Respeita patrimônio público e recria práticas corporais urbanas.'],
    ]),
  ],
  camposAtuacao: [],
  sintese: [
    ...sinteseEF(),
    { id: 's-aven', dimensao: 'Práticas de Aventura', indicadores: 'Segurança, respeito ao ambiente, autonomia', observacoes: '' },
  ]
};

export const EF_8_9: AvaliacaoBNCC = {
  titulo: 'Avaliação de Educação Física',
  subtitulo: '8º e 9º Ano do Ensino Fundamental',
  disciplina: 'Educação Física',
  secoes: [
    secEF('esportes', 'Esportes', '🏅', [
      ['esp1', 'Experimenta diferentes papéis',         'Experimenta diferentes papéis (jogador, árbitro, técnico).'],
      ['esp2', 'Pratica diversas modalidades',          'Pratica esportes de rede/parede, campo e taco, invasão e combate.'],
      ['esp3', 'Formula estratégias',                   'Formula estratégias técnico-táticas.'],
      ['esp4', 'Identifica sistemas de jogo',           'Identifica sistemas de jogo e regras.'],
      ['esp5', 'Analisa problemas do esporte',          'Analisa problemas do esporte (doping, violência, corrupção).'],
    ]),
    secEF('ginastica', 'Ginástica', '🤸', [
      ['gin1', 'Experimenta condicionamento',   'Experimenta programas de condicionamento físico e conscientização corporal.'],
      ['gin2', 'Discute padrões de saúde',      'Discute padrões de saúde, beleza e desempenho.'],
      ['gin3', 'Diferencia tipos de ginástica', 'Diferencia ginástica de condicionamento e conscientização corporal.'],
    ]),
    secEF('danca', 'Danças', '💃', [
      ['dan1', 'Experimenta danças de salão',     'Experimenta e recria danças de salão.'],
      ['dan2', 'Planeja aprendizagem',            'Planeja estratégias para aprender elementos das danças.'],
      ['dan3', 'Analisa transformações culturais', 'Analisa transformações históricas e culturais das danças.'],
    ]),
    secEF('lutas', 'Lutas', '🥋', [
      ['lut1', 'Experimenta lutas do mundo',  'Experimenta lutas do mundo com segurança.'],
      ['lut2', 'Planeja táticas',             'Planeja estratégias técnico-táticas.'],
      ['lut3', 'Analisa esportivização',      'Analisa esportivização e midiatização das lutas.'],
    ]),
    secEF('aventura', 'Práticas de Aventura na Natureza', '🧗', [
      ['av1', 'Experimenta práticas na natureza', 'Experimenta práticas na natureza com segurança.'],
      ['av2', 'Respeita o ambiente natural',      'Identifica riscos e respeita o ambiente natural.'],
    ]),
  ],
  camposAtuacao: [],
  sintese: [
    { id: 's-esp',  dimensao: 'Esportes',           indicadores: 'Cooperação, protagonismo, análise crítica',        observacoes: '' },
    { id: 's-gin',  dimensao: 'Ginástica',          indicadores: 'Condicionamento físico, consciência corporal',      observacoes: '' },
    { id: 's-dan',  dimensao: 'Danças',             indicadores: 'Expressividade, respeito cultural, ritmo',          observacoes: '' },
    { id: 's-lut',  dimensao: 'Lutas',              indicadores: 'Estratégia, segurança, respeito ao oponente',       observacoes: '' },
    { id: 's-aven', dimensao: 'Práticas de Aventura', indicadores: 'Segurança, respeito ao ambiente, autonomia',     observacoes: '' },
  ]
};

// ══════════════════════════════════════════════════════════
// MAPEAMENTO: disciplina + série → formulário BNCC
// ══════════════════════════════════════════════════════════

export function getAvaliacaoBNCC(disciplina: string, serie: string): AvaliacaoBNCC | null {
  const disc = disciplina.toLowerCase();
  const ano = extrairAno(serie);

  if (disc.includes('português') || disc.includes('lingua port') || disc.includes('língua port')) {
    if (ano <= 2) return deepClone(LP_1_2);
    if (ano <= 5) return deepClone(LP_3_5);
    return deepClone(LP_6_9);
  }
  if (disc.includes('arte')) {
    return ano <= 5 ? deepClone(ARTE_1_5) : deepClone(ARTE_6_9);
  }
  if (disc.includes('educa') && disc.includes('física') || disc.includes('educacao fisica') || disc.includes('educação física')) {
    if (ano <= 2) return deepClone(EF_1_2);
    if (ano <= 5) return deepClone(EF_3_5);
    if (ano <= 7) return deepClone(EF_6_7);
    return deepClone(EF_8_9);
  }
  return null;
}

function extrairAno(serie: string): number {
  const m = serie.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
