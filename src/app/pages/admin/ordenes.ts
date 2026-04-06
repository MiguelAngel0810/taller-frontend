import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import Swal from 'sweetalert2';
import { AdminService } from '../../services/admin.service';
import { OrdenServicio } from '../models/orden-servicio.model';
import { Mecanico } from '../models/mecanico.model';
import { Vehiculo } from '../models/vehiculo.model';

@Component({
  selector: 'app-ordenes',
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './ordenes.html',/*  */
  styleUrl: './ordenes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ordenes implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  // State
  private allOrdenes = signal<OrdenServicio[]>([]);
  public allMecanicos = signal<Mecanico[]>([]); 
  public allVehiculos = signal<Vehiculo[]>([]);
  public loading = signal(true);
  public error = signal<string | null>(null);
  public showForm = signal(false);
  public showDetail = signal(false);
  public selectedOrden = signal<OrdenServicio | null>(null);

  // Filters
  public filtroBusqueda = signal<string>('');
  public filtroEstado = signal<string>('');

  // Formulario para nueva orden
  public ordenForm = this.fb.group({
    id_vehiculo: ['', Validators.required],
    id_mecanico: ['', Validators.required],
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', Validators.required],
    fecha_inicio: ['', [Validators.required, this.minDateTodayValidator()]],
    fecha_fin: ['', [Validators.required, this.maxDateTwoMonthsValidator()]]
  });

  // Mantenemos esto para validaciones si fuera necesario, pero usaremos allVehiculos en el HTML
  public vehiculosDisponibles = computed(() => {
    const lista = this.allVehiculos();
    console.log('Calculando vehículos disponibles de una lista de:', lista.length);
    return lista.filter(v => {
      if (!v.ordenes || v.ordenes.length === 0) return true;
      return !this.estaOcupado(v);
    });
  });

  // Helper para verificar disponibilidad de forma segura
  public estaOcupado(v: Vehiculo): boolean {
    if (!v.ordenes || v.ordenes.length === 0) return false;
    return v.ordenes.some(o => {
      const estado = (o.estado || '').toLowerCase();
      // Si el estado NO es finalizado ni cancelado, el vehículo está ocupado
      return estado !== 'finalizado' && estado !== 'cancelado' && estado !== 'completado';
    });
  }

  public readonly estados = [
    { value: 'diagnostico', label: 'Diagnóstico' },
    { value: 'reparacion', label: 'Reparación' },
    { value: 'pruebas', label: 'Pruebas' },
    { value: 'finalizacion', label: 'Finalización' },
    { value: 'pausado', label: 'Pausado' },
    { value: 'finalizado', label: 'Finalizado' },
  ];

  // Computed list of orders
  public ordenes = computed(() => {
    const busqueda = this.filtroBusqueda().toLowerCase().trim();
    const estado = this.filtroEstado();

    return this.allOrdenes().filter((orden) => {
      const v = orden.vehiculo;
      const c = v?.cliente?.usuario;
      
      const matchBusqueda =
        !busqueda ||
        orden.id.toString().includes(busqueda) ||
        orden.titulo.toLowerCase().includes(busqueda) ||
        (v?.placa.toLowerCase().includes(busqueda) ?? false) ||
        (v?.marca.toLowerCase().includes(busqueda) ?? false) ||
        (c?.nombre.toLowerCase().includes(busqueda) ?? false);

      const matchEstado = !estado || this.getEtapaKey(orden).toLowerCase() === estado.toLowerCase();

      return matchBusqueda && matchEstado;
    });
  });

  ngOnInit(): void {
    this.loadOrdenes();
    this.loadMecanicos(); // Cargamos los mecánicos independientemente
    this.loadVehiculos();
  }

  loadOrdenes(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getOrdenes().subscribe({
      next: (data: OrdenServicio[]) => {
        this.allOrdenes.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar las órdenes:', err);
        this.error.set(
          'No se pudieron cargar las órdenes de servicio. Verifica la conexión.'
        );
        this.loading.set(false);
      },
    });
  }

  loadMecanicos(): void {
    this.adminService.getMecanicos().subscribe({
      next: (data) => this.allMecanicos.set(data),
      error: (err) => console.error('Error al cargar mecánicos:', err)
    });
  }

  loadVehiculos(): void {
    this.adminService.getVehiculos().subscribe({
      next: (data) => {
        console.log('Órdenes - Vehículos brutos recibidos:', data);
        this.allVehiculos.set(data);
      },
      error: (err) => console.error('Error al cargar vehículos:', err)
    });
  }

  toggleForm(): void {
    this.showForm.update(v => !v);
    if (!this.showForm()) this.ordenForm.reset();
  }

  verDetalle(orden: OrdenServicio): void {
    this.selectedOrden.set(orden);
    this.showDetail.set(true);
  }

  cerrarDetalle(): void {
    this.showDetail.set(false);
    this.selectedOrden.set(null);
  }

  crearOrden(): void {
    if (this.ordenForm.invalid) {
      this.ordenForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    
    // Preparamos el objeto asegurando que los IDs sean números
    const formValue = this.ordenForm.getRawValue();
    const nuevaOrden = {
      ...formValue,
      id_vehiculo: Number(formValue.id_vehiculo),
      id_mecanico: Number(formValue.id_mecanico),
      estado: 'diagnostico', // La orden inicia en etapa de diagnóstico
      validacion_diagnostico: 'en_espera'
    };
    
    console.log('Enviando datos al servidor:', nuevaOrden);

    this.adminService.createOrden(nuevaOrden).subscribe({
      next: () => {
        this.loading.set(false);
        this.ordenForm.reset();
        this.showForm.set(false);
        Swal.fire({
          title: "¡Orden agregada con éxito!",
          icon: "success",
          draggable: true
        });
        this.loadOrdenes();
      },
      error: (err) => {
        console.error('Error al crear orden:', err);
        this.loading.set(false);
        
        // Capturamos el mensaje específico del backend
        const apiError = err.error?.error || err.error?.message || 'Ocurrió un error inesperado.';
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: apiError,
          footer: '<a href="#">Why do I have this issue?</a>'
        });
      }
    });
  }

  /**
   * Lógica de validación de diagnóstico integrada
   */
  validarDiagnostico(idOrden: number, esAclaracion: boolean = false): void {
    const title = esAclaracion ? '¿Confirmar aclaración solucionada?' : '¿Confirmar aprobación presencial?';
    const text = esAclaracion 
      ? "Se marcará la aclaración como solucionada y se procederá a la reparación."
      : "Se aprobará el diagnóstico y se procederá a la etapa de reparación.";

    Swal.fire({
      title: title,
      text: text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, aprobar diagnóstico',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Primero actualizamos el estado de validación del diagnóstico
        this.adminService.validarDiagnostico(idOrden, 'aprobado').subscribe({ 
          next: () => {
            Swal.fire('¡Hecho!', 'El diagnóstico ha sido validado. La orden avanzará según el flujo del taller.', 'success');
            this.cerrarDetalle();
            this.loadOrdenes(); // Recargar la tabla para ver los cambios
          },
          error: (err) => {
            Swal.fire('Error', err.error?.error || 'No se pudo completar la validación del diagnóstico.', 'error');
          }
        });
      }
    });
  }

  /**
   * Avanza la orden a la siguiente etapa lógica
   */
  avanzarEtapa(idOrden: number, etapaActual: string): void {
    const orden = this.selectedOrden();
    if (!orden || !orden.etapas) return;

    // Buscamos el objeto de la etapa actual que está en proceso para obtener su ID real
    const etapaObj = orden.etapas.find(e => e.etapa === etapaActual && e.estado === 'en_proceso');
    
    if (!etapaObj) {
      Swal.fire('Atención', 'No se encontró la etapa activa correspondiente.', 'warning');
      return;
    }

    Swal.fire({
      title: `¿Completar etapa de ${etapaActual}?`,
      text: `Se marcará como completada para avanzar en el flujo de trabajo.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#198754',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, completar etapa`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.updateEstadoEtapa(etapaObj.id, 'completado').subscribe({
          next: () => {
            Swal.fire('¡Hecho!', `La etapa ha sido completada satisfactoriamente.`, 'success');
            this.cerrarDetalle();
            this.loadOrdenes();
          },
          error: (err) => {
            Swal.fire('Error', err.error?.error || 'No se pudo completar la etapa.', 'error');
          }
        });
      }
    });
  }

  private minDateTodayValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(control.value + 'T00:00:00'); // Evita desfase de zona horaria
      return inputDate < today ? { minDate: true } : null;
    };
  }

  private maxDateTwoMonthsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 2);
      const inputDate = new Date(control.value + 'T00:00:00');
      return inputDate > maxDate ? { maxDate: true } : null;
    };
  }

  onFiltroBusquedaChange(event: Event): void {
    this.filtroBusqueda.set((event.target as HTMLInputElement).value);
  }

  onFiltroEstadoChange(event: Event): void {
    this.filtroEstado.set((event.target as HTMLSelectElement).value);
  }

  clearFilters(): void {
    this.filtroBusqueda.set('');
    this.filtroEstado.set('');
  }

  getMecanicoNombre(orden: OrdenServicio): string {
    // 1. Intentamos leer el dato directo si el backend lo trajo
    if (orden.mecanico?.usuario?.nombre) {
      return orden.mecanico.usuario.nombre;
    }
    // 2. Si falta, buscamos en nuestra lista local de mecánicos
    const raw = orden as any;
    // Buscamos el ID en todas las ubicaciones posibles
    let idBusqueda = orden.mecanico?.id 
      || raw.id_mecanico 
      || raw.mecanico_id 
      || raw.mecanicoId; // A veces viene en camelCase

    // Si orden.mecanico es un número (ID directo), lo usamos
    if (!idBusqueda && typeof orden.mecanico === 'number') {
      idBusqueda = orden.mecanico;
    }

    if (idBusqueda) {
      const listaMecanicos = this.allMecanicos();
      // Usamos == para comparar (string vs number) por seguridad
      // Intentamos encontrar por ID de tabla Mecanico (lo estándar)
      let encontrado = listaMecanicos.find(m => m.id == idBusqueda);
      // Si no aparece, intentamos ver si el ID guardado era el ID de Usuario (fallback común)
      if (!encontrado) encontrado = listaMecanicos.find(m => m.id_usuario == idBusqueda);

      return encontrado?.usuario?.nombre || 'Sin asignar';
    }
    return 'Sin asignar';
  }

  getClienteNombre(orden: OrdenServicio): string {
    return orden.vehiculo?.cliente?.usuario?.nombre ?? 'N/A';
  }

  /**
   * Helper para obtener la clave de la etapa actual de forma robusta
   */
  public getEtapaKey(orden: OrdenServicio): string {
    const estado = (orden.estado || '').toLowerCase();
    if (estado === 'finalizado' || estado === 'pausado') return estado;
    
    // Prioridad: Buscar en el array de etapas la que esté activamente "en_proceso"
    const etapaActiva = orden.etapas?.find(e => e.estado === 'en_proceso');
    if (etapaActiva) return etapaActiva.etapa;

    // Fallback: Si el estado principal es una etapa válida, la usamos
    if (['diagnostico', 'reparacion', 'pruebas', 'finalizacion'].includes(estado)) {
      return estado;
    }

    // Si el estado es 'en_proceso' pero no hay etapas definidas aún, asumimos inicio
    return 'diagnostico'; 
  }

  getEtapaActualLabel(orden: OrdenServicio): string {
    const etapa = this.getEtapaKey(orden);
    
    switch (etapa) {
      case 'diagnostico':
        if (orden.validacion_diagnostico === 'en_espera') return 'En Diagnóstico (Pendiente Cliente)';
        if (orden.validacion_diagnostico === 'aclaracion') return 'En Diagnóstico (Aclaración Cliente)';
        return 'Diagnóstico Aprobado';
      case 'reparacion': return 'En Reparación';
      case 'pruebas': return 'En Pruebas';
      case 'finalizacion': return 'En Finalización';
      case 'finalizado': return 'Finalizado';
      case 'pausado': return 'Pausado';
      default: return 'En Proceso';
    }
  }

  getEtapaColorClass(orden: OrdenServicio): string {
    const etapa = this.getEtapaKey(orden);
    switch (etapa) {
      case 'diagnostico':
        if (orden.validacion_diagnostico === 'en_espera') return 'bg-info text-dark';
        if (orden.validacion_diagnostico === 'aclaracion') return 'bg-warning text-dark';
        return 'bg-primary'; // Diagnóstico aprobado, listo para reparación
      case 'reparacion':
        return 'bg-primary';
      case 'pruebas':
        return 'bg-info text-dark';
      case 'finalizacion':
        return 'bg-warning text-dark';
      case 'finalizado':
        return 'bg-success';
      case 'pausado':
        return 'bg-secondary';
      default:
        return 'bg-light text-dark';
    }
  }
}