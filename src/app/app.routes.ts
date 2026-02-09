import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/auth/login.component';
//import { RecoverComponent } from './pages/auth/recover.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent
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
