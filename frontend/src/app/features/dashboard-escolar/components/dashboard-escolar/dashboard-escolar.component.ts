import { Component, OnInit } from '@angular/core';

interface Indice {
  titulo: string;
  valor: number;
  descricao: string;
  cor: 'verde' | 'azul' | 'amarelo' | 'vermelho';
  respondentes: number;
}

@Component({
  selector: 'app-dashboard-escolar',
  templateUrl: './dashboard-escolar.component.html',
  styleUrls: ['./dashboard-escolar.component.scss']
})
export class DashboardEscolarComponent implements OnInit {
  periodo: string = 'atual'; // 'atual', 'trimestre', 'semestre', 'ano'

  // Índices de satisfação
  indices: Indice[] = [];

  // Dados demográficos
  respondentes: any = {
    total: 0,
    educadores: 0,
    educandos: 0,
    tutores: 0,
    administrativo: 0
  };

  // Detalhes por categoria
  detalhesCategorias: any[] = [];

  constructor() {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregarIndices();
    this.carregarRespondentes();
    this.carregarDetalhes();
  }

  carregarIndices(): void {
    this.indices = [
      {
        titulo: 'Satisfação Geral',
        valor: 87,
        descricao: 'Nível geral de satisfação com a instituição',
        cor: 'verde',
        respondentes: 342
      },
      {
        titulo: 'Condições de Trabalho',
        valor: 78,
        descricao: 'Qualidade do ambiente e recursos de trabalho',
        cor: 'azul',
        respondentes: 156
      },
      {
        titulo: 'Participação dos Educandos',
        valor: 82,
        descricao: 'Engajamento e participação nas atividades',
        cor: 'azul',
        respondentes: 342
      },
      {
        titulo: 'Infraestrutura',
        valor: 75,
        descricao: 'Adequação das instalações e equipamentos',
        cor: 'amarelo',
        respondentes: 342
      },
      {
        titulo: 'Clima Socioemocional',
        valor: 84,
        descricao: 'Relacionamento e ambiente escolar',
        cor: 'verde',
        respondentes: 342
      },
      {
        titulo: 'Autonomia',
        valor: 79,
        descricao: 'Liberdade para decisões e iniciativas',
        cor: 'azul',
        respondentes: 156
      },
      {
        titulo: 'Gestão Escolar',
        valor: 81,
        descricao: 'Efetividade da administração e liderança',
        cor: 'azul',
        respondentes: 498
      },
      {
        titulo: 'Qualidade de Ensino',
        valor: 86,
        descricao: 'Qualidade das aulas e conteúdos',
        cor: 'verde',
        respondentes: 342
      }
    ];
  }

  carregarRespondentes(): void {
    this.respondentes = {
      total: 498,
      educadores: 156,
      educandos: 210,
      tutores: 98,
      administrativo: 34
    };
  }

  carregarDetalhes(): void {
    this.detalhesCategorias = [
      {
        categoria: 'Condições de Trabalho',
        subcategorias: [
          { nome: 'Remuneração Adequada', valor: 72 },
          { nome: 'Reconhecimento Profissional', valor: 78 },
          { nome: 'Desenvolvimento Profissional', valor: 82 },
          { nome: 'Segurança e Bem-estar', valor: 79 }
        ]
      },
      {
        categoria: 'Infraestrutura',
        subcategorias: [
          { nome: 'Salas de Aula', valor: 73 },
          { nome: 'Laboratórios e Recursos', valor: 76 },
          { nome: 'Segurança', valor: 81 },
          { nome: 'Limpeza e Higiene', valor: 74 }
        ]
      },
      {
        categoria: 'Clima Socioemocional',
        subcategorias: [
          { nome: 'Respeito e Inclusão', valor: 88 },
          { nome: 'Comunicação', valor: 84 },
          { nome: 'Colaboração', valor: 82 },
          { nome: 'Resolução de Conflitos', valor: 78 }
        ]
      }
    ];
  }

  mudarPeriodo(novoPeriodo: string): void {
    this.periodo = novoPeriodo;
    this.carregarDados();
  }

  obterCor(valor: number): string {
    if (valor >= 85) return 'verde';
    if (valor >= 75) return 'azul';
    if (valor >= 60) return 'amarelo';
    return 'vermelho';
  }

  obterTextoIntensidade(valor: number): string {
    if (valor >= 85) return 'Excelente';
    if (valor >= 75) return 'Bom';
    if (valor >= 60) return 'Regular';
    return 'Precisa Melhorar';
  }

  visualizarDetalhes(indice: Indice): void {
    console.log('Visualizando detalhes:', indice.titulo);
    // Implementar modal ou navegação para detalhes
  }
}
