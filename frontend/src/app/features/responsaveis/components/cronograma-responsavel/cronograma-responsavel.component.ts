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

interface TurmaInfo {
  id: string;
  codigo: string;
  serie: string;
  turno: 'Manhã' | 'Tarde' | 'Noite';
  anoLetivo: string;
}

interface EducandoCard {
  id: number;
  nome: string;
  turma: TurmaInfo;
  slots: AulaSlot[];
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

function slotsAna(turmaId: string): AulaSlot[] {
  return [
    { id: 'a1',  turmaId, disciplinaId: 'mat', disciplina: 'Matemática',  educador: 'Prof. Ana Silva',      sala: 'Sala 101',      diaSemana: 'segunda', horaInicio: '07:00', horaFim: '08:00', ...c(0) },
    { id: 'a2',  turmaId, disciplinaId: 'por', disciplina: 'Português',   educador: 'Prof. Carlos Souza',   sala: 'Sala 101',      diaSemana: 'segunda', horaInicio: '08:00', horaFim: '09:00', ...c(1) },
    { id: 'a3',  turmaId, disciplinaId: 'fis', disciplina: 'Física',      educador: 'Prof. Maria Santos',   sala: 'Lab. Ciências', diaSemana: 'segunda', horaInicio: '09:00', horaFim: '10:00', ...c(2) },
    { id: 'a4',  turmaId, disciplinaId: 'ing', disciplina: 'Inglês',      educador: 'Prof. João Lima',      sala: 'Sala 101',      diaSemana: 'segunda', horaInicio: '10:00', horaFim: '11:00', ...c(3) },
    { id: 'a5',  turmaId, disciplinaId: 'por', disciplina: 'Português',   educador: 'Prof. Carlos Souza',   sala: 'Sala 101',      diaSemana: 'terca',   horaInicio: '07:00', horaFim: '08:00', ...c(1) },
    { id: 'a6',  turmaId, disciplinaId: 'mat', disciplina: 'Matemática',  educador: 'Prof. Ana Silva',      sala: 'Sala 101',      diaSemana: 'terca',   horaInicio: '08:00', horaFim: '09:00', ...c(0) },
    { id: 'a7',  turmaId, disciplinaId: 'bio', disciplina: 'Biologia',    educador: 'Prof. Lúcia Ferreira', sala: 'Lab. Ciências', diaSemana: 'terca',   horaInicio: '09:00', horaFim: '10:00', ...c(4) },
    { id: 'a8',  turmaId, disciplinaId: 'ef',  disciplina: 'Ed. Física',  educador: 'Prof. Roberto Alves',  sala: 'Quadra',        diaSemana: 'terca',   horaInicio: '10:00', horaFim: '11:00', ...c(5) },
    { id: 'a9',  turmaId, disciplinaId: 'fis', disciplina: 'Física',      educador: 'Prof. Maria Santos',   sala: 'Lab. Ciências', diaSemana: 'quarta',  horaInicio: '07:00', horaFim: '08:00', ...c(2) },
    { id: 'a10', turmaId, disciplinaId: 'mat', disciplina: 'Matemática',  educador: 'Prof. Ana Silva',      sala: 'Sala 101',      diaSemana: 'quarta',  horaInicio: '09:00', horaFim: '10:00', ...c(0) },
    { id: 'a11', turmaId, disciplinaId: 'art', disciplina: 'Artes',       educador: 'Prof. Lúcia Ferreira', sala: 'Sala 101',      diaSemana: 'quarta',  horaInicio: '10:00', horaFim: '11:00', ...c(6) },
    { id: 'a12', turmaId, disciplinaId: 'ing', disciplina: 'Inglês',      educador: 'Prof. João Lima',      sala: 'Sala 101',      diaSemana: 'quinta',  horaInicio: '07:00', horaFim: '08:00', ...c(3) },
    { id: 'a13', turmaId, disciplinaId: 'por', disciplina: 'Português',   educador: 'Prof. Carlos Souza',   sala: 'Sala 101',      diaSemana: 'quinta',  horaInicio: '08:00', horaFim: '09:00', ...c(1) },
    { id: 'a14', turmaId, disciplinaId: 'mat', disciplina: 'Matemática',  educador: 'Prof. Ana Silva',      sala: 'Sala 101',      diaSemana: 'quinta',  horaInicio: '09:00', horaFim: '10:00', ...c(0) },
    { id: 'a15', turmaId, disciplinaId: 'his', disciplina: 'História',    educador: 'Prof. João Lima',      sala: 'Sala 101',      diaSemana: 'quinta',  horaInicio: '10:00', horaFim: '11:00', ...c(7) },
    { id: 'a16', turmaId, disciplinaId: 'bio', disciplina: 'Biologia',    educador: 'Prof. Lúcia Ferreira', sala: 'Lab. Ciências', diaSemana: 'sexta',   horaInicio: '07:00', horaFim: '08:00', ...c(4) },
    { id: 'a17', turmaId, disciplinaId: 'fis', disciplina: 'Física',      educador: 'Prof. Maria Santos',   sala: 'Lab. Ciências', diaSemana: 'sexta',   horaInicio: '08:00', horaFim: '09:00', ...c(2) },
    { id: 'a18', turmaId, disciplinaId: 'his', disciplina: 'História',    educador: 'Prof. João Lima',      sala: 'Sala 101',      diaSemana: 'sexta',   horaInicio: '09:00', horaFim: '10:00', ...c(7) },
    { id: 'a19', turmaId, disciplinaId: 'ing', disciplina: 'Inglês',      educador: 'Prof. João Lima',      sala: 'Sala 101',      diaSemana: 'sexta',   horaInicio: '10:00', horaFim: '11:00', ...c(3) },
  ];
}

function slotsCarlos(turmaId: string): AulaSlot[] {
  return [
    { id: 'c1',  turmaId, disciplinaId: 'mat', disciplina: 'Matemática',  educador: 'Prof. Ana Silva',      sala: 'Sala 302',      diaSemana: 'segunda', horaInicio: '12:00', horaFim: '13:00', ...c(0) },
    { id: 'c2',  turmaId, disciplinaId: 'his', disciplina: 'História',    educador: 'Prof. João Lima',      sala: 'Sala 302',      diaSemana: 'segunda', horaInicio: '13:00', horaFim: '14:00', ...c(7) },
    { id: 'c3',  turmaId, disciplinaId: 'ef',  disciplina: 'Ed. Física',  educador: 'Prof. Roberto Alves',  sala: 'Quadra',        diaSemana: 'segunda', horaInicio: '14:00', horaFim: '15:00', ...c(5) },
    { id: 'c4',  turmaId, disciplinaId: 'por', disciplina: 'Português',   educador: 'Prof. Carlos Souza',   sala: 'Sala 302',      diaSemana: 'terca',   horaInicio: '12:00', horaFim: '13:00', ...c(1) },
    { id: 'c5',  turmaId, disciplinaId: 'mat', disciplina: 'Matemática',  educador: 'Prof. Ana Silva',      sala: 'Sala 302',      diaSemana: 'terca',   horaInicio: '13:00', horaFim: '14:00', ...c(0) },
    { id: 'c6',  turmaId, disciplinaId: 'qui', disciplina: 'Química',     educador: 'Prof. Maria Santos',   sala: 'Lab. Química',  diaSemana: 'terca',   horaInicio: '14:00', horaFim: '15:00', ...c(2) },
    { id: 'c7',  turmaId, disciplinaId: 'geo', disciplina: 'Geografia',   educador: 'Prof. Lúcia Ferreira', sala: 'Sala 302',      diaSemana: 'quarta',  horaInicio: '12:00', horaFim: '13:00', ...c(6) },
    { id: 'c8',  turmaId, disciplinaId: 'mat', disciplina: 'Matemática',  educador: 'Prof. Ana Silva',      sala: 'Sala 302',      diaSemana: 'quarta',  horaInicio: '13:00', horaFim: '14:00', ...c(0) },
    { id: 'c9',  turmaId, disciplinaId: 'ing', disciplina: 'Inglês',      educador: 'Prof. João Lima',      sala: 'Sala 302',      diaSemana: 'quarta',  horaInicio: '14:00', horaFim: '15:00', ...c(3) },
    { id: 'c10', turmaId, disciplinaId: 'qui', disciplina: 'Química',     educador: 'Prof. Maria Santos',   sala: 'Lab. Química',  diaSemana: 'quinta',  horaInicio: '12:00', horaFim: '13:00', ...c(2) },
    { id: 'c11', turmaId, disciplinaId: 'por', disciplina: 'Português',   educador: 'Prof. Carlos Souza',   sala: 'Sala 302',      diaSemana: 'quinta',  horaInicio: '13:00', horaFim: '14:00', ...c(1) },
    { id: 'c12', turmaId, disciplinaId: 'his', disciplina: 'História',    educador: 'Prof. João Lima',      sala: 'Sala 302',      diaSemana: 'quinta',  horaInicio: '14:00', horaFim: '15:00', ...c(7) },
    { id: 'c13', turmaId, disciplinaId: 'geo', disciplina: 'Geografia',   educador: 'Prof. Lúcia Ferreira', sala: 'Sala 302',      diaSemana: 'sexta',   horaInicio: '12:00', horaFim: '13:00', ...c(6) },
    { id: 'c14', turmaId, disciplinaId: 'mat', disciplina: 'Matemática',  educador: 'Prof. Ana Silva',      sala: 'Sala 302',      diaSemana: 'sexta',   horaInicio: '13:00', horaFim: '14:00', ...c(0) },
    { id: 'c15', turmaId, disciplinaId: 'ing', disciplina: 'Inglês',      educador: 'Prof. João Lima',      sala: 'Sala 302',      diaSemana: 'sexta',   horaInicio: '15:00', horaFim: '16:00', ...c(3) },
  ];
}

@Component({
  selector: 'app-cronograma-responsavel',
  templateUrl: './cronograma-responsavel.component.html',
  styleUrls: ['./cronograma-responsavel.component.scss']
})
export class CronogramaResponsavelComponent implements OnInit {

