import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { OrderService, Servicio } from '../services/order.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="orderForm" (ngSubmit)="onSubmit()" class="order-form" aria-label="Formulario de nueva orden">
      <div class="form-group">
        <label for="titulo">Título de la Orden</label>
        <input id="titulo" formControlName="titulo" type="text" aria-required="true">
      </div>

      <div class="form-group">
        <label for="id_servicio">Servicio</label>
        <select id="id_servicio" formControlName="id_servicio" aria-required="true">
          <option value="">Seleccione un servicio</option>
          @for (servicio of servicios(); track servicio.id) {
            <option [value]="servicio.id">{{ servicio.nombre }}</option>
          }
        </select>
      </div>

      <div class="form-group">
        <label for="costo_total">Costo Total ($)</label>
        <input id="costo_total" formControlName="costo_total" type="number" step="0.01" placeholder="0.00">
      </div>

      <div class="form-group">
        <label for="descripcion">Descripción</label>
        <textarea id="descripcion" formControlName="descripcion"></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="fecha_inicio">Fecha de Inicio</label>
          <input id="fecha_inicio" formControlName="fecha_inicio" type="date">
        </div>
      </div>

      <button type="submit" [disabled]="orderForm.invalid || isSubmitting()" class="btn-submit">
        {{ isSubmitting() ? 'Guardando...' : 'Crear Orden' }}
      </button>
    </form>
  `,
  styles: [`
    .order-form { display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
    input, select, textarea { padding: 0.6rem; border: 1px solid #ddd; border-radius: 4px; width: 100%; }
    .btn-submit { background: #1a73e8; color: white; padding: 0.8rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
    .btn-submit:disabled { background: #ccc; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderService);

  servicios = signal<Servicio[]>([]);
  isSubmitting = signal(false);

  orderForm = this.fb.group({
    id_vehiculo: [null, Validators.required], // Asumimos que viene de contexto previo
    id_mecanico: [null, Validators.required],
    id_servicio: ['', Validators.required],
    titulo: ['', [Validators.required, Validators.minLength(5)]],
    descripcion: [''],
    fecha_inicio: [new Date().toISOString().split('T')[0], Validators.required],
    costo_total: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit() {
    this.loadServicios();
  }

  loadServicios() {
    this.orderService.getServicios().subscribe({
      next: (data) => this.servicios.set(data),
      error: () => console.error('Error cargando servicios')
    });
  }

  onSubmit() {
    if (this.orderForm.invalid) return;

    this.isSubmitting.set(true);
    
    this.orderService.createOrder(this.orderForm.value).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Orden Creada',
          text: 'La orden de servicio se registró correctamente.',
          confirmButtonColor: '#1a73e8'
        });
        this.orderForm.reset({ fecha_inicio: new Date().toISOString().split('T')[0] });
      },
      error: () => {
        this.isSubmitting.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al crear la orden.'
        });
      }
    });
  }
}