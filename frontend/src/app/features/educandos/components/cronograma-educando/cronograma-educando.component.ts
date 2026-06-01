import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/services/auth.service';

type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta';

interface AulaSlot {
  id: string;
  disciplinaId: string;
  disciplina: string;
  educador: string;
  sala: string;
  diaSemana: DiaSemana;
  horaInicio: string; // "07:00"
  horaFim: string;    // "08:00"
  corBg: string;
  corText: string;
  corBorder: string;
}

const CORES = [
  { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  { bg: '#fef9c3', text: '#a16207', border: '#fde047' },
  { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' },
  { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
  { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
  { bg: '#cffafe', text: '#0e7490', border: '#67e8f9' },
  { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
];

/** "7:00:00" ou "07:00:00" → "07:00" */
function normHora(h: string): string {
  if (!h) return '';
  const p = String(h).split(':');
  return p[0].padStart(2, '0') + ':' + (p[1] || '00');
}

@Component({
  selector: 'app-cronograma-educando',
  templateUrl: './cronograma-educando.component.html',
  styleUrls: ['./cronograma-educando.component.scss']
})
export class CronogramaEducandoComponent implements OnInit {

  educando = { id: '', nome: '' };
  turma: { idTurma: number; codTurma: string; nomeTurma: string; periodo: string; anoLetivo: string } | null = null;

  dias: { key: DiaSemana; label: string; abrev: string }[] = [
    { key: 'segunda', label: 'Segunda-feira', abrev: 'Seg' },
    { key: 'terca',   label: 'Terça-feira',   abrev: 'Ter' },
    { key: 'quarta',  label: 'Quarta-feira',  abrev: 'Qua' },
    { key: 'quinta',  label: 'Quinta-feira',  abrev: 'Qui' },
    { key: 'sexta',   label: 'Sexta-feira',   abrev: 'Sex' },
  ];

  horas: string[] = [];
  slots: AulaSlot[] = [];
  hojeKey: DiaSemana | null = null;

  carregando = false;
  erro = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    for (let h = 6; h <= 23; h++) {
      this.horas.push(`${h.toString().padStart(2, '0')}:00`);
    }

    const diasMap: Record<number, DiaSemana> = {
      1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta'
    };
    this.hojeKey = diasMap[new Date().getDay()] ?? null;

    // ID pode vir do parâmetro de rota (:id/cronograma) ou do usuário logado
    const idRota = this.route.snapshot.paramMap.get('id');
    const user   = this.authService.getCurrentUser();
    const idMatricula = idRota || user?.id || null;

    if (idMatricula) {
      this.educando = { id: idMatricula, nome: user?.nome || '' };
      this.carregarCronograma(idMatricula);
    } else {
      this.erro = 'Usuário não identificado.';
    }
  }

  carregarCronograma(idMatricula: string): void {
    this.carregando = true;
    this.erro = '';

    this.http.get<any>(`${environment.apiUrl}/cronograma/educando/${idMatricula}`)
      .subscribe({
        next: (res) => {
          this.turma  = res.turma  || null;
          const lista: any[] = res.horarios || [];
          this.slots  = this.mapearSlots(lista);
          this.carregando = false;
        },
        error: () => {
          this.erro = 'Não foi possível carregar o cronograma.';
          this.carregando = false;
        }
      });
  }

  private mapearSlots(lista: any[]): AulaSlot[] {
    // Cor por disciplina (consistente)
    const discCorMap = new Map<string, number>();
    let idx = 0;

    return lista
      .filter(r => r.status !== 'cancelada' && r.status !== 'suspensa')
      .map(r => {
        const discId = String(r.idDisciplina);
        if (!discCorMap.has(discId)) {
          discCorMap.set(discId, idx % CORES.length);
          idx++;
        }
        const cor = CORES[discCorMap.get(discId)!];

        return {
          id:          String(r.idCronograma ?? r.id ?? Math.random()),
          disciplinaId: discId,
          disciplina:  r.nomeDisciplina || r.codDisciplina || '—',
          educador:    r.educadorNome   || '',
          sala:        r.nomeSala       || '',
          diaSemana:   r.diaSemana as DiaSemana,
          horaInicio:  normHora(r.horaInicio),
          horaFim:     normHora(r.horaFim),
          corBg:       cor.bg,
          corText:     cor.text,
          corBorder:   cor.border,
        } as AulaSlot;
      });
  }

  // ── Período / horas visíveis ──────────────────────────────────────────────

  get periodoLabel(): string {
    if (!this.turma?.periodo) return '';
    const p = this.turma.periodo.toLowerCase();
    if (p.includes('matut') || p === 'm') return 'Manhã';
    if (p.includes('vespert') || p.includes('tarde') || p === 'v' || p === 't') return 'Tarde';
    if (p.includes('notur') || p.includes('noite') || p === 'n') return 'Noite';
    if (p.includes('integral') || p === 'i') return 'Integral';
    return this.turma.periodo;
  }

  get horasFiltradas(): string[] {
    if (this.slots.length > 0) {
      const horasComAula = new Set(this.slots.map(s => parseInt(s.horaInicio)));
      const min = Math.max(Math.min(...horasComAula) - 1, 6);
      const max = Math.min(Math.max(...horasComAula) + 2, 23);
      return this.horas.filter(h => { const v = parseInt(h); return v >= min && v <= max; });
    }
    const p = (this.turma?.periodo || '').toLowerCase();
    if (p.includes('vespert') || p.includes('tarde') || p === 'v' || p === 't')
      return this.horas.filter(h => parseInt(h) >= 12 && parseInt(h) <= 18);
    if (p.includes('notur') || p.includes('noite') || p === 'n')
      return this.horas.filter(h => parseInt(h) >= 18);
    return this.horas.filter(h => parseInt(h) >= 7 && parseInt(h) <= 12);
  }

  // ── Derivados ────────────────────────────────────────────────────────────

  get totalAulas(): number { return this.slots.length; }

  get disciplinasCount(): number {
    return new Set(this.slots.map(s => s.disciplinaId)).size;
  }

  get legenda(): { disciplinaId: string; disciplina: string; corBg: string; corBorder: string }[] {
    const seen = new Set<string>();
    return this.slots.filter(s => {
      if (seen.has(s.disciplinaId)) return false;
      seen.add(s.disciplinaId);
      return true;
    }).map(s => ({ disciplinaId: s.disciplinaId, disciplina: s.disciplina, corBg: s.corBg, corBorder: s.corBorder }));
  }

  getSlot(dia: DiaSemana, hora: string): AulaSlot | undefined {
    return this.slots.find(s => s.diaSemana === dia && s.horaInicio === hora);
  }

  isHoje(dia: DiaSemana): boolean { return dia === this.hojeKey; }

  trackByHora(_: number, h: string) { return h; }
  trackByDia(_: number, d: { key: string }) { return d.key; }
}
