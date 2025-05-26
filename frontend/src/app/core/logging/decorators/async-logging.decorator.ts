import { inject } from "@angular/core";
import { SimpleLoggingService } from "../services/simple-logging.service";

export function LogAsyncAction(action: string, component?: string) {

  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const loggingService = inject(SimpleLoggingService)
      const startTime = Date.now();

      if (loggingService) {
        loggingService.logCriticalEvent(`${action}_STARTED`, {
          method: propertyName,
          component: component || target.constructor.name
        });
      }

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        if (loggingService) {
          loggingService.logCriticalEvent(`${action}_COMPLETED`, {
            method: propertyName,
            component: component || target.constructor.name,
            duration: `${duration}ms`
          });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        if (loggingService) {
          loggingService.logCriticalEvent(`${action}_FAILED`, {
            method: propertyName,
            component: component || target.constructor.name,
            duration: `${duration}ms`,
            error: error instanceof Error ? error.message : String(error)
          });
        }

        throw error;
      }
    };

    return descriptor;
  };
}
