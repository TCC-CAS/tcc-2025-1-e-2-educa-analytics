import { Component, OnInit } from '@angular/core';

type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta';

interface AulaSlot {
  id: string;
  turmaId: string;
  disciplinaId: string;
  disciplina: string;
  educador: string;
  sala: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
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

function c(i: number) { return { corBg: CORES[i].bg, corText: CORES[i].text, corBorder: CORES[i].border }; }

function buildMockSlots(turmaId: string): AulaSlot[] {
  return [
    { id: 'e1', turmaId, disciplinaId: 'mat', disciplina: 'Matemática',   educador: 'Prof. Ana Silva',      sala: 'Sala 101',       diaSemana: 'segunda', horaInicio: '07:00', horaFim: '08:00', ...c(0) },
    { id: 'e2', turmaId, disciplinaId: 'por', disciplina: 'Português',     educador: 'Prof. Carlos Souza',   sala: 'Sala 101',       diaSemana: 'segunda', horaInicio: '08:00', horaFim: '09:00', ...c(1) },
    { id: 'e3', turmaId, disciplinaId: 'fis', disciplina: 'Física',        educador: 'Prof. Maria Santos',   sala: 'Lab. Ciências',  diaSemana: 'segunda', horaInicio: '09:00', horaFim: '10:00', ...c(2) },
    { id: 'e4', turmaId, disciplinaId: 'ing', disciplina: 'Inglês',        educador: 'Prof. João Lima',      sala: 'Sala 101',       diaSemana: 'segunda', horaInicio: '10:00', horaFim: '11:00', ...c(3) },
    { id: 'e5', turmaId, disciplinaId: 'por', disciplina: 'Português',     educador: 'Prof. Carlos Souza',   sala: 'Sala 101',       diaSemana: 'terca',   horaInicio: '07:00', horaFim: '08:00', ...c(1) },
    { id: 'e6', turmaId, disciplinaId: 'mat', disciplina: 'Matemática',    educador: 'Prof. Ana Silva',      sala: 'Sala 101',       diaSemana: 'terca',   horaInicio: '08:00', horaFim: '09:00', ...c(0) },
    { id: 'e7', turmaId, disciplinaId: 'bio', disciplina: 'Biologia',      educador: 'Prof. Lúcia Ferreira', sala: 'Lab. Ciências',  diaSemana: 'terca',   horaInicio: '09:00', horaFim: '10:00', ...c(4) },
    { id: 'e8', turmaId, disciplinaId: 'ef',  disciplina: 'Ed. Física',    educador: 'Prof. Roberto Alves',  sala: 'Quadra',         diaSemana: 'terca',   horaInicio: '10:00', horaFim: '11:00', ...c(5) },
    { id: 'e9', turmaId, disciplinaId: 'fis', disciplina: 'Física',        educador: 'Prof. Maria Santos',   sala: 'Lab. Ciências',  diaSemana: 'quarta',  horaInicio: '07:00', horaFim: '08:00', ...c(2) },
    { id: 'e10',turmaId, disciplinaId: 'mat', disciplina: 'Matemática',    educador: 'Prof. Ana Silva',      sala: 'Sala 101',       diaSemana: 'quarta',  horaInicio: '09:00', horaFim: '10:00', ...c(0) },
    { id: 'e11',turmaId, disciplinaId: 'art', disciplina: 'Artes',         educador: 'Prof. Lúcia Ferreira', sala: 'Sala 101',       diaSemana: 'quarta',  horaInicio: '10:00', horaFim: '11:00', ...c(6) },
    { id: 'e12',turmaId, disciplinaId: 'ing', disciplina: 'Inglês',        educador: 'Prof. João Lima',      sala: 'Sala 101',       diaSemana: 'quinta',  horaInicio: '07:00', horaFim: '08:00', ...c(3) },
    { id: 'e13',turmaId, disciplinaId: 'por', disciplina: 'Português',     educador: 'Prof. Carlos Souza',   sala: 'Sala 101',       diaSemana: 'quinta',  horaInicio: '08:00', horaFim: '09:00', ...c(1) },
    { id: 'e14',turmaId, disciplinaId: 'mat', disciplina: 'Matemática',    educador: 'Prof. Ana Silva',      sala: 'Sala 101',       diaSemana: 'quinta',  horaInicio: '09:00', horaFim: '10:00', ...c(0) },
    { id: 'e15',turmaId, disciplinaId: 'his', disciplina: 'História',      educador: 'Prof. João Lima',      sala: 'Sala 101',       diaSemana: 'quinta',  horaInicio: '10:00', horaFim: '11:00', ...c(7) },
    { id: 'e16',turmaId, disciplinaId: 'bio', disciplina: 'Biologia',      educador: 'Prof. Lúcia Ferreira', sala: 'Lab. Ciências',  diaSemana: 'sexta',   horaInicio: '07:00', horaFim: '08:00', ...c(4) },
    { id: 'e17',turmaId, disciplinaId: 'fis', disciplina: 'Física',        educador: 'Prof. Maria Santos',   sala: 'Lab. Ciências',  diaSemana: 'sexta',   horaInicio: '08:00', horaFim: '09:00', ...c(2) },
    { id: 'e18',turmaId, disciplinaId: 'his', disciplina: 'História',      educador: 'Prof. João Lima',      sala: 'Sala 101',       diaSemana: 'sexta',   horaInicio: '09:00', horaFim: '10:00', ...c(7) },
    { id: 'e19',turmaId, disciplinaId: 'ing', disciplina: 'Inglês',        educador: 'Prof. João Lima',      sala: 'Sala 101',       diaSemana: 'sexta',   horaInicio: '10:00', horaFim: '11:00', ...c(3) },
  ];
}

@Component({
  selector: 'app-cronograma-educando',
  templateUrl: './cronograma-educando.component.html',
  styleUrls: ['./cronograma-educando.component.scss']
})
export class CronogramaEducandoComponent implements OnInit {

  readonly educando = {
    id: 1,
    nome: 'Ana Paula Ferreira',
    turma: {
      id: 't1',
      codigo: '1A',
      serie: '1º Ano',
      turno: 'Manhã' as 'Manhã' | 'Tarde' | 'Noite',
      anoLetivo: '2026'
    }
  };

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

  ngOnInit(): void {
    for (let h = 7; h <= 22; h++) {
      this.horas.push(`${h.toString().padStart(2, '0')}:00`);
    }

    try {
      const stored = localStorage.getItem('cronograma_slots_v2');
      if (stored) {
        const all: any[] = JSON.parse(stored);
        this.slots = all.filter(s => s.turmaId === this.educando.turma.id);
      }
    } catch {}

    if (this.slots.length === 0) {
      this.slots = buildMockSlots(this.educando.turma.id);
    }

    const diasMap: Record<number, DiaSemana> = { 1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta' };
    this.hojeKey = diasMap[new Date().getDay()] ?? null;
  }

  get horasFiltradas(): string[] {
    const turno = this.educando.turma.turno;
    if (turno === 'Tarde') return this.horas.filter(h => parseInt(h) >= 12 && parseInt(h) <= 18);
    if (turno === 'Noite') return this.horas.filter(h => parseInt(h) >= 18);
    return this.horas.filter(h => parseInt(h) >= 7 && parseInt(h) <= 12);
  }

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
