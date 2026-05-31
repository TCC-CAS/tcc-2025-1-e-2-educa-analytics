import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/services/auth.service';

type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta';

interface AulaSlot {
  id: string;
  turmaId: string;
  turmaCodigo: string;
  turmaSerie: string;
  disciplinaId: string;
  disciplina: string;
  sala: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  corBg: string;
  corText: string;
  corBorder: string;
}

const TURMA_CORES = [
  { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' },
  { bg: '#fef9c3', text: '#a16207', border: '#fde047' },
  { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
  { bg: '#cffafe', text: '#0e7490', border: '#67e8f9' },
];

/** Normaliza "7:00:00" ou "07:00:00" → "07:00" */
function normHora(h: string): string {
  if (!h) return '';
  const parts = h.split(':');
  return parts[0].padStart(2, '0') + ':' + parts[1];
}

@Component({
  selector: 'app-cronograma-educador',
  templateUrl: './cronograma-educador.component.html',
  styleUrls: ['./cronograma-educador.component.scss']
})
export class CronogramaEducadorComponent implements OnInit {

  educador = { id: '', nome: '' };

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
  filtroTurmaId: string = '';
  filtroDisciplinaId: string = '';

  carregando = false;
  erro = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    for (let h = 7; h <= 22; h++) {
      this.horas.push(`${h.toString().padStart(2, '0')}:00`);
    }

    const diasMap: Record<number, DiaSemana> = {
      1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta'
    };
    this.hojeKey = diasMap[new Date().getDay()] ?? null;

    // Prioridade 1: ID vindo do parâmetro de rota (:id/cronograma)
    // Prioridade 2: usuário logado no AuthService
    const idRota = this.route.snapshot.paramMap.get('id');
    const user   = this.authService.getCurrentUser();

    const idEducador = idRota || user?.id || null;
    const nome       = user?.nome || '';

    if (idEducador) {
      this.educador = { id: idEducador, nome };
      // Se o nome ainda não está disponível, busca o nome do educador na API
      if (!nome) {
        this.http.get<any>(`${environment.apiUrl}/educadores/${idEducador}`)
          .subscribe({ next: r => this.educador.nome = r?.nomeCompleto || r?.nome || idEducador });
      }
      this.carregarCronograma(idEducador);
    } else {
      this.erro = 'Usuário não autenticado.';
    }
  }

  carregarCronograma(idEducador: string): void {
    this.carregando = true;
    this.erro = '';

    this.http.get<any>(`${environment.apiUrl}/cronograma/educador/${idEducador}`)
      .subscribe({
        next: (res) => {
          const lista: any[] = res?.data || (Array.isArray(res) ? res : []);
          this.slots = this.mapearSlots(lista);
          this.carregando = false;
        },
        error: () => {
          this.erro = 'Não foi possível carregar o cronograma.';
          this.carregando = false;
        }
      });
  }

  private mapearSlots(lista: any[]): AulaSlot[] {
    // Mapeia turmaId → índice de cor (consistente)
    const turmaCorMap = new Map<string, number>();
    let corIdx = 0;

    return lista
      .filter(r => r.status !== 'cancelada' && r.status !== 'suspensa')
      .map(r => {
        const turmaId = String(r.idTurma);
        if (!turmaCorMap.has(turmaId)) {
          turmaCorMap.set(turmaId, corIdx % TURMA_CORES.length);
          corIdx++;
        }
        const cor = TURMA_CORES[turmaCorMap.get(turmaId)!];

        // nomeTurma pode ser "1A - Primeiro Ano A" → série = parte após " - "
        const nomeTurma: string = r.nomeTurma || '';
        const turmaSerie = nomeTurma.includes(' - ')
          ? nomeTurma.split(' - ').slice(1).join(' - ')
          : nomeTurma;

        return {
          id:           String(r.idCronograma ?? r.id ?? Math.random()),
          turmaId,
          turmaCodigo:  r.codTurma || turmaId,
          turmaSerie,
          disciplinaId: String(r.idDisciplina),
          disciplina:   r.nomeDisciplina || r.codDisciplina || '—',
          sala:         r.nomeSala || '',
          diaSemana:    r.diaSemana as DiaSemana,
          horaInicio:   normHora(r.horaInicio),
          horaFim:      normHora(r.horaFim),
          corBg:        cor.bg,
          corText:      cor.text,
          corBorder:    cor.border,
        } as AulaSlot;
      });
  }

  get slotsFiltrados(): AulaSlot[] {
    return this.slots.filter(s =>
      (!this.filtroTurmaId      || s.turmaId      === this.filtroTurmaId) &&
      (!this.filtroDisciplinaId || s.disciplinaId === this.filtroDisciplinaId)
    );
  }

  get turmas(): { id: string; codigo: string; serie: string; cor: { bg: string; text: string; border: string } }[] {
    const seen = new Set<string>();
    return this.slots
      .filter(s => { if (seen.has(s.turmaId)) return false; seen.add(s.turmaId); return true; })
      .map(s => ({ id: s.turmaId, codigo: s.turmaCodigo, serie: s.turmaSerie, cor: { bg: s.corBg, text: s.corText, border: s.corBorder } }));
  }

  get disciplinas(): { id: string; nome: string }[] {
    const seen = new Set<string>();
    return this.slots
      .filter(s => { if (seen.has(s.disciplinaId)) return false; seen.add(s.disciplinaId); return true; })
      .map(s => ({ id: s.disciplinaId, nome: s.disciplina }));
  }

  get horasFiltradas(): string[] {
    const sf = this.slotsFiltrados;
    if (sf.length === 0) return this.horas.filter(h => parseInt(h) >= 7 && parseInt(h) <= 12);
    const horasComAula = new Set(sf.map(s => parseInt(s.horaInicio)));
    const min = Math.min(...horasComAula) - 1;
    const max = Math.max(...horasComAula) + 2;
    return this.horas.filter(h => { const v = parseInt(h); return v >= Math.max(min, 7) && v <= Math.min(max, 22); });
  }

  get totalAulas(): number { return this.slotsFiltrados.length; }
  get turmasCount(): number { return new Set(this.slotsFiltrados.map(s => s.turmaId)).size; }
  get horasSemanais(): number { return this.slotsFiltrados.length; }

  getSlots(dia: DiaSemana, hora: string): AulaSlot[] {
    return this.slotsFiltrados.filter(s => s.diaSemana === dia && s.horaInicio === hora);
  }

  isHoje(dia: DiaSemana): boolean { return dia === this.hojeKey; }

  limparFiltros(): void { this.filtroTurmaId = ''; this.filtroDisciplinaId = ''; }

  trackByHora(_: number, h: string) { return h; }
  trackByDia(_: number, d: { key: string }) { return d.key; }
  trackBySlot(_: number, s: AulaSlot) { return s.id; }
}
