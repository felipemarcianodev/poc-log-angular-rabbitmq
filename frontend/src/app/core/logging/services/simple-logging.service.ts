import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, timer } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CriticalLog } from '../../interfaces/critical-log.interface';

@Injectable({
  providedIn: 'root'
})
export class SimpleLoggingService {
  private logstashUrl = environment.logstashUrl || 'http://localhost:3000';
  private logQueue: CriticalLog[] = [];
  private isOnline$ = new BehaviorSubject(navigator.onLine);

  constructor(private http: HttpClient) {
    this.setupBatchSender();
    this.setupOnlineListener();
  }

  // Logs apenas eventos críticos
  logCriticalEvent(event: string, data?: any) {
    const log: CriticalLog = {
      timestamp: new Date().toISOString(),
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      event,
      page: window.location.pathname,
      data,
      userAgent: navigator.userAgent
    };

    this.queueLog(log);
  }

  // Eventos específicos que queremos monitorar
  logLogin(userId: string) {
    this.logCriticalEvent('USER_LOGIN', { userId });
  }

  logError(error: Error, context?: string) {
    this.logCriticalEvent('APPLICATION_ERROR', {
      message: error.message,
      stack: error.stack,
      context
    });
  }

  logPurchase(productId: string, amount: number) {
    this.logCriticalEvent('PURCHASE_COMPLETED', {
      productId,
      amount
    });
  }

  logPageView(page: string) {
    this.logCriticalEvent('PAGE_VIEW', { page });
  }

  logFeatureUsage(feature: string, action: string) {
    this.logCriticalEvent('FEATURE_USAGE', {
      feature,
      action
    });
  }

  private queueLog(log: CriticalLog) {
    this.logQueue.push(log);

    // Se tiver muitos logs na fila, envia imediatamente
    if (this.logQueue.length >= 5) {
      this.sendLogs();
    }
  }

  private setupBatchSender() {
    // Envia logs a cada 30 segundos
    timer(0, 30000).subscribe(() => {
      if (this.logQueue.length > 0 && this.isOnline$.value) {
        this.sendLogs();
      }
    });
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline$.next(true);
      if (this.logQueue.length > 0) {
        this.sendLogs();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline$.next(false);
    });
  }

  private sendLogs() {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    this.http.post(this.logstashUrl, logsToSend, { headers })
      .subscribe({
        next: () => {
          console.log(`${logsToSend.length} logs enviados com sucesso`);
        },
        error: (error) => {
          console.error('Erro ao enviar logs:', error);
          // Recoloca na fila em caso de erro
          this.logQueue.unshift(...logsToSend);
        }
      });
  }

  private getUserId(): string {
    return localStorage.getItem('userId') || 'anonymous';
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = Date.now().toString() + Math.random().toString(36);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }
}
