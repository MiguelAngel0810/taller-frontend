import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormArray, FormControl } from '@angular/forms';
import Swal from 'sweetalert2';
import { ReportService } from '../../services/report.service';
import { HttpErrorResponse, HttpClient, HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reportes implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly reportService = inject(ReportService);
  private readonly http = inject(HttpClient);

  public cargando = signal(false);
  public meses = [
    { id: 1, nombre: 'Enero' }, { id: 2, nombre: 'Febrero' }, { id: 3, nombre: 'Marzo' },
    { id: 4, nombre: 'Abril' }, { id: 5, nombre: 'Mayo' }, { id: 6, nombre: 'Junio' },
    { id: 7, nombre: 'Julio' }, { id: 8, nombre: 'Agosto' }, { id: 9, nombre: 'Septiembre' },
    { id: 10, nombre: 'Octubre' }, { id: 11, nombre: 'Noviembre' }, { id: 12, nombre: 'Diciembre' }
  ];

  public catalogoServicios = [
    'Traccionamiento',
    'Planchado',
    'Pintura',
    'Mantenimiento',
  ];

  public reportForm = this.fb.group({
    tipo_filtro: ['anio', [Validators.required]],
    anio: [new Date().getFullYear(), [Validators.required, Validators.min(2025), Validators.max(new Date().getFullYear())]],
    mes: [new Date().getMonth() + 1],
    mes_inicio: [1],
    mes_fin: [new Date().getMonth() + 1],
    tipo_cliente: [''],
    servicios: this.fb.array(this.catalogoServicios.map(() => new FormControl(true))) // Todos seleccionados por defecto
  }, { validators: this.rangoMesesValidator });

  // Signal manual para rastrear el tipo de filtro y asegurar reactividad en el HTML
  public filtroActivo = signal('anio');

  get serviciosFormArray() {
    return this.reportForm.get('servicios') as FormArray;
  }

  ngOnInit(): void {
    // Suscribirse a cambios para actualizar la señal de UI
    this.reportForm.get('tipo_filtro')?.valueChanges.subscribe(val => this.filtroActivo.set(val || 'anio'));
  }

  private rangoMesesValidator(control: AbstractControl): ValidationErrors | null {
    const tipo = control.get('tipo_filtro')?.value;
    if (tipo !== 'rango') return null;
    
    const inicio = control.get('mes_inicio')?.value;
    const fin = control.get('mes_fin')?.value;
    return (inicio && fin && Number(inicio) > Number(fin)) ? { rangoMesesInvalido: true } : null;
  }

  public descargarExcel(): void {
    if (this.reportForm.invalid) return;

    const rawValue = this.reportForm.getRawValue();
    // Sanitización: Enviar solo lo que el controlador espera según el tipo de filtro
    const payload: any = {
      tipo_filtro: rawValue.tipo_filtro,
      tipo_cliente: rawValue.tipo_cliente,
      // Mapeamos los booleanos del FormArray a los nombres de los servicios
      servicios: this.catalogoServicios.filter((_, i) => rawValue.servicios?.[i])
    };

    if (payload.servicios.length === 0) {
      Swal.fire('Atención', 'Debes seleccionar al menos un servicio para el reporte.', 'warning');
      return;
    }

    if (rawValue.tipo_filtro === 'anio') {
      payload.anio = rawValue.anio;
    } else if (rawValue.tipo_filtro === 'mes_especifico') {
      payload.anio = rawValue.anio;
      payload.mes = rawValue.mes;
    } else if (rawValue.tipo_filtro === 'rango') {
      payload.anio = rawValue.anio;
      payload.mes_inicio = rawValue.mes_inicio;
      payload.mes_fin = rawValue.mes_fin;
    }

    this.cargando.set(true);
    Swal.fire({
      title: 'Generando Reporte',
      text: 'El servidor está compilando los datos. Esto puede tardar unos segundos.',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.reportService.descargarReporteClientes(payload).subscribe({
      next: (response: HttpResponse<Blob>) => this.procesarDescargaExitosa(response),
      error: (err: HttpErrorResponse) => this.procesarErrorDescarga(err)
    });
  }

  private procesarDescargaExitosa(response: HttpResponse<Blob>): void {
    this.cargando.set(false);
    const blob = new Blob([response.body!], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Servicios_${new Date().getTime()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    
    // Limpieza
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    Swal.fire({
      title: '¡Éxito!',
      text: 'El reporte se ha generado correctamente.',
      icon: 'success',
      timer: 2000
    });
  }

  private procesarErrorDescarga(err: HttpErrorResponse): void {
    this.cargando.set(false);
    
    if (err.status === 404) {
      Swal.fire('Sin registros', 'No se encontraron datos que coincidan con los filtros seleccionados.', 'warning');
      return;
    }

    let errorMessage = 'No se pudo generar el reporte. Verifique su conexión.';

    // Si el error viene como un Blob (porque responseType era 'blob')
    if (err.error instanceof Blob && err.error.type === 'application/json') {
      err.error.text().then(text => {
        try {
          const parsed = JSON.parse(text);
          this.mostrarNotificacionError(parsed.message || errorMessage);
        } catch {
          this.mostrarNotificacionError('Error desconocido en el servidor.');
        }
      });
      return;
    }

    this.mostrarNotificacionError(errorMessage);
  }

  private mostrarNotificacionError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      footer: '<small>Revisa la consola para más detalles.</small>'
    });
  }
}
