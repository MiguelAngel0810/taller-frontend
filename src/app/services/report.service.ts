import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reportes`;

  descargarReporteClientes(filtros: any): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.apiUrl}/clientes-servicios`, filtros, {
      observe: 'response',
      responseType: 'blob'
    });
  }
}