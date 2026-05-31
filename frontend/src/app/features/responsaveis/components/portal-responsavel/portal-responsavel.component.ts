import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/services/auth.service';

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
  tipo: string;
  data: string;
  notaMaxima: number;
  nota: number | null;
  mediaTurma: number | null;
}

interface DisciplinaPortal {
  idDisciplina: number;
  nome: string;
  area: string;
  frequencia: DisciplinaFreq;
  atividades: NotaAtividade[];
}

interface TurmaPortal {
  idTurma: number;
  codigo: string;
  nome: string;
  serie: string;
  turno: string;
  anoLetivo: string;
}

interface EducandoResumo {
  idMatricula: string;
  nome: string;
  status: string;
  turma: TurmaPortal;
  disciplinas: DisciplinaPortal[];
}

@Component({
  selector: 'app-portal-responsavel',
  templateUrl: './portal-responsavel.component.html',
  styleUrls: ['./portal-responsavel.component.scss']
})
export class PortalResponsavelComponent implements OnInit {

  educandos: EducandoResumo[] = [];
  educandoSelecionado: EducandoResumo | null = null;
  discExpandida: string | null = null;

  carregando = false;
  erro = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idRota = this.route.snapshot.paramMap.get('id');
    const user = this.authService.getCurrentUser();
    const idResponsavel = idRota || user?.id || null;

    if (idResponsavel) {
      this.carregarPortal(idResponsavel);
    } else {
      this.erro = 'Usuário não identificado. Faça login novamente.';
    }
  }

  carregarPortal(idResponsavel: string): void {
    this.carregando = true;
    this.erro = '';

    this.http.get<any>(`${environment.apiUrl}/portal-responsavel/${idResponsavel}`)
      .subscribe({
        next: (res) => {
          this.educandos = res.educandos || [];
          if (this.educandos.length > 0) {
            this.educandoSelecionado = this.educandos[0];
          }
          this.carregando = false;
        },
        error: () => {
          this.erro = 'Não foi possível carregar as informações.';
          this.carregando = false;
        }
      });
  }

  selecionarEducando(edu: EducandoResumo): void {
    this.educandoSelecionado = edu;
    this.discExpandida = null;
  }

  toggleDisc(id: number): void {
    const key = String(id);
    this.discExpandida = this.discExpandida === key ? null : key;
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

  temAlertaFrequencia(edu: EducandoResumo): boolean {
    return edu.disciplinas.some(d => d.frequencia.pct < 75);
  }

  tipoClass(tipo: string): string {
    const t = (tipo || '').toLowerCase();
    if (t.includes('prova')) return 'prova';
    if (t.includes('trabalho')) return 'trabalho';
    if (t.includes('apresenta')) return 'apresentacao';
    return 'outro';
  }
}
