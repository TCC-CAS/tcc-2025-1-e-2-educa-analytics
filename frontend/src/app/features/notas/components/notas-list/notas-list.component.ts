import { Component, OnInit } from '@angular/core';

interface Nota {
  avaliacao: string;
  nota: number | null;
  peso: number;
}

interface Educando {
  id: number;
  nome: string;
  matricula: string;
  notas: Nota[];
  media: number;
}

@Component({
  selector: 'app-notas-list',
  templateUrl: './notas-list.component.html',
  styleUrls: ['./notas-list.component.scss']
})
export class NotasListComponent implements OnInit {
  educandos: Educando[] = [];
  educandosFiltrados: Educando[] = [];
  avaliacoes: string[] = [];
  
  // Filtros
  periodoLetivo: string = '';
  turma: string = '';
  disciplina: string = '';
  
  // Modo de edição (para educadores registrarem notas)
  modoEdicao: boolean = false;

  constructor() {}

  ngOnInit(): void {}

  aplicarFiltros(): void {
    if (!this.periodoLetivo || !this.turma || !this.disciplina) {
      this.educandosFiltrados = [];
      return;
    }

    // Mock data - substituir por chamada à API
    this.avaliacoes = ['Prova 1', 'Prova 2', 'Trabalho', 'Prova Final'];
    
    this.educandos = [
      { 
        id: 1, 
        nome: 'João Silva Santos', 
        matricula: '2024001',
        notas: [
          { avaliacao: 'Prova 1', nota: 8.5, peso: 2 },
          { avaliacao: 'Prova 2', nota: 7.0, peso: 2 },
          { avaliacao: 'Trabalho', nota: 9.0, peso: 1 },
          { avaliacao: 'Prova Final', nota: 8.0, peso: 2 }
        ],
        media: 8.07
      },
      { 
        id: 2, 
        nome: 'Maria Oliveira Costa', 
        matricula: '2024002',
        notas: [
          { avaliacao: 'Prova 1', nota: 9.0, peso: 2 },
          { avaliacao: 'Prova 2', nota: 8.5, peso: 2 },
          { avaliacao: 'Trabalho', nota: 10.0, peso: 1 },
          { avaliacao: 'Prova Final', nota: 9.5, peso: 2 }
        ],
        media: 9.14
      },
      { 
        id: 3, 
        nome: 'Pedro Henrique Lima', 
        matricula: '2024003',
        notas: [
          { avaliacao: 'Prova 1', nota: 6.0, peso: 2 },
          { avaliacao: 'Prova 2', nota: 5.5, peso: 2 },
          { avaliacao: 'Trabalho', nota: 7.0, peso: 1 },
          { avaliacao: 'Prova Final', nota: 6.5, peso: 2 }
        ],
        media: 6.14
      },
      { 
        id: 4, 
        nome: 'Ana Carolina Souza', 
        matricula: '2024004',
        notas: [
          { avaliacao: 'Prova 1', nota: 10.0, peso: 2 },
          { avaliacao: 'Prova 2', nota: 9.5, peso: 2 },
          { avaliacao: 'Trabalho', nota: 10.0, peso: 1 },
          { avaliacao: 'Prova Final', nota: 10.0, peso: 2 }
        ],
        media: 9.86
      }
    ];
    
    this.educandosFiltrados = [...this.educandos];
  }

  limparFiltros(): void {
    this.periodoLetivo = '';
    this.turma = '';
    this.disciplina = '';
    this.educandosFiltrados = [];
    this.avaliacoes = [];
    this.modoEdicao = false;
  }

  habilitarEdicao(): void {
    if (this.educandosFiltrados.length === 0) {
      alert('Aplique os filtros antes de registrar notas');
      return;
    }
    this.modoEdicao = true;
  }

  cancelarEdicao(): void {
    this.modoEdicao = false;
    this.aplicarFiltros(); // Recarrega os dados originais
  }

  getNota(educando: Educando, avaliacao: string): Nota | undefined {
    return educando.notas.find(n => n.avaliacao === avaliacao);
  }

  validarNota(event: any, educando: Educando, avaliacao: string): void {
    const valor = parseFloat(event.target.value);
    const nota = this.getNota(educando, avaliacao);
    
    if (isNaN(valor) || valor < 0 || valor > 10) {
      event.target.value = nota?.nota || '';
      return;
    }

    if (nota) {
      nota.nota = valor;
      this.calcularMedia(educando);
    }
  }

  calcularMedia(educando: Educando): void {
    let somaNotas = 0;
    let somaPesos = 0;

    educando.notas.forEach(nota => {
      if (nota.nota !== null) {
        somaNotas += nota.nota * nota.peso;
        somaPesos += nota.peso;
      }
    });

    educando.media = somaPesos > 0 ? somaNotas / somaPesos : 0;
  }

  salvarNotas(): void {
    // Implementar chamada à API
    console.log('Salvar notas:', {
      periodoLetivo: this.periodoLetivo,
      turma: this.turma,
      disciplina: this.disciplina,
      educandos: this.educandosFiltrados.map(e => ({
        educandoId: e.id,
        notas: e.notas
      }))
    });

    alert('Notas registradas com sucesso!');
    this.modoEdicao = false;
  }

  getMediaClass(media: number): string {
    if (media >= 9) return 'media-excelente';
    if (media >= 7) return 'media-bom';
    if (media >= 5) return 'media-recuperacao';
    return 'media-reprovado';
  }
}
