import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LogAsyncAction } from '../../../core/logging/decorators/async-logging.decorator';
import { LogUserAction } from '../../../core/logging/decorators/logging.decorator';
import { TrackPerformance } from '../../../core/logging/decorators/performance-logging.decorator';
import { SimpleLoggingService } from '../../../core/logging/services/simple-logging.service';
import { ProdutoService } from '../services/produto.service';
import { ProdutoCardComponent } from '../components/produto-card.component';
import { Produto } from '../models/produto.model';

@Component({
  selector: 'app-produto-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ProdutoCardComponent
  ],
  template: `
    <div class="produto-list-container">
      <!-- Header -->
      <div class="list-header">
        <div class="header-title">
          <h1>📦 Nossos Produtos</h1>
          <p class="subtitle">Encontre os melhores produtos com os melhores preços</p>
        </div>

        <div class="header-actions">
          <button
            (click)="refreshProdutos()"
            class="btn btn-refresh"
            [disabled]="isLoading">
            <span *ngIf="!isLoading">🔄 Atualizar</span>
            <span *ngIf="isLoading">⏳ Carregando...</span>
          </button>

          <button
            (click)="toggleViewMode()"
            class="btn btn-view-toggle">
            {{ viewMode === 'grid' ? '📋 Lista' : '🔲 Grid' }}
          </button>
        </div>
      </div>

      <!-- Filtros e Busca -->
      <div class="filters-section">
        <div class="search-container">
          <input
            type="text"
            [(ngModel)]="searchTerm"
            (input)="onSearchChange()"
            placeholder="🔍 Buscar produtos..."
            class="search-input">
        </div>

        <div class="filters-container">
          <select
            [(ngModel)]="selectedCategory"
            (change)="onCategoryChange()"
            class="filter-select">
            <option value="">🏷️ Todas as Categorias</option>
            <option *ngFor="let category of categories" [value]="category">
              {{ category }}
            </option>
          </select>

          <select
            [(ngModel)]="sortBy"
            (change)="onSortChange()"
            class="filter-select">
            <option value="">📊 Ordenar por</option>
            <option value="name-asc">Nome (A-Z)</option>
            <option value="name-desc">Nome (Z-A)</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
            <option value="rating-desc">Melhor Avaliação</option>
            <option value="newest">Mais Recentes</option>
          </select>

          <div class="price-filter">
            <label>💰 Preço até:</label>
            <input
              type="range"
              [(ngModel)]="maxPrice"
              [max]="highestPrice"
              [min]="0"
              (input)="onPriceChange()"
              class="price-slider">
            <span class="price-display">R$ {{ maxPrice | number:'1.2-2' }}</span>
          </div>

          <button
            (click)="clearFilters()"
            class="btn btn-clear-filters"
            *ngIf="hasActiveFilters()">
            ❌ Limpar Filtros
          </button>
        </div>
      </div>

      <!-- Resultados Info -->
      <div class="results-info" *ngIf="!isLoading">
        <span class="results-count">
          {{ filteredProdutos.length }} produto(s) encontrado(s)
          <span *ngIf="hasActiveFilters()" class="filter-indicator">
            (filtrado de {{ allProdutos.length }} total)
          </span>
        </span>

        <div class="view-mode-indicator">
          <span [class.active]="viewMode === 'grid'" (click)="setViewMode('grid')">🔲</span>
          <span [class.active]="viewMode === 'list'" (click)="setViewMode('list')">📋</span>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <div class="loading-spinner">⏳</div>
        <p>Carregando produtos...</p>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && filteredProdutos.length === 0 && allProdutos.length === 0">
        <div class="empty-icon">📦</div>
        <h3>Nenhum produto encontrado</h3>
        <p>Não há produtos disponíveis no momento.</p>
        <button (click)="refreshProdutos()" class="btn btn-primary">
          🔄 Tentar Novamente
        </button>
      </div>

      <!-- No Results State -->
      <div class="empty-state" *ngIf="!isLoading && filteredProdutos.length === 0 && allProdutos.length > 0">
        <div class="empty-icon">🔍</div>
        <h3>Nenhum produto encontrado</h3>
        <p>Tente ajustar os filtros ou termo de busca.</p>
        <button (click)="clearFilters()" class="btn btn-secondary">
          ❌ Limpar Filtros
        </button>
      </div>

      <!-- Produtos Grid/List -->
      <div
        class="produtos-container"
        [class.grid-view]="viewMode === 'grid'"
        [class.list-view]="viewMode === 'list'"
        *ngIf="!isLoading && filteredProdutos.length > 0">

        <app-produto-card
          *ngFor="let produto of filteredProdutos; trackBy: trackByProdutoId; let i = index"
          [produto]="produto"
          [showQuickActions]="true"
          [showTags]="true"
          [showRating]="true"
          [class.list-item]="viewMode === 'list'"
          (produtoClick)="onProdutoClick($event)"
          (addToCart)="onAddToCart($event)"
          (addToWishlist)="onAddToWishlist($event)"
          (quickView)="onQuickView($event)"
          (tagClick)="onTagClick($event)">
        </app-produto-card>
      </div>

      <!-- Load More Button -->
      <div class="load-more-container" *ngIf="!isLoading && filteredProdutos.length > 0 && hasMoreProdutos">
        <button
          (click)="loadMoreProdutos()"
          class="btn btn-load-more"
          [disabled]="isLoadingMore">
          <span *ngIf="!isLoadingMore">📦 Carregar Mais Produtos</span>
          <span *ngIf="isLoadingMore">⏳ Carregando...</span>
        </button>
      </div>

      <!-- Floating Action Button -->
      <button
        class="fab fab-add"
        routerLink="/produtos/create"
        (click)="onCreateProduto()"
        title="Adicionar Produto">
        ➕
      </button>
    </div>
  `,
  styles: [`
    .produto-list-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
      position: relative;
    }

    /* Header */
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 20px;
    }

    .header-title h1 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 32px;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    /* Filtros */
    .filters-section {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .search-container {
      margin-bottom: 20px;
    }

    .search-input {
      width: 100%;
      padding: 12px 16px;
      font-size: 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: #007bff;
    }

    .filters-container {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      font-size: 14px;
    }

    .price-filter {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .price-slider {
      width: 120px;
    }

    .price-display {
      font-weight: bold;
      color: #007bff;
      min-width: 80px;
    }

    /* Results Info */
    .results-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 0 4px;
    }

    .results-count {
      font-size: 14px;
      color: #666;
    }

    .filter-indicator {
      font-style: italic;
      color: #007bff;
    }

    .view-mode-indicator {
      display: flex;
      gap: 8px;
    }

    .view-mode-indicator span {
      padding: 8px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
      opacity: 0.5;
    }

    .view-mode-indicator span.active {
      opacity: 1;
      background: #007bff;
      color: white;
    }

    /* Loading & Empty States */
    .loading-container,
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .loading-spinner,
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 16px 0 8px 0;
      color: #333;
    }

    /* Produtos Container */
    .produtos-container.grid-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .produtos-container.list-view {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .produtos-container.list-view .list-item {
      max-width: none;
    }

    /* Load More */
    .load-more-container {
      text-align: center;
      margin-top: 40px;
    }

    /* Buttons */
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-refresh {
      background: #007bff;
      color: white;
    }

    .btn-refresh:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-view-toggle {
      background: #f8f9fa;
      color: #333;
      border: 1px solid #dee2e6;
    }

    .btn-view-toggle:hover {
      background: #e9ecef;
    }

    .btn-clear-filters {
      background: #dc3545;
      color: white;
      font-size: 12px;
      padding: 6px 12px;
    }

    .btn-clear-filters:hover {
      background: #c82333;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
    }

    .btn-load-more {
      background: #28a745;
      color: white;
      padding: 12px 32px;
      font-size: 16px;
    }

    .btn-load-more:hover:not(:disabled) {
      background: #218838;
    }

    /* Floating Action Button */
    .fab {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s;
      z-index: 1000;
    }

    .fab-add {
      background: #28a745;
      color: white;
    }

    .fab:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0,0,0,0.4);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .produto-list-container {
        padding: 16px;
      }

      .list-header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        justify-content: space-between;
      }

      .filters-container {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-select,
      .price-filter {
        width: 100%;
      }

      .produtos-container.grid-view {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
      }

      .results-info {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .fab {
        bottom: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
        font-size: 20px;
      }
    }

    @media (max-width: 480px) {
      .produtos-container.grid-view {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProdutoListComponent implements OnInit {
  // Data
  allProdutos: Produto[] = [];
  filteredProdutos: Produto[] = [];
  categories: string[] = [];

  // State
  isLoading = false;
  isLoadingMore = false;
  hasMoreProdutos = false;
  currentPage = 1;
  itemsPerPage = 20;

  // Filters
  searchTerm = '';
  selectedCategory = '';
  sortBy = '';
  maxPrice = 10000;
  highestPrice = 10000;

  // View
  viewMode: 'grid' | 'list' = 'grid';

  // Services
  private loggingService = inject(SimpleLoggingService);
  private produtoService = inject(ProdutoService);

  ngOnInit(): void {
    this.logAction('PRODUCT_LIST_ACCESSED');
    this.loadInitialData();
  }

  // ✅ Método para decorators usarem
  protected tryLogEvent(eventName: string, data?: any): void {
    try {
      this.loggingService.logCriticalEvent(eventName, data);
    } catch (error) {
      console.warn('Failed to log event:', eventName, error);
    }
  }

  @TrackPerformance('LOAD_PRODUCTS', 3000)
  @LogAsyncAction('LOAD_PRODUCTS', 'ProdutoListComponent')
  async loadInitialData(): Promise<void> {
    this.isLoading = true;

    try {
      this.allProdutos = await this.produtoService.getProdutos();
      this.setupCategories();
      this.setupPriceRange();
      this.applyFilters();

      this.logAction('PRODUCT_LIST_LOADED', {
        totalProdutos: this.allProdutos.length,
        categories: this.categories.length
      });
    } catch (error) {
      this.logAction('PRODUCT_LIST_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('Error loading produtos:', error);
    } finally {
      this.isLoading = false;
    }
  }

  @LogUserAction('PRODUCT_LIST_REFRESH', 'ProdutoListComponent')
  refreshProdutos(): void {
    this.currentPage = 1;
    this.loadInitialData();
  }

  @LogAsyncAction('LOAD_MORE_PRODUCTS', 'ProdutoListComponent')
  async loadMoreProdutos(): Promise<void> {
    if (this.isLoadingMore || !this.hasMoreProdutos) return;

    this.isLoadingMore = true;
    this.currentPage++;

    try {
      // Simular carregamento de mais produtos
      await new Promise(resolve => setTimeout(resolve, 1000));

      const moreProdutos = await this.produtoService.getProdutos(this.currentPage);
      this.allProdutos = [...this.allProdutos, ...moreProdutos];
      this.applyFilters();

      this.logAction('MORE_PRODUCTS_LOADED', {
        page: this.currentPage,
        newProdutosCount: moreProdutos.length
      });
    } catch (error) {
      this.logAction('LOAD_MORE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.isLoadingMore = false;
    }
  }

  // Filters
  @LogUserAction('SEARCH_PRODUCTS', 'ProdutoListComponent')
  onSearchChange(): void {
    this.debounceFilter();
  }

  @LogUserAction('FILTER_BY_CATEGORY', 'ProdutoListComponent')
  onCategoryChange(): void {
    this.logAction('CATEGORY_FILTER_APPLIED', {
      category: this.selectedCategory
    });
    this.applyFilters();
  }

  @LogUserAction('SORT_PRODUCTS', 'ProdutoListComponent')
  onSortChange(): void {
    this.logAction('SORT_APPLIED', {
      sortBy: this.sortBy
    });
    this.applyFilters();
  }

  @LogUserAction('FILTER_BY_PRICE', 'ProdutoListComponent')
  onPriceChange(): void {
    this.debounceFilter();
  }

  @LogUserAction('CLEAR_FILTERS', 'ProdutoListComponent')
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.sortBy = '';
    this.maxPrice = this.highestPrice;
    this.applyFilters();
  }

  // View Mode
  @LogUserAction('TOGGLE_VIEW_MODE', 'ProdutoListComponent')
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
    this.logAction('VIEW_MODE_CHANGED', {
      viewMode: this.viewMode
    });
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    this.logAction('VIEW_MODE_SET', {
      viewMode: mode
    });
  }

  // Produto Actions
  onProdutoClick(produto: Produto): void {
    this.logAction('PRODUCT_CLICKED_FROM_LIST', {
      produtoId: produto.id,
      produtoName: produto.name,
      position: this.filteredProdutos.indexOf(produto) + 1
    });
  }

  @LogUserAction('ADD_TO_CART_FROM_LIST', 'ProdutoListComponent')
  onAddToCart(produto: Produto): void {
    this.logAction('CART_ADD_FROM_LIST', {
      produtoId: produto.id,
      produtoName: produto.name,
      price: produto.price,
      category: produto.category
    });

    // Implementar lógica do carrinho
    alert(`${produto.name} adicionado ao carrinho!`);
  }

  @LogUserAction('WISHLIST_TOGGLE_FROM_LIST', 'ProdutoListComponent')
  onAddToWishlist(produto: Produto): void {
    this.logAction('WISHLIST_TOGGLE_FROM_LIST', {
      produtoId: produto.id,
      action: produto.inWishlist ? 'added' : 'removed'
    });
  }

  @LogUserAction('QUICK_VIEW_FROM_LIST', 'ProdutoListComponent')
  onQuickView(produto: Produto): void {
    this.logAction('QUICK_VIEW_FROM_LIST', {
      produtoId: produto.id,
      produtoName: produto.name
    });

    // Implementar modal de visualização rápida
    alert(`Visualização rápida: ${produto.name}`);
  }

  @LogUserAction('TAG_CLICKED_FROM_LIST', 'ProdutoListComponent')
  onTagClick(tag: string): void {
    this.searchTerm = tag;
    this.applyFilters();

    this.logAction('TAG_FILTER_APPLIED', {
      tag: tag
    });
  }

  @LogUserAction('CREATE_PRODUCT_CLICKED', 'ProdutoListComponent')
  onCreateProduto(): void {
    this.logAction('CREATE_PRODUCT_INITIATED');
  }

  // Helper Methods
  private debounceFilter(): void {
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }
  private filterTimeout: any;

  private applyFilters(): void {
    let filtered = [...this.allProdutos];

    // Search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(produto =>
        produto.name.toLowerCase().includes(term) ||
        produto.description.toLowerCase().includes(term) ||
        produto.category.toLowerCase().includes(term) ||
        produto.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Category
    if (this.selectedCategory) {
      filtered = filtered.filter(produto =>
        produto.category === this.selectedCategory
      );
    }

    // Price
    filtered = filtered.filter(produto =>
      produto.price <= this.maxPrice
    );

    // Sort
    if (this.sortBy) {
      filtered = this.sortProdutos(filtered, this.sortBy);
    }

    this.filteredProdutos = filtered;
    this.hasMoreProdutos = this.filteredProdutos.length < this.allProdutos.length;

    // Log filter results
    if (this.hasActiveFilters()) {
      this.logAction('FILTERS_APPLIED', {
        searchTerm: this.searchTerm,
        category: this.selectedCategory,
        maxPrice: this.maxPrice,
        sortBy: this.sortBy,
        resultCount: this.filteredProdutos.length,
        totalCount: this.allProdutos.length
      });
    }
  }

  private sortProdutos(produtos: Produto[], sortBy: string): Produto[] {
    switch (sortBy) {
      case 'name-asc':
        return produtos.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return produtos.sort((a, b) => b.name.localeCompare(a.name));
      case 'price-asc':
        return produtos.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return produtos.sort((a, b) => b.price - a.price);
      case 'rating-desc':
        return produtos.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest':
        return produtos.sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      default:
        return produtos;
    }
  }

  private setupCategories(): void {
    const categorySet = new Set<string>();
    this.allProdutos.forEach(produto => {
      if (produto.category) {
        categorySet.add(produto.category);
      }
    });
    this.categories = Array.from(categorySet).sort();
  }

  private setupPriceRange(): void {
    if (this.allProdutos.length > 0) {
      this.highestPrice = Math.max(...this.allProdutos.map(p => p.price));
      this.maxPrice = this.highestPrice;
    }
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm.trim() ||
      this.selectedCategory ||
      this.maxPrice < this.highestPrice ||
      this.sortBy
    );
  }

  trackByProdutoId(index: number, produto: Produto): string {
    return produto.id;
  }

  private logAction(action: string, data?: any): void {
    this.loggingService.logCriticalEvent(action, {
      component: 'ProdutoListComponent',
      ...data
    });
  }
}
