import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface DadosRequest {
  coluna1?: string;
  coluna2?: string;
  id?: number;
  [key: string]: any;
}

export interface DadosResponse {
  statusCode: number;
  body: any;
  headers: {
    'Content-Type': string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AwsLambdaService {
  private apiUrl = environment.apiGatewayEndpoint;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * GET - Busca todos os dados
   */
  getDados(): Observable<any> {
    return this.http
      .get<DadosResponse>(`${this.apiUrl}/dados`, this.httpOptions)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  /**
   * POST - Cria novo registro
   */
  createDados(dados: DadosRequest): Observable<any> {
    return this.http
      .post<DadosResponse>(
        `${this.apiUrl}/dados`,
        dados,
        this.httpOptions
      )
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * PUT - Atualiza registro
   */
  updateDados(dados: DadosRequest): Observable<any> {
    return this.http
      .put<DadosResponse>(
        `${this.apiUrl}/dados`,
        dados,
        this.httpOptions
      )
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * DELETE - Deleta registro
   */
  deleteDados(id: number): Observable<any> {
    return this.http
      .delete<DadosResponse>(
        `${this.apiUrl}/dados`,
        {
          ...this.httpOptions,
          body: { id }
        }
      )
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Tratamento de erros
   */
  private handleError(error: any) {
    let errorMessage = '';

    if (error.error instanceof ErrorEvent) {
      // Erro do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do servidor
      errorMessage = `Erro ${error.status}: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
