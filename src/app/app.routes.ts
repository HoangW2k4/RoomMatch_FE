import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./modules/home/home.component').then(m => m.HomeComponent)
      },

      {
        path: 'profile',
        loadComponent: () => import('./modules/profile/profile.component').then(m => m.ProfileComponent)
      },
    ]
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./modules/auth/login/login.component').then(m => m.LoginComponent)
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
