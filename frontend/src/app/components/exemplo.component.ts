import { Component, OnInit } from '@angular/core';
import { AwsLambdaService } from '../../services/aws-lambda.service';

@Component({
  selector: 'app-exemplo',
  templateUrl: './exemplo.component.html',
  styleUrls: ['./exemplo.component.css']
})
export class ExemploComponent implements OnInit {
  dados: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private lambdaService: AwsLambdaService) {}

  ngOnInit(): void {
    this.buscarDados();
  }

  /**
   * Busca dados da Lambda
   */
  buscarDados(): void {
    this.loading = true;
    this.error = null;

    this.lambdaService.getDados().subscribe({
      next: (response: any) => {
        console.log('Dados recebidos:', response);
        this.dados = response;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erro ao buscar dados:', err);
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  /**
   * Cria novo registro
   */
  criarDados(coluna1: string, coluna2: string): void {
    const novoRegistro = { coluna1, coluna2 };

    this.lambdaService.createDados(novoRegistro).subscribe({
      next: (response: any) => {
        console.log('Registro criado:', response);
        this.buscarDados(); // Atualiza a lista
      },
      error: (err: any) => {
        console.error('Erro ao criar registro:', err);
        this.error = err.message;
      }
    });
  }

  /**
   * Atualiza registro
   */
  atualizarDados(id: number, coluna1: string, coluna2: string): void {
    const registroAtualizado = { id, coluna1, coluna2 };

    this.lambdaService.updateDados(registroAtualizado).subscribe({
      next: (response: any) => {
        console.log('Registro atualizado:', response);
        this.buscarDados();
      },
      error: (err: any) => {
        console.error('Erro ao atualizar:', err);
        this.error = err.message;
      }
    });
  }

  /**
   * Deleta registro
   */
  deletarDados(id: number): void {
    this.lambdaService.deleteDados(id).subscribe({
      next: (response: any) => {
        console.log('Registro deletado:', response);
        this.buscarDados();
      },
      error: (err: any) => {
        console.error('Erro ao deletar:', err);
        this.error = err.message;
      }
    });
  }
}
