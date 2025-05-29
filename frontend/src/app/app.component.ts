import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, Component, ErrorHandler } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { LoggingConfigService } from './core/logging/services/logging-config.service';
import { GlobalErrorHandler } from './core/logging/handlers/global-error.handler';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggingInterceptor,
      multi: true
    },
    LoggingConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: (config: LoggingConfigService) => () => config,
      deps: [LoggingConfigService],
      multi: true
    },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    }
  ]
})
export class AppComponent {

}
