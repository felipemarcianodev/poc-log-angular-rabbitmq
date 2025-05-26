import { inject } from "@angular/core";
import { SimpleLoggingService } from "../services/simple-logging.service";

export function TrackPerformance(actionName?: string, threshold?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const performanceThreshold = threshold || 1000; // 1 segundo por padrão

    descriptor.value = function (...args: any[]) {
      const startTime = performance.now();
      const loggingService = inject(SimpleLoggingService)

      try {
        const result = originalMethod.apply(this, args);

        // Para métodos síncronos
        if (!result || typeof result.then !== 'function') {
          const duration = performance.now() - startTime;

          if (duration > performanceThreshold && loggingService) {
            loggingService.logCriticalEvent('PERFORMANCE_SLOW', {
              method: propertyName,
              component: target.constructor.name,
              action: actionName || propertyName,
              duration: `${duration.toFixed(2)}ms`,
              threshold: `${performanceThreshold}ms`
            });
          }

          return result;
        }

        // Para métodos assíncronos
        return result
          .then((res: any) => {
            const duration = performance.now() - startTime;

            if (duration > performanceThreshold && loggingService) {
              loggingService.logCriticalEvent('PERFORMANCE_SLOW', {
                method: propertyName,
                component: target.constructor.name,
                action: actionName || propertyName,
                duration: `${duration.toFixed(2)}ms`,
                threshold: `${performanceThreshold}ms`
              });
            }

            return res;
          })
          .catch((error: any) => {
            const duration = performance.now() - startTime;

            if (loggingService) {
              loggingService.logCriticalEvent('PERFORMANCE_ERROR', {
                method: propertyName,
                component: target.constructor.name,
                action: actionName || propertyName,
                duration: `${duration.toFixed(2)}ms`,
                error: error.message || error
              });
            }

            throw error;
          });
      } catch (error) {
        const duration = performance.now() - startTime;

        if (loggingService) {
          loggingService.logCriticalEvent('PERFORMANCE_ERROR', {
            method: propertyName,
            component: target.constructor.name,
            action: actionName || propertyName,
            duration: `${duration.toFixed(2)}ms`,
            error: error instanceof Error ? error.message : String(error)
          });
        }

        throw error;
      }
    };

    return descriptor;
  };
}
