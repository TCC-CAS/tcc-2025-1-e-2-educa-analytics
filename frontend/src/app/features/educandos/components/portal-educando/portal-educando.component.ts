import { Component } from '@angular/core';

// ── Interfaces ────────────────────────────────────────────────────

interface DisciplinaFreq {
  total: number;
  presentes: number;
  ausentes: number;
  justificados: number;
  pct: number;
}

interface NotaAtividade {
  id: number;
  nome: string;
  tipo: 'Prova' | 'Trabalho' | 'Apresentação';
  data: string;
  notaMaxima: number;
  nota: number | null;
  mediaTurma: number | null;
}

interface DisciplinaPortal {
  nome: string;
  area: string;
  aulasSemanais: number;
  frequencia: DisciplinaFreq;
  atividades: NotaAtividade[];
}

interface TurmaPortal {
  codigo: string;
  nome: string;
  serie: string;
  turno: string;
  anoLetivo: string;
}

interface EducandoLogado {
  id: number;
  nome: string;
  status: 'Ativa' | 'Trancada' | 'Cancelada';
  turma: TurmaPortal;
  disciplinas: DisciplinaPortal[];
}

@Component({
  selector: 'app-portal-educando',
  templateUrl: './portal-educando.component.html',
  styleUrls: ['./portal-educando.component.scss']
})
export class PortalEducandoComponent {

  // Mock do educando logado — substituir por chamada ao backend com o token do usuário
  readonly educando: EducandoLogado = {
    id: 1,
    nome: 'Ana Paula Ferreira',
    status: 'Ativa',
    turma: {
      codigo: '1A',
      nome: '1A — Primeiro Ano A',
      serie: '1º Ano',
      turno: 'Manhã',
      anoLetivo: '2026'
    },
    disciplinas: [
      {
        nome: 'Matemática',
        area: 'Ciências Exatas',
        aulasSemanais: 5,
        frequencia: {
          total: 20,
          presentes: 17,
          ausentes: 2,
          justificados: 1,
          pct: 90
        },
        atividades: [
          {
            id: 1,
            nome: 'Prova 1 — Álgebra',
            tipo: 'Prova',
            data: '2026-03-15',
            notaMaxima: 10,
            nota: 8.5,
            mediaTurma: 7.8
          },
          {
            id: 2,
            nome: 'Trabalho em Grupo',
            tipo: 'Trabalho',
            data: '2026-03-20',
            notaMaxima: 10,
            nota: 9.0,
            mediaTurma: 8.2
          }
        ]
      },
      {
        nome: 'Física',
        area: 'Ciências da Natureza',
        aulasSemanais: 3,
        frequencia: {
          total: 12,
          presentes: 11,
          ausentes: 1,
          justificados: 0,
          pct: 92
        },
        atividades: [
          {
            id: 3,
            nome: 'Prova 1 — Mecânica',
            tipo: 'Prova',
            data: '2026-03-22',
            notaMaxima: 10,
            nota: 7.0,
            mediaTurma: 6.5
          }
        ]
      },
      {
        nome: 'Língua Portuguesa',
        area: 'Linguagens',
        aulasSemanais: 4,
        frequencia: {
          total: 16,
          presentes: 10,
          ausentes: 6,
          justificados: 0,
          pct: 63
        },
        atividades: [
          {
            id: 4,
            nome: 'Apresentação — Conto Literário',
            tipo: 'Apresentação',
            data: '2026-03-18',
            notaMaxima: 10,
            nota: null,
            mediaTurma: null
          }
        ]
      }
    ]
  };

  // Aba da disciplina expandida
  discExpandida: string | null = null;

  toggleDisc(nome: string): void {
    this.discExpandida = this.discExpandida === nome ? null : nome;
  }

  mediaDisc(disc: DisciplinaPortal): string {
    const notas = disc.atividades
      .map(a => a.nota)
      .filter((n): n is number => n !== null);
    if (!notas.length) return '—';
    return (notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1);
  }

  notaFormatada(nota: number | null): string {
    return nota !== null ? String(nota) : '—';
  }

  mediaFormatada(media: number | null): string {
    return media !== null ? media.toFixed(1) : '—';
  }

  pctClass(pct: number): string {
    if (pct >= 75) return 'ok';
    if (pct >= 50) return 'warn';
    return 'danger';
  }
}