  readonly responsavel = { id: 10, nome: 'Maria Ferreira' };

  dias: { key: DiaSemana; label: string; abrev: string }[] = [
    { key: 'segunda', label: 'Segunda-feira', abrev: 'Seg' },
    { key: 'terca',   label: 'Terça-feira',   abrev: 'Ter' },
    { key: 'quarta',  label: 'Quarta-feira',  abrev: 'Qua' },
    { key: 'quinta',  label: 'Quinta-feira',  abrev: 'Qui' },
    { key: 'sexta',   label: 'Sexta-feira',   abrev: 'Sex' },
  ];

  horas: string[] = [];
  hojeKey: DiaSemana | null = null;

  educandos: EducandoCard[] = [];
  selecionado!: EducandoCard;

  ngOnInit(): void {
    for (let h = 7; h <= 22; h++) {
      this.horas.push(`${h.toString().padStart(2, '0')}:00`);
    }

    const diasMap: Record<number, DiaSemana> = { 1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta' };
    this.hojeKey = diasMap[new Date().getDay()] ?? null;

    // Load from localStorage, fall back to mock
    let storedAll: any[] = [];
    try {
      const stored = localStorage.getItem('cronograma_slots_v2');
      if (stored) storedAll = JSON.parse(stored);
    } catch {}

    const cardsConfig = [
      { id: 1, nome: 'Ana Paula Ferreira', turma: { id: 't1', codigo: '1A', serie: '1º Ano', turno: 'Manhã' as const, anoLetivo: '2026' }, fallback: slotsAna },
      { id: 2, nome: 'Carlos Ferreira',    turma: { id: 't3', codigo: '3B', serie: '3º Ano', turno: 'Tarde' as const, anoLetivo: '2026' }, fallback: slotsCarlos },
    ];

    this.educandos = cardsConfig.map(cfg => {
      const fromStorage = storedAll.filter(s => s.turmaId === cfg.turma.id);
      return {
        id:    cfg.id,
        nome:  cfg.nome,
        turma: cfg.turma,
        slots: fromStorage.length > 0 ? fromStorage : cfg.fallback(cfg.turma.id),
      };
    });

    this.selecionado = this.educandos[0];
  }

  selecionar(e: EducandoCard): void { this.selecionado = e; }

  get horasFiltradas(): string[] {
    const turno = this.selecionado.turma.turno;
    if (turno === 'Tarde') return this.horas.filter(h => parseInt(h) >= 12 && parseInt(h) <= 18);
    if (turno === 'Noite') return this.horas.filter(h => parseInt(h) >= 18);
    return this.horas.filter(h => parseInt(h) >= 7 && parseInt(h) <= 12);
  }

  get totalAulas(): number { return this.selecionado.slots.length; }

  get disciplinasCount(): number {
    return new Set(this.selecionado.slots.map(s => s.disciplinaId)).size;
  }

  get legenda(): { disciplinaId: string; disciplina: string; corBg: string; corBorder: string }[] {
    const seen = new Set<string>();
    return this.selecionado.slots.filter(s => {
      if (seen.has(s.disciplinaId)) return false;
      seen.add(s.disciplinaId);
      return true;
    }).map(s => ({ disciplinaId: s.disciplinaId, disciplina: s.disciplina, corBg: s.corBg, corBorder: s.corBorder }));
  }

  getSlot(dia: DiaSemana, hora: string): AulaSlot | undefined {
    return this.selecionado.slots.find(s => s.diaSemana === dia && s.horaInicio === hora);
  }

  isHoje(dia: DiaSemana): boolean { return dia === this.hojeKey; }

  trackByHora(_: number, h: string) { return h; }
  trackByDia(_: number, d: { key: string }) { return d.key; }
  trackById(_: number, e: EducandoCard) { return e.id; }
}
