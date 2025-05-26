import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, timer } from 'rxjs';
import { buffer, filter } from 'rxjs/operators';

export interface UserAction {
  userId: string;
  sessionId: string;
  action: string;
  component: string;
  timestamp: Date;
  metadata?: any;
  userAgent: string;
  ip?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private apiUrl = 'http://localhost:3000/api/logs';
  private logBuffer$ = new Subject<UserAction>();
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 5000; // 5 segundos

  constructor(private http: HttpClient) {
    this.initializeBatchLogging();
  }

  private initializeBatchLogging() {
    // Envia logs em batches para otimizar performance
    this.logBuffer$.pipe(
      buffer(
        timer(0, this.BATCH_TIMEOUT).pipe(
          filter(() => this.logBuffer$.observers.length > 0)
        )
      ),
      filter(actions => actions.length > 0)
    ).subscribe(actions => {
      this.sendLogBatch(actions);
    });
  }

  logAction(action: string, component: string, metadata?: any) {
    const userAction: UserAction = {
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      action,
      component,
      timestamp: new Date(),
      metadata,
      userAgent: navigator.userAgent
    };

    this.logBuffer$.next(userAction);
  }

  private sendLogBatch(actions: UserAction[]) {
    this.http.post(`${this.apiUrl}/batch`, { actions })
      .subscribe({
        next: () => console.log(`Batch de ${actions.length} logs enviado`),
        error: (error) => {
          console.error('Erro ao enviar logs:', error);
          // Implementar retry logic ou cache local
        }
      });
  }

  private getCurrentUserId(): string {
    // Implementar lógica para obter ID do usuário logado
    return localStorage.getItem('userId') || 'anonymous';
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = this.generateUUID();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
