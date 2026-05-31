import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AvaliacaoApiService } from '../../../avaliacoes/services/avaliacao-api.service';

interface PerguntaForm {
  texto: string;
  tipo: 'escala' | 'aberta' | 'sim_nao';
  obrigatoria: boolean;
}

@Component({
  selector: 'app-criar-formulario',
  templateUrl: './criar-formulario.component.html',
  styleUrls: ['./criar-formulario.component.scss']
})
export class CriarFormularioComponent {

  // ── Campos do formulário ──────────────────────────────────────────────────
  titulo = '';
  descricao = '';
  icone = '📋';
  cor = 'azul';

  publicoSelecionado: { educando: boolean; educador: boolean; responsavel: boolean } = {
    educando: false,
    educador: false,
    responsavel: false,
  };

  perguntas: PerguntaForm[] = [
    { texto: '', tipo: 'escala', obrigatoria: true }
  ];

  // ── Estado ────────────────────────────────────────────────────────────────
  enviando = false;
  erros: string[] = [];
  sucesso = false;
  formularioCriado: { id: string; titulo: string } | null = null;

  // ── Opções ────────────────────────────────────────────────────────────────
  coresDisponiveis = [
    { value: 'azul',    label: 'Azul',    hex: '#2563eb' },
    { value: 'verde',   label: 'Verde',   hex: '#16a34a' },
    { value: 'roxo',    label: 'Roxo',    hex: '#7c3aed' },
    { value: 'laranja', label: 'Laranja', hex: '#ea580c' },
    { value: 'rosa',    label: 'Rosa',    hex: '#db2777' },
    { value: 'cinza',   label: 'Cinza',   hex: '#64748b' },
    { value: 'amarelo', label: 'Amarelo', hex: '#d97706' },
  ];

  iconesDisponiveis = ['📋', '⭐', '📊', '🏫', '📚', '✏️', '🎯', '💡', '🔍', '📝', '🌟', '📈'];

  tiposPerguntas = [
    { value: 'escala',  label: 'Escala 1–5' },
    { value: 'aberta',  label: 'Resposta aberta' },
    { value: 'sim_nao', label: 'Sim / Não' },
  ];

  constructor(
    private router: Router,
    private api: AvaliacaoApiService
  ) {}

  // ── Público ───────────────────────────────────────────────────────────────

  get publicoArray(): string[] {
    const p: string[] = [];
    if (this.publicoSelecionado.educando)   p.push('educando');
    if (this.publicoSelecionado.educador)   p.push('educador');
    if (this.publicoSelecionado.responsavel) p.push('responsavel');
    return p;
  }

  // ── Perguntas ─────────────────────────────────────────────────────────────

  adicionarPergunta(): void {
    this.perguntas.push({ texto: '', tipo: 'escala', obrigatoria: true });
  }

  removerPergunta(index: number): void {
    if (this.perguntas.length > 1) {
      this.perguntas.splice(index, 1);
    }
  }

  moverPerguntaParaCima(index: number): void {
    if (index > 0) {
      const temp = this.perguntas[index - 1];
      this.perguntas[index - 1] = this.perguntas[index];
      this.perguntas[index] = temp;
    }
  }

  moverPerguntaParaBaixo(index: number): void {
    if (index < this.perguntas.length - 1) {
      const temp = this.perguntas[index + 1];
      this.perguntas[index + 1] = this.perguntas[index];
      this.perguntas[index] = temp;
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  // ── Validação e envio ─────────────────────────────────────────────────────

  private validar(): boolean {
    this.erros = [];

    if (!this.titulo.trim()) {
      this.erros.push('O título do formulário é obrigatório.');
    }
    if (this.publicoArray.length === 0) {
      this.erros.push('Selecione ao menos um tipo de usuário destinatário.');
    }
    const perguntasValidas = this.perguntas.filter(p => p.texto.trim());
    if (perguntasValidas.length === 0) {
      this.erros.push('Adicione ao menos uma pergunta com texto preenchido.');
    }

    return this.erros.length === 0;
  }

  salvar(): void {
    if (!this.validar() || this.enviando) return;

    this.enviando = true;
    const payload = {
      titulo: this.titulo.trim(),
      descricao: this.descricao.trim(),
      icone: this.icone,
      cor: this.cor,
      publico: this.publicoArray,
      perguntas: this.perguntas
        .filter(p => p.texto.trim())
        .map(p => ({ texto: p.texto.trim(), tipo: p.tipo, obrigatoria: p.obrigatoria })),
    };

    this.api.criarFormulario(payload).subscribe({
      next: (res: { id: string; titulo: string }) => {
        this.enviando = false;
        this.formularioCriado = res;
        this.sucesso = true;
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.enviando = false;
        const msg = err?.error?.message || err?.message || 'Erro ao salvar o formulário. Tente novamente.';
        this.erros = [msg];
      }
    });
  }

  criarOutro(): void {
    this.titulo = '';
    this.descricao = '';
    this.icone = '📋';
    this.cor = 'azul';
    this.publicoSelecionado = { educando: false, educador: false, responsavel: false };
    this.perguntas = [{ texto: '', tipo: 'escala', obrigatoria: true }];
    this.erros = [];
    this.sucesso = false;
    this.formularioCriado = null;
  }

  voltarAoInicio(): void {
    this.router.navigate(['/home']);
  }
}
