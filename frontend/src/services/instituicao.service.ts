import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InstituicaoService {
  private apiUrl = `${environment.apiUrl}/instituicoes`;

  constructor(private http: HttpClient) {}

  /**
   * Busca instituições por termo (autocomplete)
   * @param termo Texto para buscar
   * @param limite Número máximo de resultados
   */
  buscarInstituicoes(termo: string, limite: number = 10): Observable<string[]> {
    if (!termo || termo.trim().length < 2) {
      return of([]);
    }

    const params = new HttpParams()
      .set('q', termo.trim())
      .set('limite', limite.toString());

    return this.http.get<string[]>(`${this.apiUrl}/buscar`, { params }).pipe(
      catchError(error => {
        console.error('Erro ao buscar instituições:', error);
        return of([]);
      })
    );
  }

  /**
   * Lista instituições principais (para popular dropdown inicial)
   * @param limite Número máximo de resultados
   */
  listarInstituicoes(limite: number = 50): Observable<string[]> {
    const params = new HttpParams().set('limite', limite.toString());

    return this.http.get<string[]>(this.apiUrl, { params }).pipe(
      catchError(error => {
        console.error('Erro ao listar instituições:', error);
        return of([]);
      })
    );
  }
}
