import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { Mecanico } from '../models/mecanico.model';

@Component({
  selector: 'app-mecanicos',
  imports: [CommonModule],
  templateUrl: './mecanicos.html',
  styleUrl: './mecanicos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Mecanicos implements OnInit {
  private adminService = inject(AdminService);

  // State
  private allMecanicos = signal<Mecanico[]>([]);
  public loading = signal(true);
  public error = signal<string | null>(null);

  // Filters
  public filtroNombre = signal<string>('');
  public filtroTipoDoc = signal<string>('');
  public filtroEstado = signal<string>(''); // 'activo', 'inactivo', o '' para todos
  public filtroEspecialidad = signal<string>('');

  public readonly tiposDocumento: ('DNI' | 'RUC' | 'CE' | 'PAS')[] = [
    'DNI',
    'RUC',
    'CE',
    'PAS',
  ];
  public readonly estados = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
  ];

  // Computed list of mechanics
  public mecanicos = computed(() => {
    const nombre = this.filtroNombre().toLowerCase().trim();
    const tipoDoc = this.filtroTipoDoc();
    const estado = this.filtroEstado();
    const especialidad = this.filtroEspecialidad().toLowerCase().trim();

    return this.allMecanicos().filter((mecanico) => {
      const u = mecanico.usuario;
      const matchNombre =
        !nombre ||
        (u?.nombre || '').toLowerCase().includes(nombre) ||
        (u?.numero_documento || '').includes(nombre);
      const matchTipoDoc = !tipoDoc || u?.tipo_documento?.abreviatura === tipoDoc;
      const matchEstado =
        !estado || (u ? (estado === 'activo' ? u.activo : !u.activo) : false);
      const matchEspecialidad =
        !especialidad ||
        mecanico.especialidad.toLowerCase().includes(especialidad);

      return matchNombre && matchTipoDoc && matchEstado && matchEspecialidad;
    });
  });

  ngOnInit(): void {
    this.loadMecanicos();
  }

  loadMecanicos(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getMecanicos().subscribe({
      next: (response: any) => {
        const data = Array.isArray(response) ? response : (response?.data || []);
        this.allMecanicos.set(data as Mecanico[]);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar los mecánicos:', err);
        this.error.set(
          'No se pudieron cargar los mecánicos. Verifica la conexión.'
        );
        this.loading.set(false);
      },
    });
  }

  // --- Filter Handlers ---
  onFiltroNombreChange(event: Event): void {
    this.filtroNombre.set((event.target as HTMLInputElement).value);
  }

  onFiltroTipoDocChange(event: Event): void {
    this.filtroTipoDoc.set((event.target as HTMLSelectElement).value);
  }

  onFiltroEstadoChange(event: Event): void {
    this.filtroEstado.set((event.target as HTMLSelectElement).value);
  }

  onFiltroEspecialidadChange(event: Event): void {
    this.filtroEspecialidad.set((event.target as HTMLInputElement).value);
  }

  clearFilters(): void {
    this.filtroNombre.set('');
    this.filtroTipoDoc.set('');
    this.filtroEstado.set('');
    this.filtroEspecialidad.set('');
  }

  // --- Actions ---
  toggleActivo(usuarioId: number): void {
    this.adminService.toggleUsuarioActivo(usuarioId).subscribe({
      next: (response) => {
        this.allMecanicos.update((mecanicos) =>
          mecanicos.map((mecanico) =>
            mecanico.usuario?.id === usuarioId
              ? {
                  ...mecanico,
                  usuario: { ...mecanico.usuario, activo: response.activo },
                }
              : mecanico
          )
        );
      },
      error: (err) => {
        console.error('Error al cambiar estado del mecánico:', err);
        alert('No se pudo cambiar el estado del mecánico.');
      },
    });
  }

  deleteMecanico(usuarioId: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este mecánico?')) {
      this.adminService.deleteUsuario(usuarioId).subscribe({
        next: () => {
          this.allMecanicos.update((mecanicos) => mecanicos.filter((m) => m.usuario?.id !== usuarioId));
          alert('Mecánico eliminado exitosamente.');
        },
        error: () => alert('No se pudo eliminar el mecánico.')
      });
    }
  }
}