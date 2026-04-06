import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private roleKey = 'user_role';
  private userNameKey = 'user_name';
  private userIdKey = 'user_id';
  
  // Inicializar con null para evitar errores de acceso a 'this' antes del constructor
  private roleSubject = new BehaviorSubject<string | null>(null);
  private userNameSubject = new BehaviorSubject<string | null>(null);
  private userIdSubject = new BehaviorSubject<string | null>(null);
  public splashSubject = new Subject<void>();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {
    // Cargar datos guardados una vez que el servicio está construido
    if (isPlatformBrowser(this.platformId)) {
      const savedRole = this.getSavedRole();
      if (savedRole) this.roleSubject.next(savedRole);
      const savedName = this.getSavedUserName();
      if (savedName) this.userNameSubject.next(savedName);
      const savedId = this.getSavedUserId();
      if (savedId) this.userIdSubject.next(savedId);
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // Soportar 'token' o 'access_token' por si el backend varía
        const token = response.token || response.access_token;

        if (token && isPlatformBrowser(this.platformId)) {
          localStorage.setItem(this.tokenKey, token);
          
          const role = response.user?.rol?.nombre?.toUpperCase();
          if (role) {
            localStorage.setItem(this.roleKey, role);
            this.roleSubject.next(role);
          }
          
          const userName = response.user?.nombre;
          if (userName) {
            localStorage.setItem(this.userNameKey, userName);
            this.userNameSubject.next(userName);
          }

          const userId = response.user?.id;
          if (userId) {
            localStorage.setItem(this.userIdKey, userId.toString());
            this.userIdSubject.next(userId.toString());
          }
          this.splashSubject.next();
        }
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.roleKey);
      localStorage.removeItem(this.userNameKey);
      localStorage.removeItem(this.userIdKey);
    }

    this.roleSubject.next(null);
    this.userNameSubject.next(null);
    this.userIdSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getRoleObservable(): Observable<string | null> {
    return this.roleSubject.asObservable();
  }

  getUserNameObservable(): Observable<string | null> {
    return this.userNameSubject.asObservable();
  }

  getRole(): string | null {
    // Intentar obtener del Subject, si no, leer de storage (para F5)
    if (!this.roleSubject.value) {
      const savedRole = this.getSavedRole();
      if (savedRole) this.roleSubject.next(savedRole);
    }
    return this.roleSubject.value;
  }

  getUserName(): string | null {
    return this.userNameSubject.value;
  }

  getUserId(): string | null {
    return this.userIdSubject.value;
  }

  private getSavedRole(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const role = localStorage.getItem(this.roleKey);
      return role ? role.toUpperCase() : null;
    }
    return null;
  }

  private getSavedUserName(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.userNameKey);
    }
    return null;
  }

  private getSavedUserId(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.userIdKey);
    }
    return null;
  }
}
