import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ChangeDetectorRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AdminService } from '../../services/admin.service';
import { TipoDocumento } from '../models/tipo-documento.model';
import { Usuario } from '../models/usuario.model';
import { Role } from '../models/role.model';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Usuarios implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  // State
  private allUsers = signal<Usuario[]>([]);
  public roles = signal<Role[]>([]);
  public tiposDocumento = signal<TipoDocumento[]>([]);
  public loading = signal(true);
  public loadingConsulta = signal(false);
  public error = signal<string | null>(null);
  public showForm = signal(false);

  // Filters
  public filtroNombre = signal<string>('');
  public filtroRol = signal<string>('');
  public filtroEstado = signal<string>(''); // 'activo', 'inactivo', o '' para todos

  public readonly estados = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
  ];

  // Formulario
  public usuarioForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    telefono: [''],
    id_rol: ['', Validators.required],
    id_tipo_documento: ['', Validators.required],
    numero_documento: ['', Validators.required],
    direccion: [''],
    especialidad: [''], // Campo dinámico
  });

  // Computed list of users
  public usuarios = computed(() => {
    const nombre = this.filtroNombre().toLowerCase().trim();
    const rolId = this.filtroRol();
    const estado = this.filtroEstado();

    return this.allUsers().filter((user) => {
      const matchNombre =
        !nombre ||
        user.nombre.toLowerCase().includes(nombre) ||
        user.correo.toLowerCase().includes(nombre);
      const matchRol = !rolId || user.id_rol === Number(rolId);
      const matchEstado =
        !estado || (estado === 'activo' ? user.activo : !user.activo);

      return matchNombre && matchRol && matchEstado;
    });
  });

  // Computed para verificar si el rol seleccionado es mecánico
  public esMecanicoSeleccionado = computed(() => {
    const rolId = this.usuarioForm.get('id_rol')?.value;
    if (!rolId) return false;
    const rol = this.roles().find(r => r.id === Number(rolId));
    return rol?.nombre.toUpperCase() === 'MECANICO' || rol?.nombre.toUpperCase() === 'MECÁNICO';
  });

  ngOnInit(): void {
    this.loadUsuarios();
    this.loadRoles();
    this.loadTiposDocumento();

    // Listener para cambiar validaciones de especialidad dinámicamente según el rol
    this.usuarioForm.get('id_rol')?.valueChanges.subscribe(() => {
      const especialidadControl = this.usuarioForm.get('especialidad');
      if (this.esMecanicoSeleccionado()) {
        especialidadControl?.setValidators([Validators.required]);
      } else {
        especialidadControl?.clearValidators();
        especialidadControl?.setValue('');
      }
      especialidadControl?.updateValueAndValidity();
    });
  }

  loadUsuarios(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getUsuarios().subscribe({
      next: (data: Usuario[]) => {
        this.allUsers.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar los usuarios:', err);
        this.error.set(
          'No se pudieron cargar los usuarios. Verifica la conexión.'
        );
        this.loading.set(false);
      },
    });
  }

  loadRoles(): void {
    this.adminService.getRoles().subscribe({
      next: (data: Role[]) => this.roles.set(data),
      error: (err) => console.error('Error al cargar roles:', err),
    });
  }

  loadTiposDocumento(): void {
    this.adminService.getTiposDocumento().subscribe({
      next: (data: TipoDocumento[]) => this.tiposDocumento.set(data),
      error: (err) => {
        console.error('Error al cargar tipos de documento:', err);
        // Fallback: Cargamos datos por defecto si la API falla (404)
        this.tiposDocumento.set([
          { id: 1, nombre: 'DNI', abreviatura: 'DNI' },
          { id: 2, nombre: 'RUC', abreviatura: 'RUC' },
          { id: 3, nombre: 'CE', abreviatura: 'CE' },
          { id: 4, nombre: 'PASAPORTE', abreviatura: 'PAS' }
        ]);
      },
    });
  }

  // Helper para mostrar el nombre del rol en el título del formulario
  public getRolNombre(): string {
    const rolId = this.usuarioForm.get('id_rol')?.value;
    const rol = this.roles().find(r => r.id === Number(rolId));
    return rol?.nombre || 'Usuario';
  }

  // Helper para saber qué tipo de documento está seleccionado actualmente
  public getAbreviaturaSeleccionada(): string {
    const id = this.usuarioForm.get('id_tipo_documento')?.value;
    if (!id) return '';
    const tipo = this.tiposDocumento().find(t => t.id === Number(id));
    return tipo?.abreviatura.toUpperCase() || '';
  }

  consultarDocumento(): void {
    const id_tipo_documento = Number(this.usuarioForm.get('id_tipo_documento')?.value);
    const numero = this.usuarioForm.get('numero_documento')?.value;
    const tipo = this.getAbreviaturaSeleccionada();

    if (!numero || numero.length < 8) {
      Swal.fire('Atención', 'Ingrese un número de documento válido.', 'warning');
      return;
    }

    this.loadingConsulta.set(true);
    this.adminService.consultarDocumento(id_tipo_documento, numero).subscribe({
      next: (res: any) => {
        console.log('Respuesta de API de consulta:', res);
        this.loadingConsulta.set(false);
        if (res.success && res.data) {
          this.usuarioForm.patchValue({ 
            nombre: res.data.nombre,
            direccion: res.data.direccion || ''
          });
          // Forzamos a OnPush a revisar el formulario
          this.cdr.markForCheck();
          
          Swal.fire({
            icon: 'success',
            title: `${tipo} Encontrado`,
            text: res.data.nombre,
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.fire('No encontrado', 'No se obtuvieron datos para este documento.', 'info');
        }
      },
      error: (err) => {
        this.loadingConsulta.set(false);
        const errorMsg = err.error?.error || 'Error al conectar con el servicio de consulta.';
        Swal.fire('Error', errorMsg, 'error');
      }
    });
  }

  // --- Filter Handlers ---
  onFiltroNombreChange(event: Event): void {
    this.filtroNombre.set((event.target as HTMLInputElement).value);
  }

  onFiltroRolChange(event: Event): void {
    this.filtroRol.set((event.target as HTMLSelectElement).value);
  }

  onFiltroEstadoChange(event: Event): void {
    this.filtroEstado.set((event.target as HTMLSelectElement).value);
  }

  clearFilters(): void {
    this.filtroNombre.set('');
    this.filtroRol.set('');
    this.filtroEstado.set('');
  }

  // --- Actions ---
  toggleForm(): void {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.usuarioForm.reset({ id_rol: '', id_tipo_documento: '' });
    }
  }

  saveUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    // Extraemos especialidad por separado para manejar la lógica condicional sin 'delete'
    const { especialidad, ...formValue } = this.usuarioForm.getRawValue();
    
    // Preparamos el payload convirtiendo IDs a números para el backend
    const payload = {
      ...formValue,
      id_rol: Number(formValue.id_rol),
      id_tipo_documento: Number(formValue.id_tipo_documento),
      ...(this.esMecanicoSeleccionado() ? { especialidad } : {})
    };

    this.adminService.createUsuario(payload as Partial<Usuario>).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Usuario creado exitosamente',
          icon: 'success',
          confirmButtonColor: '#198754'
        });
        this.loadUsuarios();
        this.toggleForm();
      },
      error: (err) => {
        console.error('Error al crear usuario:', err);
        Swal.fire('Error', 'No se pudo crear el usuario. Revisa los datos.', 'error');
        this.loading.set(false);
      }
    });
  }

  toggleActivo(id: number): void {
    this.adminService.toggleUsuarioActivo(id).subscribe({
      next: (response) => {
        this.allUsers.update((users) =>
          users.map((user) =>
            user.id === id ? { ...user, activo: response.activo } : user
          )
        );
      },
      error: (err) => {
        console.error('Error al cambiar estado del usuario:', err);
        Swal.fire('Error', 'No se pudo cambiar el estado.', 'error');
      },
    });
  }

  deleteUsuario(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteUsuario(id).subscribe({
          next: () => {
            this.allUsers.update((users) => users.filter((u) => u.id !== id));
            Swal.fire('¡Eliminado!', 'El usuario ha sido borrado.', 'success');
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error'),
        });
      }
    });
  }
}