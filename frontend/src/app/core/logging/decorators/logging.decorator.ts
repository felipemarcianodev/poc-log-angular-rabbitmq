// logging.decorator.ts
import { inject } from '@angular/core';
import { SimpleLoggingService } from '../services/simple-logging.service';

export function LogUserAction(action: string, component?: string, includeArgs?: boolean) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      try {
        const loggingService = inject(SimpleLoggingService);

        if (loggingService) {
          const metadata: any = {
            method: propertyName,
            component: component || target.constructor.name,
            timestamp: new Date().toISOString()
          };

          // Incluir argumentos se solicitado (cuidado com dados sensíveis)
          if (includeArgs && args.length > 0) {
            metadata.args = args.map(arg => {
              // Evitar logging de objetos muito grandes ou sensíveis
              if (typeof arg === 'object' && arg !== null) {
                return { type: 'object', keys: Object.keys(arg) };
              } else if (typeof arg === 'string' && arg.length > 100) {
                return { type: 'string', length: arg.length, preview: arg.substring(0, 50) + '...' };
              }
              return { type: typeof arg, value: arg };
            });
          }

          loggingService.logCriticalEvent(action, metadata);
        }

        // Executar método original
        const result = originalMethod.apply(this, args);

        // Se o método retorna uma Promise, logar quando completar
        if (result && typeof result.then === 'function') {
          result
            .then((res: any) => {
              if (loggingService) {
                loggingService.logCriticalEvent(`${action}_SUCCESS`, {
                  method: propertyName,
                  component: component || target.constructor.name
                });
              }
              return res;
            })
            .catch((error: any) => {
              if (loggingService) {
                loggingService.logCriticalEvent(`${action}_ERROR`, {
                  method: propertyName,
                  component: component || target.constructor.name,
                  error: error.message || error
                });
              }
              throw error;
            });
        }

        return result;
      } catch (error) {
        console.error('Erro no decorator LogUserAction:', error);
        // Sempre executar o método original, mesmo se o logging falhar
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}
