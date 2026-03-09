import { Component, OnInit } from '@angular/core';

interface Educando {
  id: number;
  nome: string;
  matricula: string;
  presencas: number;
  faltas: number;
  percentualFrequencia: number;
  presencaHoje?: boolean;
}

@Component({
  selector: 'app-frequencia-list',
  templateUrl: './frequencia-list.component.html',
  styleUrls: ['./frequencia-list.component.scss']
})
export class FrequenciaListComponent implements OnInit {
  educandos: Educando[] = [];
  educandosFiltrados: Educando[] = [];
  
  // Filtros
  periodoLetivo: string = '';
  turma: string = '';
  disciplina: string = '';
  
  // Modo de edição (para educadores registrarem presença)
  modoEdicao: boolean = false;
  dataAula: string = '';

  constructor() {}

  ngOnInit(): void {
    this.dataAula = new Date().toISOString().split('T')[0];
  }

  aplicarFiltros(): void {
    if (!this.periodoLetivo || !this.turma || !this.disciplina) {
      this.educandosFiltrados = [];
      return;
    }

    // Mock data - substituir por chamada à API
    this.educandos = [
      { 
        id: 1, 
        nome: 'João Silva Santos', 
        matricula: '2024001',
        presencas: 85,
        faltas: 5,
        percentualFrequencia: 94.4,
        presencaHoje: undefined
      },
      { 
        id: 2, 
        nome: 'Maria Oliveira Costa', 
        matricula: '2024002',
        presencas: 82,
        faltas: 8,
        percentualFrequencia: 91.1,
        presencaHoje: undefined
      },
      { 
        id: 3, 
        nome: 'Pedro Henrique Lima', 
        matricula: '2024003',
        presencas: 78,
        faltas: 12,
        percentualFrequencia: 86.7,
        presencaHoje: undefined
      },
      { 
        id: 4, 
        nome: 'Ana Carolina Souza', 
        matricula: '2024004',
        presencas: 88,
        faltas: 2,
        percentualFrequencia: 97.8,
        presencaHoje: undefined
      }
    ];
    
    this.educandosFiltrados = [...this.educandos];
  }

  limparFiltros(): void {
    this.periodoLetivo = '';
    this.turma = '';
    this.disciplina = '';
    this.educandosFiltrados = [];
    this.modoEdicao = false;
  }

  habilitarEdicao(): void {
    if (this.educandosFiltrados.length === 0) {
      alert('Aplique os filtros antes de registrar frequência');
      return;
    }
    this.modoEdicao = true;
  }

  cancelarEdicao(): void {
    this.modoEdicao = false;
    this.educandosFiltrados.forEach(e => e.presencaHoje = undefined);
  }

  marcarPresenca(educando: Educando): void {
    educando.presencaHoje = true;
  }

  marcarFalta(educando: Educando): void {
    educando.presencaHoje = false;
  }

  salvarFrequencia(): void {
    const registros = this.educandosFiltrados.filter(e => e.presencaHoje !== undefined);
    
    if (registros.length === 0) {
      alert('Marque a presença ou falta de pelo menos um educando');
      return;
    }

    // Implementar chamada à API
    console.log('Salvar frequência:', {
      dataAula: this.dataAula,
      periodoLetivo: this.periodoLetivo,
      turma: this.turma,
      disciplina: this.disciplina,
      registros: registros.map(e => ({
        educandoId: e.id,
        presente: e.presencaHoje
      }))
    });

    alert('Frequência registrada com sucesso!');
    this.modoEdicao = false;
    this.aplicarFiltros(); // Recarrega os dados atualizados
  }

  getStatusClass(percentual: number): string {
    if (percentual >= 95) return 'status-excelente';
    if (percentual >= 85) return 'status-bom';
    if (percentual >= 75) return 'status-atencao';
    return 'status-critico';
  }
}
