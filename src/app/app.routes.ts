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
        path: 'search',
        loadComponent: () => import('./modules/search/search.component').then(m => m.SearchComponent)
      },
      {
        path: 'room/:id',
        loadComponent: () => import('./modules/room/pages/room-detail/room-detail.component').then(m => m.RoomDetailComponent)
      },
      {
        path: 'room/create',
        loadComponent: () => import('./modules/room/pages/room-create/room-create.component').then(m => m.RoomCreateComponent)
      },
      {
        path: 'room/manage',
        loadComponent: () => import('./modules/room/pages/room-manage/room-manage.component').then(m => m.RoomManageComponent)
      },
      {
        path: 'social',
        loadComponent: () => import('./modules/social/social.component').then(m => m.SocialComponent)
      },
      {
        path: 'chat',
        loadComponent: () => import('./modules/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./modules/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'notification',
        loadComponent: () => import('./modules/notification/notification.component').then(m => m.NotificationComponent)
      }
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
