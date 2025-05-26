import { Injectable, NgModule } from '@angular/core';
import { SimpleLoggingService } from './simple-logging.service';

@Injectable({
  providedIn: 'root'
})
export class LoggingConfigService {

  constructor(private loggingService: SimpleLoggingService) {
    // Disponibilizar globalmente para decorators
    (window as any).loggingService = this.loggingService;
  }

  // Configurações globais
  enabledEvents: string[] = [
    'PRODUTO_VIEWED',
    'PURCHASE_PRODUTO',
    'APPLICATION_ERROR',
    'PERFORMANCE_SLOW'
  ];

  isEventEnabled(eventName: string): boolean {
    return this.enabledEvents.includes(eventName);
  }

  enableEvent(eventName: string): void {
    if (!this.enabledEvents.includes(eventName)) {
      this.enabledEvents.push(eventName);
    }
  }

  disableEvent(eventName: string): void {
    this.enabledEvents = this.enabledEvents.filter(e => e !== eventName);
  }
}
