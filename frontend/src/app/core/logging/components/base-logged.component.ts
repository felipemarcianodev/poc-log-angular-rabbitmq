import { Component, Injector, OnDestroy } from '@angular/core';
import { SimpleLoggingService } from '../services/simple-logging.service';

@Component({
  template: ''
})
export abstract class BaseLoggedComponent implements OnDestroy {
  protected loggingService: SimpleLoggingService;
  private componentStartTime = Date.now();

  constructor(protected injector: Injector) {
    this.loggingService = this.injector.get(SimpleLoggingService);

    // Log quando componente é criado
    this.loggingService.logCriticalEvent('COMPONENT_CREATED', {
      component: this.constructor.name,
      timestamp: new Date().toISOString()
    });
  }

  ngOnDestroy(): void {
    const componentLifetime = Date.now() - this.componentStartTime;

    // Log quando componente é destruído
    this.loggingService.logCriticalEvent('COMPONENT_DESTROYED', {
      component: this.constructor.name,
      lifetime: `${componentLifetime}ms`,
      timestamp: new Date().toISOString()
    });
  }

  // Método helper para logging manual
  protected logAction(action: string, data?: any): void {
    this.loggingService.logCriticalEvent(action, {
      component: this.constructor.name,
      ...data
    });
  }
}
