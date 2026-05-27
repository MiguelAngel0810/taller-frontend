import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/auth/login.component';
import { Cliente } from './pages/cliente/cliente';
import { Mecanico } from './pages/mecanico/mecanico';
import { Admin } from './pages/admin/admin';
import { AuthGuard, PublicGuard, RoleGuard } from './services/auth.guard';
//import { RecoverComponent } from './pages/auth/recover.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [PublicGuard]
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [PublicGuard]
  },
  {
    path: 'cliente',
    component: Cliente,
    canActivate: [AuthGuard, RoleGuard]
  },
  {
    path: 'mecanico',
    component: Mecanico,
    canActivate: [AuthGuard, RoleGuard]
  },
  {
    path: 'admin',
    component: Admin,
    canActivate: [AuthGuard, RoleGuard],
    children: [
      {
        path: 'clientes',
        loadComponent: () => import('./pages/admin/clientes').then(m => m.Clientes)
      },
      {
        path: 'mecanicos',
        loadComponent: () => import('./pages/admin/mecanicos').then(m => m.Mecanicos)
      },
      {
        path: 'vehiculos',
        loadComponent: () => import('./pages/admin/vehiculos').then(m => m.Vehiculos)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/admin/usuarios').then(m => m.Usuarios)
      },
      {
        path: 'ordenes',
        loadComponent: () => import('./pages/admin/ordenes').then(m => m.Ordenes)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./pages/admin/reportes').then(m => m.Reportes)
      },
      { path: '', redirectTo: 'clientes', pathMatch: 'full' }
    ]
  },
//   {
//     path: 'recuperar',
//     component: RecoverComponent
//   },
  {
    path: '**',
    redirectTo: ''
  }
];
