import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export interface Servicio {
  id: number;
  nombre: string;
  precio_base?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/ordenes`;

  getServicios(): Observable<Servicio[]> {
    // Asumiendo que el endpoint de servicios existe según el requerimiento
    return this.http.get<Servicio[]>(`${environment.apiUrl}/servicios`);
  }

  createOrder(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }
}