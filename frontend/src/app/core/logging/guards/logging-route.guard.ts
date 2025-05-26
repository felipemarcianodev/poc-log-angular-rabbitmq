import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, Routes } from '@angular/router';
import { SimpleLoggingService } from '../services/simple-logging.service';

@Injectable({
  providedIn: 'root'
})
export class LoggingRouteGuard implements CanActivate {
  constructor(
    private loggingService: SimpleLoggingService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Log da navegação
    this.loggingService.logPageView(route.routeConfig?.path || 'unknown');
    return true;
  }
}
