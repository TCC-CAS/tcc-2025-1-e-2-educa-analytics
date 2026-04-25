import { Component, OnInit } from '@angular/core';

export type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta';

export interface AulaSlot {
  id: string;
  turmaId: string;
  disciplinaId: string;
  disciplina: string;
  educadorId: string;
  educador: string;
  salaId: string;
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

const MOCK_TURMAS = [
  { id: 't1', nome: '6A', serie: '6º Ano', turno: 'Manhã' },
  { id: 't2', nome: '7B', serie: '7º Ano', turno: 'Manhã' },
  { id: 't3', nome: '8A', serie: '8º Ano', turno: 'Tarde' },
  { id: 't4', nome: '9B', serie: '9º Ano', turno: 'Tarde' },
  { id: 't5', nome: '1EM-A', serie: '1ª Série EM', turno: 'Noite' },
];

const MOCK_DISCIPLINAS = [
  { id: 'd1', nome: 'Matemática' },
  { id: 'd2', nome: 'Português' },
  { id: 'd3', nome: 'Ciências' },
  { id: 'd4', nome: 'História' },
  { id: 'd5', nome: 'Geografia' },
  { id: 'd6', nome: 'Inglês' },
  { id: 'd7', nome: 'Educação Física' },
  { id: 'd8', nome: 'Artes' },
  { id: 'd9', nome: 'Filosofia' },
  { id: 'd10', nome: 'Sociologia' },
];

const MOCK_EDUCADORES = [
  { id: 'e1', nome: 'Prof. Ana Silva' },
  { id: 'e2', nome: 'Prof. Carlos Souza' },
  { id: 'e3', nome: 'Prof. Maria Santos' },
  { id: 'e4', nome: 'Prof. João Lima' },
  { id: 'e5', nome: 'Prof. Lúcia Ferreira' },
  { id: 'e6', nome: 'Prof. Roberto Alves' },
];

const MOCK_SALAS = [
  { id: 's1', nome: 'Sala 101' },
  { id: 's2', nome: 'Sala 102' },
  { id: 's3', nome: 'Sala 201' },
  { id: 's4', nome: 'Lab. Ciências' },
  { id: 's5', nome: 'Lab. Informática' },
  { id: 's6', nome: 'Quadra' },
  { id: 's7', nome: 'Auditório' },
];

@Component({
  selector: 'app-cronograma-view',
  templateUrl: './cronograma-view.component.html',
  styleUrls: ['./cronograma-view.component.scss']
})
export class CronogramaViewComponent implements OnInit {

  turmas = MOCK_TURMAS;
  disciplinas = MOCK_DISCIPLINAS;
  educadores = MOCK_EDUCADORES;
  salas = MOCK_SALAS;

  turmaSelecionadaId: string = '';
  anoLetivo: string = '2025';

  dias: { key: DiaSemana; label: string; abrev: string }[] = [
    { key: 'segunda', label: 'Segunda-feira', abrev: 'Seg' },
    { key: 'terca',   label: 'Terça-feira',   abrev: 'Ter' },
    { key: 'quarta',  label: 'Quarta-feira',   abrev: 'Qua' },
    { key: 'quinta',  label: 'Quinta-feira',   abrev: 'Qui' },
    { key: 'sexta',   label: 'Sexta-feira',    abrev: 'Sex' },
  ];

  horas: string[] = [];
  slots: AulaSlot[] = [];

  // Modal
  modalVisible = false;
  modalDia: DiaSemana | null = null;
  modalHora: string = '';
  editingSlot: AulaSlot | null = null;
  confirmDeleteVisible = false;

  novoSlot = {
    disciplinaId: '',
    educadorId: '',
    salaId: '',
    horaInicio: '',
    horaFim: '',
  };

  // Confirm clear
  confirmLimpar = false;

  // Message
  message = '';
  messageType: 'success' | 'error' = 'success';

  private corMap: Record<string, { bg: string; text: string; border: string }> = {};
  private corIndex = 0;

  get slotsDaTurma(): AulaSlot[] {
    if (!this.turmaSelecionadaId) return [];
    return this.slots.filter(s => s.turmaId === this.turmaSelecionadaId);
  }

  get turmaSelecionada() {
    return this.turmas.find(t => t.id === this.turmaSelecionadaId);
  }

  get legenda(): { disciplina: string; cor: { bg: string; text: string; border: string } }[] {
    const seen = new Set<string>();
    return this.slotsDaTurma
      .filter(s => { if (seen.has(s.disciplinaId)) return false; seen.add(s.disciplinaId); return true; })
      .map(s => ({ disciplina: s.disciplina, cor: this.getCorDisciplina(s.disciplinaId) }));
  }

  get totalAulas(): number { return this.slotsDaTurma.length; }

  get horasFiltradas(): string[] {
    const turno = this.turmaSelecionada?.turno;
    if (turno === 'Tarde') {
      return this.horas.filter(h => parseInt(h) >= 12 && parseInt(h) <= 18);
    }
    if (turno === 'Noite') {
      return this.horas.filter(h => parseInt(h) >= 18);
    }
    return this.horas.filter(h => parseInt(h) >= 7 && parseInt(h) <= 12);
  }

