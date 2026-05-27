import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reportes`;

  downloadClientServiceReport(filters: any): Observable<Blob> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params = params.append(key, filters[key]);
      }
    });

    return this.http.get(`${this.apiUrl}/clientes-servicios`, {
      params,
      responseType: 'blob'
    });
  }
}