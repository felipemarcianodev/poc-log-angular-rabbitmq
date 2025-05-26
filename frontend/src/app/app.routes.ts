import { Routes } from '@angular/router';
import { LoggingRouteGuard } from './core/logging/guards/logging-route.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/produtos',
    pathMatch: 'full'
  },
  {
    path: 'produtos',
    loadChildren: () => import('./features/produtos/produto.routes').then(r => r.routes),
    canActivate: [LoggingRouteGuard]
  },
];


