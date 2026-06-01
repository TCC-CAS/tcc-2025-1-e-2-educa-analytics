import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CronogramaService } from '../../../cronograma/services/cronograma.service';
import { AuthService } from '../../../../core/services/auth.service';

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

function stripSeconds(hora: string | undefined): string {
  if (!hora) return '';
  // "07:00:00" → "07:00"
  return hora.length > 5 ? hora.substring(0, 5) : hora;
}

function periodoToTurno(periodo: string | undefined): 'Manhã' | 'Tarde' | 'Noite' {
  if (!periodo) return 'Manhã';
  const p = periodo.toLowerCase();
  if (p.includes('tard')) return 'Tarde';
  if (p.includes('noit')) return 'Noite';
  return 'Manhã';
}

@Component({
  selector: 'app-cronograma-responsavel',
  templateUrl: './cronograma-responsavel.component.html',
  styleUrls: ['./cronograma-responsavel.component.scss']
})
export class CronogramaResponsavelComponent implements OnInit {

  responsavel = { id: '', nome: '' };

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

  carregando = false;
  erro: string | null = null;

  constructor(
    private cronogramaService: CronogramaService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    for (let h = 7; h <= 22; h++) {
      this.horas.push(`${h.toString().padStart(2, '0')}:00`);
    }
    const diasMap: Record<number, DiaSemana> = { 1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta' };
    this.hojeKey = diasMap[new Date().getDay()] ?? null;

    const idRota = this.route.snapshot.paramMap.get('id');
    const user   = this.authService.getCurrentUser();
    const idResponsavel = idRota || user?.id || null;

    if (!idResponsavel) {
      this.erro = 'Usuário não autenticado.';
      return;
    }

    this.responsavel = { id: idResponsavel, nome: user?.nome || idResponsavel };
    this.carregando = true;

    this.cronogramaService.listarCronogramaResponsavel(idResponsavel).subscribe({
      next: (res) => {
        this.carregando = false;
        const discColorMap = new Map<string, number>();

        this.educandos = (res.filhos || []).map((item, idx) => {
          const turmaInfo: TurmaInfo = {
            id: String(item.turma.idTurma),
            codigo: (item.turma as any).codTurma || '',
            serie: (item.turma as any).serie || item.turma.nomeTurma || '',
            turno: periodoToTurno((item.turma as any).periodo),
            anoLetivo: (item.turma as any).anoLetivo || '',
          };

          const slots: AulaSlot[] = (item.horarios || []).map(h => {
            const discId = String(h.idDisciplina);
            if (!discColorMap.has(discId)) {
              discColorMap.set(discId, discColorMap.size % CORES.length);
            }
            const cor = CORES[discColorMap.get(discId)!];
            const diaSemana = h.diaSemana as DiaSemana;
            return {
              id: String(h.id ?? h.idCronograma ?? Math.random()),
              turmaId: String(h.idTurma),
              disciplinaId: discId,
              disciplina: (h as any).disciplina?.nome || (h as any).nomeDisciplina || '',
              educador: (h as any).educador?.nome || (h as any).educadorNome || '',
              sala: (h as any).sala?.nome || (h as any).nomeSala || '',
              diaSemana,
              horaInicio: stripSeconds(h.horaInicio),
              horaFim: stripSeconds(h.horaFim),
              corBg: cor.bg,
              corText: cor.text,
              corBorder: cor.border,
            };
          });

          return {
            id: idx + 1,
            nome: item.filho.nomeCompleto,
            turma: turmaInfo,
            slots,
          };
        });

        this.selecionado = this.educandos[0] ?? { id: 0, nome: '', turma: { id: '', codigo: '', serie: '', turno: 'Manhã', anoLetivo: '' }, slots: [] };
      },
      error: (err) => {
        this.carregando = false;
        this.erro = 'Não foi possível carregar o cronograma. Tente novamente.';
        console.error('[CronogramaResponsavel]', err);
      }
    });
  }

  selecionar(e: EducandoCard): void { this.selecionado = e; }

  get horasFiltradas(): string[] {
    const turno = this.selecionado?.turma?.turno;
    if (turno === 'Tarde') return this.horas.filter(h => parseInt(h) >= 12 && parseInt(h) <= 18);
    if (turno === 'Noite') return this.horas.filter(h => parseInt(h) >= 18);
    return this.horas.filter(h => parseInt(h) >= 7 && parseInt(h) <= 12);
  }

  get totalAulas(): number { return this.selecionado?.slots?.length ?? 0; }

  get disciplinasCount(): number {
    return new Set(this.selecionado?.slots?.map(s => s.disciplinaId)).size;
  }

  get legenda(): { disciplinaId: string; disciplina: string; corBg: string; corBorder: string }[] {
    const seen = new Set<string>();
    return (this.selecionado?.slots || []).filter(s => {
      if (seen.has(s.disciplinaId)) return false;
      seen.add(s.disciplinaId);
      return true;
    }).map(s => ({ disciplinaId: s.disciplinaId, disciplina: s.disciplina, corBg: s.corBg, corBorder: s.corBorder }));
  }

  getSlot(dia: DiaSemana, hora: string): AulaSlot | undefined {
    return this.selecionado?.slots?.find(s => s.diaSemana === dia && s.horaInicio === hora);
  }

  isHoje(dia: DiaSemana): boolean { return dia === this.hojeKey; }

  trackByHora(_: number, h: string) { return h; }
  trackByDia(_: number, d: { key: string }) { return d.key; }
  trackById(_: number, e: EducandoCard) { return e.id; }
}

