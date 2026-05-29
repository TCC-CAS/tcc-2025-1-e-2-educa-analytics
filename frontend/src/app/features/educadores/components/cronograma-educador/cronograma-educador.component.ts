import { Component, OnInit } from '@angular/core';

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

// Colors por turma (not discipline) so educator sees which class they're in
const TURMA_CORES = [
  { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' },
  { bg: '#fef9c3', text: '#a16207', border: '#fde047' },
  { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
  { bg: '#cffafe', text: '#0e7490', border: '#67e8f9' },
];

function tc(i: number) { return { corBg: TURMA_CORES[i].bg, corText: TURMA_CORES[i].text, corBorder: TURMA_CORES[i].border }; }

// Mock: Prof. Ana Silva teaches Matemática in 3 classes + Física in 1 class
function buildMockSlotsEducador(educadorId: string): AulaSlot[] {
  return [
    // Turma 1A — Matemática (azul)
    { id: 'p1', turmaId: 't1', turmaCodigo: '1A', turmaSerie: '1º Ano',  disciplinaId: 'mat', disciplina: 'Matemática', sala: 'Sala 101', diaSemana: 'segunda', horaInicio: '07:00', horaFim: '08:00', ...tc(0) },
    { id: 'p2', turmaId: 't1', turmaCodigo: '1A', turmaSerie: '1º Ano',  disciplinaId: 'mat', disciplina: 'Matemática', sala: 'Sala 101', diaSemana: 'terca',   horaInicio: '08:00', horaFim: '09:00', ...tc(0) },
    { id: 'p3', turmaId: 't1', turmaCodigo: '1A', turmaSerie: '1º Ano',  disciplinaId: 'mat', disciplina: 'Matemática', sala: 'Sala 101', diaSemana: 'quarta',  horaInicio: '09:00', horaFim: '10:00', ...tc(0) },
    { id: 'p4', turmaId: 't1', turmaCodigo: '1A', turmaSerie: '1º Ano',  disciplinaId: 'mat', disciplina: 'Matemática', sala: 'Sala 101', diaSemana: 'quinta',  horaInicio: '09:00', horaFim: '10:00', ...tc(0) },
    { id: 'p5', turmaId: 't1', turmaCodigo: '1A', turmaSerie: '1º Ano',  disciplinaId: 'fis', disciplina: 'Física',     sala: 'Lab. Ciências', diaSemana: 'sexta', horaInicio: '07:00', horaFim: '08:00', ...tc(0) },
    // Turma 2B — Matemática (verde)
    { id: 'p6', turmaId: 't2', turmaCodigo: '2B', turmaSerie: '2º Ano',  disciplinaId: 'mat', disciplina: 'Matemática', sala: 'Sala 202', diaSemana: 'segunda', horaInicio: '13:00', horaFim: '14:00', ...tc(1) },
    { id: 'p7', turmaId: 't2', turmaCodigo: '2B', turmaSerie: '2º Ano',  disciplinaId: 'mat', disciplina: 'Matemática', sala: 'Sala 202', diaSemana: 'terca',   horaInicio: '14:00', horaFim: '15:00', ...tc(1) },
    { id: 'p8', turmaId: 't2', turmaCodigo: '2B', turmaSerie: '2º Ano',  disciplinaId: 'mat', disciplina: 'Matemática', sala: 'Sala 202', diaSemana: 'quarta',  horaInicio: '13:00', horaFim: '14:00', ...tc(1) },
    { id: 'p9', turmaId: 't2', turmaCodigo: '2B', turmaSerie: '2º Ano',  disciplinaId: 'mat', disciplina: 'Matemática', sala: 'Sala 202', diaSemana: 'sexta',   horaInicio: '15:00', horaFim: '16:00', ...tc(1) },
    // Turma 3A — Matemática (roxo)
    { id: 'p10',turmaId: 't5', turmaCodigo: '3A', turmaSerie: '1ª EM',   disciplinaId: 'mat', disciplina: 'Matemática', sala: 'Sala 301', diaSemana: 'terca',   horaInicio: '19:00', horaFim: '20:00', ...tc(2) },
    { id: 'p11',turmaId: 't5', turmaCodigo: '3A', turmaSerie: '1ª EM',   disciplinaId: 'mat', disciplina: 'Matemática', sala: 'Sala 301', diaSemana: 'quinta',  horaInicio: '19:00', horaFim: '20:00', ...tc(2) },
    { id: 'p12',turmaId: 't5', turmaCodigo: '3A', turmaSerie: '1ª EM',   disciplinaId: 'geo', disciplina: 'Geometria',  sala: 'Sala 301', diaSemana: 'sexta',   horaInicio: '19:00', horaFim: '20:00', ...tc(2) },
  ];
}

@Component({
  selector: 'app-cronograma-educador',
  templateUrl: './cronograma-educador.component.html',
  styleUrls: ['./cronograma-educador.component.scss']
})
export class CronogramaEducadorComponent implements OnInit {

  readonly educador = { id: 'e1', nome: 'Prof. Ana Silva' };

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

  ngOnInit(): void {
    for (let h = 7; h <= 22; h++) {
      this.horas.push(`${h.toString().padStart(2, '0')}:00`);
    }

    // Load from localStorage filtering by educator, fall back to mock
    try {
      const stored = localStorage.getItem('cronograma_slots_v2');
      if (stored) {
        const all: any[] = JSON.parse(stored);
        const filtered = all.filter(s => s.educadorId === this.educador.id);
        if (filtered.length > 0) {
          this.slots = filtered.map((s: any) => ({
            ...s,
            turmaCodigo: s.turma ?? s.turmaCodigo ?? s.turmaId,
            turmaSerie:  s.turmaSerie ?? '',
          }));
        }
      }
    } catch {}

    if (this.slots.length === 0) {
      this.slots = buildMockSlotsEducador(this.educador.id);
    }

    const diasMap: Record<number, DiaSemana> = { 1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta' };
    this.hojeKey = diasMap[new Date().getDay()] ?? null;
  }

  get slotsFiltrados(): AulaSlot[] {
    return this.slots.filter(s =>
      (!this.filtroTurmaId      || s.turmaId       === this.filtroTurmaId) &&
      (!this.filtroDisciplinaId || s.disciplinaId  === this.filtroDisciplinaId)
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
