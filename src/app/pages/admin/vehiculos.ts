import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AdminService } from '../../services/admin.service';
import { Vehiculo } from '../models/vehiculo.model';
import { Usuario } from '../models/usuario.model';
import { Cliente } from '../models/cliente.model';
import { environment } from '../../../environment'; // Ajusta la ruta si tu archivo environment.ts está en otro lugar

@Component({
  selector: 'app-vehiculos',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehiculos.html',
  styleUrl: './vehiculos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vehiculos implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  // State
  private allVehiculos = signal<Vehiculo[]>([]);
  public allClientes = signal<Cliente[]>([]);
  public loading = signal(true);
  public error = signal<string | null>(null);
  public showForm = signal(false);
  public imageBaseUrl = environment.imageStorageUrl; // URL base para las imágenes
  public isEditing = signal(false);
  public currentVehiculoId = signal<number | null>(null);
  private selectedFile: File | null = null;

  // Formulario reactivo
  public vehiculoForm = this.fb.group({
    id_cliente: ['', Validators.required],
    marca: ['', [Validators.required, Validators.maxLength(50)]],
    modelo: ['', [Validators.required, Validators.maxLength(50)]],
    anio: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
    placa: ['', [Validators.required, Validators.maxLength(7), Validators.pattern(/^[A-Z0-9-]+$/i)]],
    imagen: [null],
  });

  // Filter
  public filtroBusqueda = signal<string>('');

  // Computed list of vehicles
  public vehiculos = computed(() => {
    const filtro = this.filtroBusqueda().toLowerCase().trim();
    if (!filtro) {
      return this.allVehiculos();
    }

    return this.allVehiculos().filter(
      (v) =>
        v.marca.toLowerCase().includes(filtro) ||
        v.modelo.toLowerCase().includes(filtro) ||
        v.placa.toLowerCase().includes(filtro) ||
        (v.cliente?.usuario?.nombre || '').toLowerCase().includes(filtro)
    );
  });

  ngOnInit(): void {
    this.loadVehiculos();
    this.loadClientes();
  }

  loadVehiculos(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getVehiculos().subscribe({
      next: (vehiculos) => {
        console.log('Vehículos recibidos:', vehiculos);
        this.allVehiculos.set(vehiculos);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar los vehículos:', err);
        this.error.set(
          'No se pudieron cargar los vehículos. Verifica la conexión.'
        );
        this.loading.set(false);
      },
    });
  }

  loadClientes(): void {
    this.adminService.getClientes().subscribe({
      next: (data) => {
        this.allClientes.set(data);
      },
      error: (err) => console.error('Error al cargar clientes:', err)
    });
  }

  toggleForm(): void {
    this.selectedFile = null;
    this.isEditing.set(false);
    this.currentVehiculoId.set(null);
    this.vehiculoForm.get('id_cliente')?.enable();
    this.showForm.update(v => !v);
    if (!this.showForm()) this.vehiculoForm.reset();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  editVehiculo(vehiculo: Vehiculo): void {
    this.isEditing.set(true);
    this.currentVehiculoId.set(vehiculo.id);
    
    this.vehiculoForm.patchValue({
      id_cliente: String(vehiculo.id_cliente),
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: String(vehiculo.anio),
      placa: vehiculo.placa,
    });

    this.vehiculoForm.get('id_cliente')?.disable(); // El propietario no se edita
    this.showForm.set(true);
  }

  saveVehiculo(): void {
    if (this.vehiculoForm.invalid) {
      this.vehiculoForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.vehiculoForm.getRawValue();
    
    // Usamos FormData para poder enviar el archivo al backend
    const formData = new FormData();
    formData.append('id_cliente', String(formValue.id_cliente));
    formData.append('marca', formValue.marca ?? '');
    formData.append('modelo', formValue.modelo ?? '');
    formData.append('anio', String(formValue.anio));
    formData.append('placa', (formValue.placa ?? '').toUpperCase());
    
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }
    
    // Decidimos si crear o actualizar
    const request = this.isEditing() 
      ? this.adminService.updateVehiculo(this.currentVehiculoId()!, formData)
      : this.adminService.createVehiculo(formData);

    request.subscribe({
      next: () => {
        Swal.fire({
          title: '¡Éxito!',
          text: this.isEditing() ? 'Vehículo actualizado correctamente' : 'Vehículo registrado correctamente',
          icon: 'success',
          confirmButtonColor: '#198754'
        });
        this.loadVehiculos();
        this.toggleForm();
      },
      error: (err: HttpErrorResponse) => {
        const action = this.isEditing() ? 'actualizar' : 'registrar';
        console.error(`Error al ${action} vehículo:`, err);

        let errorMsg = 'No se pudo registrar el vehículo.';
        if (err.status === 422) {
          // Si el backend indica que el id_cliente es inválido específicamente
          if (err.error?.message?.includes('id cliente')) {
            errorMsg = 'El cliente seleccionado no es válido en el sistema.';
          } else if (err.error?.errors) {
            // Errores de validación generales
          errorMsg = Object.values(err.error.errors).flat().join(' ');
          }
        } else {
          // Aseguramos que errorMsg sea siempre un string para evitar errores en SweetAlert
          if (typeof err.error === 'string') {
            errorMsg = err.error;
          } else if (err.error?.message && typeof err.error.message === 'string') {
            errorMsg = err.error.message;
          } else {
            errorMsg = err.message || errorMsg;
          }
        }

        Swal.fire('Error', errorMsg, 'error');
        this.loading.set(false);
      }
    });
  }

  onFiltroChange(event: Event): void {
    this.filtroBusqueda.set((event.target as HTMLInputElement).value);
  }

  clearFilter(): void {
    this.filtroBusqueda.set('');
  }

  deleteVehiculo(id: number): void {
    Swal.fire({
      title: '¿Eliminar vehículo?',
      text: 'Esta acción no se puede deshacer y borrará el historial asociado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.adminService.deleteVehiculo(id).subscribe({
          next: () => {
            this.allVehiculos.update((vehiculos) =>
              vehiculos.filter((v) => v.id !== id)
            );
            Swal.fire('Eliminado', 'Vehículo borrado correctamente', 'success');
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el vehículo', 'error'),
        });
      }
    });
  }

  // Helper to get owner name safely
  getPropietarioNombre(vehiculo: Vehiculo): string {
    return vehiculo.cliente?.usuario?.nombre ?? 'N/A';
  }

  /**
   * Construye la URL completa para la imagen del vehículo.
   * @param imageName El nombre o ruta relativa de la imagen.
   */
  getImageUrl(imageName: string): string {
    return `${this.imageBaseUrl}/${imageName}`;
  }
}