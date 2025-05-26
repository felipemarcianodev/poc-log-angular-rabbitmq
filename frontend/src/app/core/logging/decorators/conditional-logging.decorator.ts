import { inject } from "@angular/core";
import { LoggingConfigService } from "../services/logging-config.service";
import { SimpleLoggingService } from "../services/simple-logging.service";

export function ConditionalLog(eventName: string, component?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const loggingService = inject(SimpleLoggingService);
      const configService = inject(LoggingConfigService);

      // Só logar se o evento estiver habilitado
      if (loggingService && configService && configService.isEventEnabled(eventName)) {
        loggingService.logCriticalEvent(eventName, {
          method: propertyName,
          component: component || target.constructor.name
        });
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
