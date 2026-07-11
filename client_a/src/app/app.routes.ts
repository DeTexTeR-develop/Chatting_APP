import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/conversations', pathMatch: 'full' },

  // Public-only
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup.component').then(m => m.SignupComponent),
    canActivate: [publicOnlyGuard],
  },

  // Protected
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'conversations',
        loadComponent: () => import('./pages/conversations/conversations.component').then(m => m.ConversationsComponent),
      },
      {
        path: 'chat/:id',
        loadComponent: () => import('./pages/chat/chat.component').then(m => m.ChatComponent),
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./pages/user-profile/user-profile.component').then(m => m.UserProfileComponent),
      },
    ],
  },

  { path: '**', redirectTo: '/conversations' },
];
