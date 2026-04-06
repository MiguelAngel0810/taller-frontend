import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { OrdenServicio } from '../pages/models/orden-servicio.model';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class MecanicoService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getMisOrdenes(): Observable<OrdenServicio[]> {
    return this.http.get<any>(`${this.apiUrl}/mis-ordenes`).pipe(
      map(res => {
        // Verificación en cascada para encontrar el array de datos
        if (Array.isArray(res)) return res;
        if (res.data && Array.isArray(res.data)) return res.data;
        if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
        return [];
      })
    );
  }
}