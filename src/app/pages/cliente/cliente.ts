import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  PLATFORM_ID,
  computed,
  effect,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ClienteService, Seguimiento } from '../../services/cliente.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { Vehiculo } from '../models/vehiculo.model';

@Component({
  selector: 'app-cliente',
  imports: [CommonModule, DatePipe],
  templateUrl: './cliente.html',
  styleUrl: './cliente.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cliente implements OnInit {
  // Inyección de dependencias moderna con inject()
  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private pushService = inject(PushNotificationService);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    // Efecto reactivo para actualizar la vista cuando llega una notificación de orden
    effect(() => {
      const ordenId = this.pushService.pendingOrdenId();
      const currentVehiculo = this.selectedVehiculo();
      
      if (ordenId && currentVehiculo) {
        // Refrescamos el seguimiento si hay una notificación pendiente
        this.loadSeguimiento(currentVehiculo.id);
        this.pushService.pendingOrdenId.set(null); // Consumimos la señal
      }
    });
  }

  // Estado del componente gestionado con Signals para reactividad optimizada
  public userName = signal<string | null>(null);
  public vehiculos = signal<Vehiculo[]>([]);
  public selectedVehiculo = signal<Vehiculo | null>(null);
  public seguimiento = signal<Seguimiento | null>(null);
  public loadingVehiculos = signal(true);
  public loadingSeguimiento = signal(false);
  public error = signal<string | null>(null);

  // Nueva señal para manejar la vista (Dashboard vs Servicios)
  public activeTab = signal<'garaje' | 'servicios'>('garaje');

  // Lista de servicios de la empresa (Catálogo)
  public catalogoServicios = signal([
    { id: 1, nombre: 'Mantenimiento Preventivo', descripcion: 'Cambio de aceite, filtros y revisión general.', precio: 'S/ 150', icono: '🛠️' },
    { id: 2, nombre: 'Alineamiento y Balanceo', descripcion: 'Optimiza la dirección y el desgaste de llantas.', precio: 'S/ 80', icono: '🛞' },
    { id: 3, nombre: 'Escaneo Electrónico', descripcion: 'Diagnóstico computarizado de fallas de motor.', precio: 'S/ 100', icono: '💻' },
    { id: 4, nombre: 'Sistema de Frenos', descripcion: 'Cambio de pastillas y rectificación de discos.', precio: 'S/ 120', icono: '🛑' }
  ]);

  // Contador de seguimientos pendientes derivado
  public pendientesCount = computed(() => {
    const vehiculos = this.vehiculos();
    let total = 0;
    vehiculos.forEach(v => {
      // Una orden se considera pendiente si no ha llegado al estado final de 'finalizado'
      const pendientes = v.ordenes?.filter(o => 
        o.estado !== 'finalizado'
      ).length ?? 0;
      total += pendientes;
    });
    return total;
  });

  ngOnInit(): void {
    this.userName.set(this.authService.getUserName());
    if (isPlatformBrowser(this.platformId)) {
      this.loadVehiculos();
    }
  }

  loadVehiculos(): void {
    this.loadingVehiculos.set(true);
    this.error.set(null);
    this.clienteService.getMisVehiculos().subscribe({
      next: (response) => {
        // La respuesta del backend puede venir envuelta en una propiedad 'data'.
        // Usamos el operador 'in' como type guard para verificar si la propiedad 'data' existe.
        const data = 'data' in response ? response.data : response;
        if (Array.isArray(data)) {
          this.vehiculos.set(data);
        } else {
          console.warn('La respuesta de vehículos no es un array:', response);
          this.vehiculos.set([]);
        }
        this.loadingVehiculos.set(false);
      },
      error: (err) => {
        console.error('Error al cargar los vehículos:', err);
        this.error.set(
          'No se pudieron cargar tus vehículos. Inténtalo de nuevo más tarde.'
        );
        this.loadingVehiculos.set(false);
      },
    });
  }

  selectVehiculo(vehiculo: Vehiculo): void {
    this.selectedVehiculo.set(vehiculo);
    this.seguimiento.set(null); // Limpia la información de seguimiento anterior
    this.loadSeguimiento(vehiculo.id);
  }

  loadSeguimiento(vehiculoId: number): void {
    this.loadingSeguimiento.set(true);
    this.error.set(null);
    this.clienteService.getSeguimientoVehiculo(vehiculoId).subscribe({
      next: (response) => {
        // La respuesta del backend puede venir envuelta en una propiedad 'data'.
        // Usamos el operador 'in' como type guard para verificar de forma segura si la propiedad 'data' existe.
        this.seguimiento.set('data' in response ? response.data : response);
        this.loadingSeguimiento.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el seguimiento:', err);
        // Se añade un manejo de errores más específico y amigable para el usuario.
        if (err.status === 403) {
          this.error.set('No tienes permiso para ver el seguimiento de este vehículo.');
        } else {
          this.error.set('No se pudo cargar el seguimiento. Inténtalo de nuevo más tarde.');
        }
        this.seguimiento.set(null);
        this.loadingSeguimiento.set(false);
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
