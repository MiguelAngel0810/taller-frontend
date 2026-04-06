import { Component, signal, OnInit, OnDestroy, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { AuthService } from './services/auth.service';
import { PushNotificationService } from './services/push-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule, NgOptimizedImage],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private pushService = inject(PushNotificationService);

  protected readonly title = signal('taller');
  public isLoading = signal(true);
  public isFading = signal(false);
  public isAuthenticated = signal(this.authService.isAuthenticated());
  public userRole = signal<string | null>(null);
  public userName = signal(this.authService.getUserName());
  private authSubscription: Subscription = new Subscription();

  // Lógica para decidir si mostrar la barra de navegación principal
  public showMainNavbar = computed(() => {
    // Ocultamos la barra principal (landing/pública) si el usuario es ADMIN
    return this.userRole() !== 'ADMIN';
  });

  constructor() {}

  ngOnInit(): void {
    this.authSubscription.add(
      this.authService.getRoleObservable().subscribe((role: string | null) => {
        this.isAuthenticated.set(!!role);
        this.userRole.set(role);
      })
    );
    this.authSubscription.add(
      this.authService.getUserNameObservable().subscribe((name: string | null) => {
        this.userName.set(name);
      })
    );

    // Suscribirse para mostrar animación al iniciar sesión
    this.authSubscription.add(
      this.authService.splashSubject.subscribe(() => {
        this.runAnimation();
      })
    );

    // Animación inicial (F5)
    this.runAnimation();

    // Inicializar push si ya está autenticado
    if (this.isAuthenticated()) {
      this.pushService.initialize();
    }
  }

  private runAnimation() {
    this.isLoading.set(true);
    this.isFading.set(false);

    setTimeout(() => {
      this.isFading.set(true); // Inicia el desvanecimiento
      setTimeout(() => {
        this.isLoading.set(false); // Elimina del DOM después de la transición
      }, 500); // Tiempo que dura el desvanecimiento (0.5s)
    }, 1000); // Tiempo de carga (1s)
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  scrollTo(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
