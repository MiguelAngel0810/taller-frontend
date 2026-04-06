import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vehiculo } from '../pages/models/vehiculo.model';
import { OrdenServicio } from '../pages/models/orden-servicio.model';
import { environment } from '../../environment';

// Define una interfaz para la información de seguimiento para mejorar la legibilidad y seguridad de tipos.
export interface Seguimiento {
  orden: OrdenServicio;
  etapas: any[]; // Idealmente, 'any' se reemplazaría con una interfaz 'Etapa'
}

// Define un tipo genérico para las respuestas de la API que pueden estar envueltas en 'data'
type ApiResponse<T> = T | { data: T };

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getMisVehiculos(): Observable<ApiResponse<Vehiculo[]>> {
    return this.http.get<ApiResponse<Vehiculo[]>>(`${this.apiUrl}/mis-vehiculos`);
  }

  getVehiculosPorUsuario(userId: string | number): Observable<ApiResponse<Vehiculo[]>> {
    return this.http.get<ApiResponse<Vehiculo[]>>(`${this.apiUrl}/vehiculos?usuario_id=${userId}`);
  }

  getSeguimientoVehiculo(vehiculoId: number): Observable<ApiResponse<Seguimiento>> {
    return this.http.get<ApiResponse<Seguimiento>>(`${this.apiUrl}/vehiculos/${vehiculoId}/seguimiento`);
  }
}