  ngOnInit(): void {
    for (let h = 7; h <= 22; h++) {
      this.horas.push(`${h.toString().padStart(2, '0')}:00`);
    }

    try {
      const stored = localStorage.getItem('cronograma_slots_v2');
      if (stored) {
        this.slots = JSON.parse(stored);
        // Rebuild corMap
        this.slots.forEach(s => {
          if (!this.corMap[s.disciplinaId]) {
            this.corMap[s.disciplinaId] = { bg: s.corBg, text: s.corText, border: s.corBorder };
          }
        });
        this.corIndex = Object.keys(this.corMap).length;
      }
    } catch {}

    if (this.turmas.length > 0) {
      this.turmaSelecionadaId = this.turmas[0].id;
    }
  }

  getCorDisciplina(disciplinaId: string): { bg: string; text: string; border: string } {
    if (!this.corMap[disciplinaId]) {
      this.corMap[disciplinaId] = CORES[this.corIndex % CORES.length];
      this.corIndex++;
    }
    return this.corMap[disciplinaId];
  }

  getSlot(dia: DiaSemana, hora: string): AulaSlot | undefined {
    return this.slotsDaTurma.find(s => s.diaSemana === dia && s.horaInicio === hora);
  }

  abrirModalNovo(dia: DiaSemana, hora: string): void {
    if (this.getSlot(dia, hora)) return;
    if (!this.turmaSelecionadaId) { this.showMsg('Selecione uma turma primeiro.', 'error'); return; }

    const h = parseInt(hora);
    const fimH = Math.min(h + 1, 23);

    this.modalDia = dia;
    this.modalHora = hora;
    this.editingSlot = null;
    this.confirmDeleteVisible = false;
    this.novoSlot = {
      disciplinaId: '',
      educadorId: '',
      salaId: '',
      horaInicio: hora,
      horaFim: `${fimH.toString().padStart(2, '0')}:00`,
    };
    this.modalVisible = true;
  }

  editarSlot(event: Event, slot: AulaSlot): void {
    event.stopPropagation();
    this.editingSlot = { ...slot };
    this.modalDia = slot.diaSemana;
    this.modalHora = slot.horaInicio;
    this.confirmDeleteVisible = false;
    this.novoSlot = {
      disciplinaId: slot.disciplinaId,
      educadorId: slot.educadorId,
      salaId: slot.salaId,
      horaInicio: slot.horaInicio,
      horaFim: slot.horaFim,
    };
    this.modalVisible = true;
  }

  fecharModal(): void {
    this.modalVisible = false;
    this.editingSlot = null;
    this.confirmDeleteVisible = false;
  }

  salvarSlot(): void {
    if (!this.novoSlot.disciplinaId) return;

    const disc = this.disciplinas.find(d => d.id === this.novoSlot.disciplinaId);
    const educ = this.educadores.find(e => e.id === this.novoSlot.educadorId);
    const sala = this.salas.find(s => s.id === this.novoSlot.salaId);
    const cor  = this.getCorDisciplina(this.novoSlot.disciplinaId);

    if (this.editingSlot) {
      const idx = this.slots.findIndex(s => s.id === this.editingSlot!.id);
      if (idx >= 0) {
        this.slots[idx] = {
          ...this.editingSlot,
          disciplinaId: this.novoSlot.disciplinaId,
          disciplina: disc?.nome ?? '',
          educadorId: this.novoSlot.educadorId,
          educador: educ?.nome ?? '',
          salaId: this.novoSlot.salaId,
          sala: sala?.nome ?? '',
          horaInicio: this.novoSlot.horaInicio,
          horaFim: this.novoSlot.horaFim,
          corBg: cor.bg, corText: cor.text, corBorder: cor.border,
        };
      }
      this.showMsg('Aula atualizada com sucesso!', 'success');
    } else {
      this.slots.push({
        id: Date.now().toString(),
        turmaId: this.turmaSelecionadaId,
        disciplinaId: this.novoSlot.disciplinaId,
        disciplina: disc?.nome ?? '',
        educadorId: this.novoSlot.educadorId,
        educador: educ?.nome ?? '',
        salaId: this.novoSlot.salaId,
        sala: sala?.nome ?? '',
        diaSemana: this.modalDia!,
        horaInicio: this.novoSlot.horaInicio,
        horaFim: this.novoSlot.horaFim,
        corBg: cor.bg, corText: cor.text, corBorder: cor.border,
      });
      this.showMsg('Aula adicionada com sucesso!', 'success');
    }

    this.persist();
    this.fecharModal();
  }

  excluirSlot(): void {
    if (!this.editingSlot) return;
    this.slots = this.slots.filter(s => s.id !== this.editingSlot!.id);
    this.persist();
    this.showMsg('Aula removida.', 'success');
    this.fecharModal();
  }

  limparCronograma(): void {
    this.slots = this.slots.filter(s => s.turmaId !== this.turmaSelecionadaId);
    this.persist();
    this.confirmLimpar = false;
    this.showMsg('Cronograma limpo.', 'success');
  }

  private persist(): void {
    try { localStorage.setItem('cronograma_slots_v2', JSON.stringify(this.slots)); } catch {}
  }

  private showMsg(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3000);
  }

  getDiaLabel(dia: DiaSemana): string {
    return this.dias.find(d => d.key === dia)?.label ?? dia;
  }

  trackByHora(_: number, h: string) { return h; }
  trackByDia(_: number, d: any)     { return d.key; }
}
