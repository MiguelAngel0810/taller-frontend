import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ReportService } from '../services/report.service';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SweetAlert2Module],
  template: `
    <section class="report-container" aria-labelledby="report-title">
      <h2 id="report-title">Generación de Reportes Estratégicos</h2>

      <form [formGroup]="reportForm" (ngSubmit)="generateReport()" class="report-form">
        <div class="form-group">
          <label for="tipo_filtro">Tipo de Filtro</label>
          <select id="tipo_filtro" formControlName="tipo_filtro" aria-required="true">
            <option value="anio">Por Año</option>
            <option value="mes_especifico">Mes Específico</option>
            <option value="rango">Rango de Fechas</option>
          </select>
        </div>

        @if (selectedFiltro() === 'anio' || selectedFiltro() === 'mes_especifico') {
          <div class="form-group">
            <label for="anio">Año</label>
            <input type="number" id="anio" formControlName="anio" placeholder="Ej. 2024">
          </div>
        }

        @if (selectedFiltro() === 'mes_especifico') {
          <div class="form-group">
            <label for="mes">Mes</label>
            <select id="mes" formControlName="mes">
              @for (m of meses; track m.id) {
                <option [value]="m.id">{{ m.nombre }}</option>
              }
            </select>
          </div>
        }

        @if (selectedFiltro() === 'rango') {
          <div class="form-row">
            <div class="form-group">
              <label for="fecha_inicio">Fecha Inicio</label>
              <input type="date" id="fecha_inicio" formControlName="fecha_inicio">
            </div>
            <div class="form-group">
              <label for="fecha_fin">Fecha Fin</label>
              <input type="date" id="fecha_fin" formControlName="fecha_fin">
            </div>
          </div>
        }

        <div class="form-group">
          <label for="tipo_cliente">Tipo de Cliente</label>
          <select id="tipo_cliente" formControlName="tipo_cliente">
            <option value="">Todos</option>
            <option value="natural">Persona Natural</option>
            <option value="juridico">Persona Jurídica</option>
          </select>
        </div>

        <button type="submit" [disabled]="isDownloading() || reportForm.invalid" class="btn-primary">
          @if (isDownloading()) {
            <span class="spinner" aria-hidden="true"></span> Generando...
          } @else {
            Generar Reporte Excel
          }
        </button>
      </form>
    </section>
  `,
  styles: [`
    .report-container { padding: 2rem; max-width: 800px; margin: 0 auto; }
    .report-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    label { font-weight: 600; color: #333; }
    select, input { padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }
    .btn-primary { 
      padding: 1rem; background-color: #000; color: #fff; border: none; 
      border-radius: 4px; cursor: pointer; font-weight: bold; transition: opacity 0.2s;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner { border: 2px solid #f3f3f3; border-top: 2px solid #fff; border-radius: 50%; width: 14px; height: 14px; display: inline-block; animation: spin 1s linear infinite; margin-right: 8px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportGeneratorComponent {
  private readonly fb = inject(FormBuilder);
  private readonly reportService = inject(ReportService);

  isDownloading = signal(false);
  
  reportForm = this.fb.group({
    tipo_filtro: ['anio', Validators.required],
    anio: [new Date().getFullYear(), [Validators.min(2000)]],
    mes: [new Date().getMonth() + 1],
    fecha_inicio: [''],
    fecha_fin: [''],
    tipo_cliente: ['']
  });

  selectedFiltro = computed(() => this.reportForm.get('tipo_filtro')?.value);

  meses = [
    { id: 1, nombre: 'Enero' }, { id: 2, nombre: 'Febrero' }, { id: 3, nombre: 'Marzo' },
    { id: 4, nombre: 'Abril' }, { id: 5, nombre: 'Mayo' }, { id: 6, nombre: 'Junio' },
    { id: 7, nombre: 'Julio' }, { id: 8, nombre: 'Agosto' }, { id: 9, nombre: 'Septiembre' },
    { id: 10, nombre: 'Octubre' }, { id: 11, nombre: 'Noviembre' }, { id: 12, nombre: 'Diciembre' }
  ];

  async generateReport() {
    if (this.reportForm.invalid) return;

    this.isDownloading.set(true);
    
    Swal.fire({
      title: 'Generando Excel',
      text: 'Por favor, espere mientras preparamos su reporte...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.reportService.descargarReporteClientes(this.reportForm.value).subscribe({
      next: (response: HttpResponse<Blob>) => {
        const blob = response.body;
        if (!blob) return;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Clientes_${new Date().getTime()}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.isDownloading.set(false);
        Swal.fire({
          icon: 'success',
          title: '¡Descarga exitosa!',
          text: 'El reporte se ha generado correctamente.'
        });
      },
      error: (err: HttpErrorResponse) => {
        this.isDownloading.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el reporte. Intente nuevamente.'
        });
      }
    });
  }
}