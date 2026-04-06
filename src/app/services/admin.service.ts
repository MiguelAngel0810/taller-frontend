import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Mecanico } from '../pages/models/mecanico.model';
import { OrdenServicio } from '../pages/models/orden-servicio.model';
import { Role } from '../pages/models/role.model';
import { Usuario } from '../pages/models/usuario.model';
import { Vehiculo } from '../pages/models/vehiculo.model';
import { TipoDocumento } from '../pages/models/tipo-documento.model';
import { Cliente } from '../pages/models/cliente.model';
import { environment } from '../../environment';

// Definición de tipos para las respuestas de la API fuera de la clase
type ApiResponse<T> = T | { data: T };
type NestedApiResponse<T> = T | { data: T } | { data: { data: T } };

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  // Helper privado para extraer datos de forma robusta (maneja paginación y recursos de Laravel)
  private extractData<T>(res: any): T[] {
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
    // Fallback por si la clave es diferente (ej. res.usuarios)
    const firstKeyAsArray = Object.values(res).find(v => Array.isArray(v));
    return Array.isArray(firstKeyAsArray) ? firstKeyAsArray : [];
  }

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<any>(`${this.apiUrl}/usuarios`).pipe(
      map(res => this.extractData<Usuario>(res))
    );
  }

  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/usuarios/${id}`);
  }

  createUsuario(usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios`, usuario);
  }

  toggleUsuarioActivo(id: number): Observable<{ activo: boolean }> {
    return this.http.patch<{ activo: boolean }>(`${this.apiUrl}/usuarios/${id}/toggle-activo`, {});
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<any>(`${this.apiUrl}/roles`).pipe(
      map(res => this.extractData<Role>(res))
    );
  }

  getTiposDocumento(): Observable<TipoDocumento[]> {
    return this.http.get<any>(`${this.apiUrl}/tipos-documento`).pipe(
      map(res => this.extractData<TipoDocumento>(res))
    );
  }

  getVehiculos(): Observable<Vehiculo[]> {
    return this.http.get<any>(`${this.apiUrl}/vehiculos`).pipe(
      map(res => this.extractData<Vehiculo>(res))
    );
  }

  deleteVehiculo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vehiculos/${id}`);
  }

  createVehiculo(vehiculo: any): Observable<Vehiculo> {
    return this.http.post<ApiResponse<Vehiculo>>(`${this.apiUrl}/vehiculos`, vehiculo).pipe(
      map(res => ('data' in res && res.data) ? res.data : res as Vehiculo)
    );
  }

  getMecanicos(): Observable<Mecanico[]> {
    return this.http.get<any>(`${this.apiUrl}/mecanicos`).pipe(
      map(res => this.extractData<Mecanico>(res))
    );
  }

  createOrden(orden: any): Observable<OrdenServicio> {
    return this.http.post<ApiResponse<OrdenServicio>>(`${this.apiUrl}/ordenes`, orden).pipe(
      map(res => ('data' in res && res.data) ? res.data : res as OrdenServicio)
    );
  }

  getOrdenes(): Observable<OrdenServicio[]> {
    return this.http.get<any>(`${this.apiUrl}/ordenes-servicio`).pipe(
      map(res => this.extractData<OrdenServicio>(res))
    );
  }

  consultarDocumento(id_tipo_documento: number, numero: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/consulta-documento`, { id_tipo_documento, numero });
  }

  validarDiagnostico(idOrden: number, estado: 'aprobado' | 'aclaracion'): Observable<any> {
    return this.http.post(`${this.apiUrl}/etapa-servicio/validar-diagnostico/${idOrden}`, { estado });
  }

  updateEstadoEtapa(idEtapa: number, estado: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/etapa-servicio/${idEtapa}`, { estado });
  }

  updateEstadoOrden(idOrden: number, estado: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/ordenes/${idOrden}`, { estado });
  }

  getClientes(): Observable<Cliente[]> {
    return this.http.get<any>(`${this.apiUrl}/clientes`).pipe(
      map(res => this.extractData<Cliente>(res))
    );
  }
  updateVehiculo(id: number, data: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/vehiculos/${id}?_method=PUT`, data);
  }
}