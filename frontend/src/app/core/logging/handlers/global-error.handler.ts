import { ErrorHandler, Injectable } from '@angular/core';
import { SimpleLoggingService } from '../services/simple-logging.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private loggingService: SimpleLoggingService) {}

  handleError(error: any): void {
    console.error('Global error:', error);

    // Log do erro crítico
    this.loggingService.logError(error, 'GLOBAL_ERROR_HANDLER');

    // Aqui você pode implementar outras ações como mostrar toast de erro
  }
}
