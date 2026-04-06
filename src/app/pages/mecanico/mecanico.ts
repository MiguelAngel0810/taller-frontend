import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MecanicoService } from '../../services/mecanico.service';
import { OrdenServicio } from '../models/orden-servicio.model';

@Component({
  selector: 'app-mecanico',
  imports: [CommonModule],
  templateUrl: './mecanico.html',
  styleUrl: './mecanico.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Mecanico implements OnInit {
  private authService = inject(AuthService);
  private mecanicoService = inject(MecanicoService);

  public userName = signal<string | null>(null);
  public ordenes = signal<OrdenServicio[]>([]);
  public loading = signal(true);
  public error = signal<string | null>(null);

  ngOnInit(): void {
    this.userName.set(this.authService.getUserName());
    this.loadOrdenes();
  }

  loadOrdenes(): void {
    this.loading.set(true);
    this.error.set(null);
    this.mecanicoService.getMisOrdenes().subscribe({
      next: (data) => {
        this.ordenes.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar las órdenes del mecánico:', err);
        this.error.set('No se pudieron cargar tus órdenes de servicio. Inténtalo de nuevo más tarde.');
        this.loading.set(false);
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}