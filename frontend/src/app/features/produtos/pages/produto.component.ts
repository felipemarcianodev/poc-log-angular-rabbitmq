import { Component, Injector, OnInit } from '@angular/core';
import { BaseLoggedComponent } from '../../../core/logging/components/base-logged.component';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports:[CommonModule, BrowserModule, RouterModule],
  template: `
    <div class="produtos-layout">
      <header class="produtos-header">
        <h1>Produtos</h1>
        <nav class="produtos-nav">
          <a routerLink="/produtos" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            Lista
          </a>
          <a routerLink="/produtos/create" routerLinkActive="active">
            Criar Produto
          </a>
        </nav>
      </header>

      <main class="produtos-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .produtos-layout {
      padding: 20px;
    }

    .produtos-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 15px;
    }

    .produtos-nav a {
      margin-right: 15px;
      padding: 8px 16px;
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .produtos-nav a:hover {
      background-color: #f0f0f0;
    }

    .produtos-nav a.active {
      background-color: #007bff;
      color: white;
    }
  `]
})
export class ProdutoComponent extends BaseLoggedComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    this.logAction('PRODUTOS_SECTION_ACCESSED');
  }
}
