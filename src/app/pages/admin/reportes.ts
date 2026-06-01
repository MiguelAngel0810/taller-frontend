import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import Swal from 'sweetalert2';
import { ReportService } from '../../services/report.service';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

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

  public reportForm = this.fb.group({
    tipo_filtro: ['anio', [Validators.required]],
    anio: [new Date().getFullYear(), [Validators.min(2000)]],
    mes: [new Date().getMonth() + 1],
    fecha_inicio: [''],
    fecha_fin: [''],
    tipo_cliente: [''] // Agregado el filtro tipo_cliente
  }, { validators: this.rangoFechasValidator });

  public filtroActivo = computed(() => this.reportForm.get('tipo_filtro')?.value);

  ngOnInit(): void {}

  private rangoFechasValidator(control: AbstractControl): ValidationErrors | null {
    const inicio = control.get('fecha_inicio')?.value;
    const fin = control.get('fecha_fin')?.value;
    return (inicio && fin && new Date(inicio) > new Date(fin)) ? { rangoInvalido: true } : null;
  }

  public descargarExcel(): void {
    if (this.reportForm.invalid) return;

    const rawValue = this.reportForm.getRawValue();
    // Sanitización: Enviar solo lo que el controlador espera según el tipo de filtro
    const payload: any = {
      tipo_filtro: rawValue.tipo_filtro,
      tipo_cliente: rawValue.tipo_cliente
    };

    if (rawValue.tipo_filtro === 'anio') {
      payload.anio = rawValue.anio;
    } else if (rawValue.tipo_filtro === 'mes_especifico') {
      payload.anio = rawValue.anio;
      payload.mes = rawValue.mes;
    } else if (rawValue.tipo_filtro === 'rango') {
      payload.fecha_inicio = rawValue.fecha_inicio;
      payload.fecha_fin = rawValue.fecha_fin;
    }

    this.cargando.set(true);
    Swal.fire({
      title: 'Generando Reporte',
      text: 'El servidor está compilando los datos. Esto puede tardar unos segundos.',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.reportService.downloadClientServiceReport(payload).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_clientes_servicios_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.cargando.set(false);
        Swal.fire('¡Completado!', 'Tu reporte se ha descargado exitosamente.', 'success');
      },
      error: async (err: HttpErrorResponse) => {
        this.cargando.set(false);
        
        let errorMessage = 'Hubo un problema interno en el servidor al procesar el Excel.';

        // Mapeo inteligente del error cuando la respuesta es un Blob JSON (típico en errores 500)
        if (err.error instanceof Blob && err.error.type === 'application/json') {
          try {
            const text = await err.error.text();
            const parsedError = JSON.parse(text);
            errorMessage = parsedError.message || errorMessage;
            
            // Log detallado para desarrollo
            console.error('Error detallado del Backend:', parsedError);
          } catch (e) {
            console.error('No se pudo parsear el JSON de error binario');
          }
        }

        Swal.fire({
          icon: 'error',
          title: 'Error en el Reporte',
          text: errorMessage,
          footer: '<small>Verifica si existen registros para los filtros seleccionados.</small>'
        });
      }
    });
  }
}
