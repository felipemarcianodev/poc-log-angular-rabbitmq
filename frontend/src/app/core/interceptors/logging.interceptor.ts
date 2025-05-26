import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HTTP_INTERCEPTORS } from "@angular/common/http";
import { Injectable, NgModule } from "@angular/core";
import { Observable, tap } from "rxjs";
import { LoggingService } from "../logging/services/logging.service";

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  constructor(private loggingService: LoggingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = Date.now();

    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            const duration = Date.now() - startTime;
            this.loggingService.logAction('HTTP_REQUEST', 'HttpInterceptor', {
              url: req.url,
              method: req.method,
              status: event.status,
              duration
            });
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.loggingService.logAction('HTTP_ERROR', 'HttpInterceptor', {
            url: req.url,
            method: req.method,
            error: error.message,
            duration
          });
        }
      })
    );
  }
}
