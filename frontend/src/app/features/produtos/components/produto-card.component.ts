import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LogUserAction } from '../../../core/logging/decorators/logging.decorator';
import { SimpleLoggingService } from '../../../core/logging/services/simple-logging.service';
import { Produto } from '../models/produto.model';

@Component({
  selector: 'app-produto-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  template: `
    <div class="produto-card" [class.featured]="produto.featured">
      <!-- Badge de destaque -->
      <div class="produto-badge" *ngIf="produto.featured">
        ⭐ Destaque
      </div>

      <!-- Imagem do produto -->
      <div class="produto-image-container">
        <img
          [src]="produto.imageUrl || '/assets/images/produto-placeholder.jpg'"
          [alt]="produto.name"
          class="produto-image"
          (click)="onImageClick()"
          (error)="onImageError($event)">

        <!-- Overlay com ações rápidas -->
        <div class="produto-overlay">
          <button
            class="quick-action-btn"
            (click)="onQuickView()"
            title="Visualização Rápida">
            👁️
          </button>
          <button
            class="quick-action-btn"
            (click)="onAddToWishlist()"
            [class.active]="produto.inWishlist"
            title="Adicionar aos Favoritos">
            {{ produto.inWishlist ? '❤️' : '🤍' }}
          </button>
        </div>
      </div>

      <!-- Informações do produto -->
      <div class="produto-info">
        <div class="produto-category">
          {{ produto.category }}
        </div>

        <h3 class="produto-name" (click)="onTitleClick()">
          {{ produto.name }}
        </h3>

        <p class="produto-description">
          {{ getShortDescription() }}
        </p>

        <!-- Avaliação -->
        <div class="produto-rating" *ngIf="produto.rating">
          <div class="stars">
            <span *ngFor="let star of getStars()" class="star" [class.filled]="star">⭐</span>
          </div>
          <span class="rating-text">{{ produto.rating }}/5 ({{ produto.reviewCount }} avaliações)</span>
        </div>

        <!-- Preço -->
        <div class="produto-pricing">
          <span class="price-current">R$ {{ formatPrice(produto.price) }}</span>
          <span class="price-original" *ngIf="produto.originalPrice && produto.originalPrice > produto.price">
            R$ {{ formatPrice(produto.originalPrice) }}
          </span>
          <span class="discount-badge" *ngIf="getDiscountPercentage() > 0">
            -{{ getDiscountPercentage() }}%
          </span>
        </div>

        <!-- Status do estoque -->
        <div class="stock-status" [class]="getStockStatusClass()">
          {{ getStockStatusText() }}
        </div>
      </div>

      <!-- Ações do produto -->
      <div class="produto-actions">
        <button
          class="btn btn-primary"
          (click)="onAddToCart()"
          [disabled]="!produto.inStock"
          [class.loading]="isAddingToCart">
          <span *ngIf="!isAddingToCart">🛒 Adicionar</span>
          <span *ngIf="isAddingToCart">⏳ Adicionando...</span>
        </button>

        <button
          class="btn btn-secondary"
          [routerLink]="['/produtos', produto.id]"
          (click)="onViewDetails()">
          📄 Detalhes
        </button>
      </div>

      <!-- Tags do produto -->
      <div class="produto-tags" *ngIf="produto.tags && produto.tags.length > 0">
        <span
          *ngFor="let tag of produto.tags.slice(0, 3)"
          class="produto-tag"
          (click)="onTagClick(tag)">
          #{{ tag }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .produto-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: all 0.3s ease;
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .produto-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .produto-card.featured {
      border: 2px solid #ffd700;
    }

    .produto-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: #ffd700;
      color: #333;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      z-index: 2;
    }

    .produto-image-container {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .produto-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer;
      transition: transform 0.3s ease;
    }

    .produto-image:hover {
      transform: scale(1.05);
    }

    .produto-overlay {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .produto-card:hover .produto-overlay {
      opacity: 1;
    }

    .quick-action-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: all 0.2s ease;
      backdrop-filter: blur(4px);
    }

    .quick-action-btn:hover {
      background: white;
      transform: scale(1.1);
    }

    .quick-action-btn.active {
      background: #ff6b6b;
      color: white;
    }

    .produto-info {
      padding: 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .produto-category {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    .produto-name {
      font-size: 18px;
      font-weight: bold;
      margin: 0;
      color: #333;
      cursor: pointer;
      transition: color 0.2s ease;
      line-height: 1.3;
    }

    .produto-name:hover {
      color: #007bff;
    }

    .produto-description {
      font-size: 14px;
      color: #666;
      line-height: 1.4;
      margin: 0;
      flex: 1;
    }

    .produto-rating {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 4px 0;
    }

    .stars {
      display: flex;
      gap: 2px;
    }

    .star {
      font-size: 14px;
      filter: grayscale(100%);
    }

    .star.filled {
      filter: grayscale(0%);
    }

    .rating-text {
      font-size: 12px;
      color: #666;
    }

    .produto-pricing {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
    }

    .price-current {
      font-size: 20px;
      font-weight: bold;
      color: #28a745;
    }

    .price-original {
      font-size: 14px;
      color: #999;
      text-decoration: line-through;
    }

    .discount-badge {
      background: #ff6b6b;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }

    .stock-status {
      font-size: 12px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 4px;
      text-align: center;
    }

    .stock-status.in-stock {
      background: #d4edda;
      color: #155724;
    }

    .stock-status.low-stock {
      background: #fff3cd;
      color: #856404;
    }

    .stock-status.out-of-stock {
      background: #f8d7da;
      color: #721c24;
    }

    .produto-actions {
      padding: 16px;
      display: flex;
      gap: 8px;
      border-top: 1px solid #f0f0f0;
    }

    .btn {
      flex: 1;
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      text-decoration: none;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-primary.loading {
      background: #6c757d;
    }

    .btn-secondary {
      background: #f8f9fa;
      color: #333;
      border: 1px solid #dee2e6;
    }

    .btn-secondary:hover {
      background: #e9ecef;
    }

    .produto-tags {
      padding: 0 16px 16px;
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .produto-tag {
      font-size: 11px;
      background: #f8f9fa;
      color: #666;
      padding: 2px 6px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .produto-tag:hover {
      background: #007bff;
      color: white;
    }

    @media (max-width: 768px) {
      .produto-image-container {
        height: 160px;
      }

      .produto-info {
        padding: 12px;
      }

      .produto-actions {
        padding: 12px;
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class ProdutoCardComponent implements OnInit {
  @Input() produto!: Produto;
  @Input() showQuickActions: boolean = true;
  @Input() showTags: boolean = true;
  @Input() showRating: boolean = true;

  @Output() productClick = new EventEmitter<Produto>();
  @Output() addToCart = new EventEmitter<Produto>();
  @Output() addToWishlist = new EventEmitter<Produto>();
  @Output() quickView = new EventEmitter<Produto>();
  @Output() tagClick = new EventEmitter<string>();

  isAddingToCart = false;

  constructor(private loggingService: SimpleLoggingService) {}

  ngOnInit(): void {
    // Log quando o card é exibido
    this.loggingService.logCriticalEvent('PRODUTO_CARD_DISPLAYED', {
      productId: this.produto.id,
      productName: this.produto.name,
      category: this.produto.category,
      price: this.produto.price
    });
  }

  @LogUserAction('PRODUTO_IMAGE_CLICKED', 'ProductCardComponent')
  onImageClick(): void {
    this.loggingService.logCriticalEvent('PRODUTO_IMAGE_CLICKED', {
      productId: this.produto.id,
      productName: this.produto.name
    });
    this.productClick.emit(this.produto);
  }

  @LogUserAction('PRODUTO_TITLE_CLICKED', 'ProductCardComponent')
  onTitleClick(): void {
    this.loggingService.logCriticalEvent('PRODUTO_TITLE_CLICKED', {
      productId: this.produto.id,
      productName: this.produto.name
    });
    this.productClick.emit(this.produto);
  }

  @LogUserAction('PRODUTO_QUICK_VIEW', 'ProductCardComponent')
  onQuickView(): void {
    this.loggingService.logCriticalEvent('PRODUTO_QUICK_VIEW', {
      productId: this.produto.id,
      productName: this.produto.name
    });
    this.quickView.emit(this.produto);
  }

  @LogUserAction('PRODUTO_ADD_TO_CART', 'ProductCardComponent')
  async onAddToCart(): Promise<void> {
    if (!this.produto.inStock || this.isAddingToCart) return;

    this.isAddingToCart = true;

    try {
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 800));

      this.loggingService.logCriticalEvent('PRODUTO_ADDED_TO_CART', {
        productId: this.produto.id,
        productName: this.produto.name,
        price: this.produto.price,
        source: 'produto-card'
      });

      this.addToCart.emit(this.produto);

      // Feedback visual temporário
      setTimeout(() => {
        this.isAddingToCart = false;
      }, 500);

    } catch (error) {
      this.loggingService.logCriticalEvent('PRODUTO_ADD_TO_CART_ERROR', {
        productId: this.produto.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.isAddingToCart = false;
    }
  }

  @LogUserAction('PRODUTO_ADD_TO_WISHLIST', 'ProductCardComponent')
  onAddToWishlist(): void {
    this.produto.inWishlist = !this.produto.inWishlist;

    this.loggingService.logCriticalEvent('PRODUTO_WISHLIST_TOGGLE', {
      productId: this.produto.id,
      productName: this.produto.name,
      action: this.produto.inWishlist ? 'added' : 'removed'
    });

    this.addToWishlist.emit(this.produto);
  }

  @LogUserAction('PRODUTO_VIEW_DETAILS', 'ProductCardComponent')
  onViewDetails(): void {
    this.loggingService.logCriticalEvent('PRODUTO_DETAILS_REQUESTED', {
      productId: this.produto.id,
      productName: this.produto.name,
      source: 'produto-card'
    });
  }

  @LogUserAction('PRODUTO_TAG_CLICKED', 'ProductCardComponent')
  onTagClick(tag: string): void {
    this.loggingService.logCriticalEvent('PRODUTO_TAG_CLICKED', {
      productId: this.produto.id,
      tag: tag,
      productCategory: this.produto.category
    });
    this.tagClick.emit(tag);
  }

  onImageError(event: any): void {
    event.target.src = '/assets/images/produto-placeholder.jpg';

    this.loggingService.logCriticalEvent('PRODUTO_IMAGE_ERROR', {
      productId: this.produto.id,
      originalSrc: this.produto.imageUrl
    });
  }

  getShortDescription(): string {
    if (!this.produto.description) return '';
    return this.produto.description.length > 100
      ? this.produto.description.substring(0, 100) + '...'
      : this.produto.description;
  }

  getStars(): boolean[] {
    const stars = [];
    const rating = this.produto.rating || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating);
    }
    return stars;
  }

  getDiscountPercentage(): number {
    if (!this.produto.originalPrice || this.produto.originalPrice <= this.produto.price) {
      return 0;
    }
    return Math.round(((this.produto.originalPrice - this.produto.price) / this.produto.originalPrice) * 100);
  }

  getStockStatusClass(): string {
    if (!this.produto.inStock || this.produto.stockQuantity === 0) {
      return 'out-of-stock';
    } else if (this.produto.stockQuantity && this.produto.stockQuantity <= 5) {
      return 'low-stock';
    }
    return 'in-stock';
  }

  getStockStatusText(): string {
    if (!this.produto.inStock || this.produto.stockQuantity === 0) {
      return 'Fora de estoque';
    } else if (this.produto.stockQuantity && this.produto.stockQuantity <= 5) {
      return `Apenas ${this.produto.stockQuantity} restantes`;
    }
    return 'Em estoque';
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
