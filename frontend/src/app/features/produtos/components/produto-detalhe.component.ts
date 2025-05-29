import { Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BaseLoggedComponent } from '../../../core/logging/components/base-logged.component';
import { LogAsyncAction } from '../../../core/logging/decorators/async-logging.decorator';
import { LogUserAction } from '../../../core/logging/decorators/logging.decorator';
import { TrackPerformance } from '../../../core/logging/decorators/performance-logging.decorator';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { Produto } from '../models/produto.model';
import { ProdutoService } from '../services/produto.service';
import { ProdutoCardComponent } from './produto-card.component';

@Component({
  selector: 'app-produto-detalhe',
  standalone: true,
  imports:[CommonModule, BrowserModule, RouterModule, ProdutoCardComponent],
  providers:[ProdutoService],
  template: `
    <div class="produto-detail" *ngIf="produto">
      <div class="produto-header">
        <button (click)="goBack()" class="btn-back">
          ← Voltar
        </button>
        <h1>{{ produto.name }}</h1>
      </div>

      <div class="produto-content">
        <div class="produto-image">
          <img [src]="produto.imageUrl" [alt]="produto.name" />
        </div>

        <div class="produto-info">
          <p class="produto-description">{{ produto.description }}</p>
          <p class="produto-price">R$ {{ produto.price | currency:'BRL' }}</p>

          <div class="produto-actions">
            <button (click)="viewProduct()" class="btn-primary">
              👁️ Visualizar Detalhes
            </button>
            <button (click)="addToCart()" class="btn-success">
              🛒 Adicionar ao Carrinho
            </button>
            <button (click)="purchaseProduct()" class="btn-warning">
              💳 Comprar Agora
            </button>
            <button (click)="loadRecommendations()" class="btn-info">
              💡 Ver Recomendações
            </button>
          </div>
        </div>
      </div>

      <div class="recommendations" *ngIf="recommendations.length > 0">
        <h3>Produtos Recomendados</h3>
        <div class="recommendations-grid">
          <app-produto-card
            *ngFor="let rec of recommendations"
            [produto]="rec"
            (productClick)="onRecommendationClick($event)">
          </app-produto-card>
        </div>
      </div>
    </div>

    <div class="loading" *ngIf="!produto">
      Carregando produto...
    </div>
  `,
  styles: [`
    .produto-detail {
      max-width: 1200px;
      margin: 0 auto;
    }

    .produto-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
    }

    .btn-back {
      padding: 8px 16px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .produto-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }

    .produto-image img {
      width: 100%;
      max-width: 400px;
      border-radius: 8px;
    }

    .produto-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    }

    .produto-actions button {
      padding: 12px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: opacity 0.2s;
    }

    .produto-actions button:hover {
      opacity: 0.9;
    }

    .btn-primary { background: #007bff; color: white; }
    .btn-success { background: #28a745; color: white; }
    .btn-warning { background: #ffc107; color: black; }
    .btn-info { background: #17a2b8; color: white; }

    .recommendations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      font-size: 18px;
    }
  `]
})
export class ProdutoDetalheComponent extends BaseLoggedComponent implements OnInit {
  produto: Produto | null = null;
  recommendations: Produto[] = [];
  productId: string = '';

  constructor(
    injector: Injector,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProdutoService
  ) {
    super(injector);
  }

  async ngOnInit(): Promise<void> {
    this.productId = this.route.snapshot.paramMap.get('id') || '';

    if (this.productId) {
      await this.loadProduct();
    }
  }

  @TrackPerformance('LOAD_PRODUTO', 2000)
  @LogAsyncAction('LOAD_PRODUTO', 'ProductDetailComponent')
  private async loadProduct(): Promise<void> {
    try {
      this.produto = await this.productService.getProduct(this.productId);
      this.logAction('PRODUTO_LOADED', {
        productId: this.productId,
        productName: this.produto?.name
      });
    } catch (error) {
      this.logAction('PRODUTO_LOAD_ERROR', {
        productId: this.productId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  @LogUserAction('PRODUTO_VIEWED', 'ProductDetailComponent', true)
  viewProduct(): void {
    console.log(`Visualizando produto: ${this.productId}`);
    this.logAction('PRODUTO_DETAILS_VIEWED', {
      productId: this.productId,
      productName: this.produto?.name,
      viewTime: new Date().toISOString()
    });
  }

  @LogUserAction('ADD_TO_CART', 'ProductDetailComponent')
  addToCart(): void {
    console.log(`Adicionando ao carrinho: ${this.productId}`);

    // Simular adição ao carrinho
    const cartSize = Math.floor(Math.random() * 5) + 1;

    this.logAction('CART_ITEM_ADDED', {
      productId: this.productId,
      productName: this.produto?.name,
      productPrice: this.produto?.price,
      cartSize
    });

    alert('Produto adicionado ao carrinho!');
  }

  @LogAsyncAction('PURCHASE_PRODUTO', 'ProductDetailComponent')
  async purchaseProduct(): Promise<void> {
    console.log(`Comprando produto: ${this.productId}`);

    try {
      // Simular processo de compra
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (Math.random() > 0.2) { // 80% de sucesso
        this.logAction('PURCHASE_COMPLETED', {
          productId: this.productId,
          productName: this.produto?.name,
          amount: this.produto?.price,
          paymentMethod: 'credit_card'
        });
        alert('Compra realizada com sucesso!');
      } else {
        throw new Error('Falha no processamento do pagamento');
      }
    } catch (error) {
      this.logAction('PURCHASE_FAILED', {
        productId: this.productId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      alert('Erro na compra. Tente novamente.');
    }
  }

  @TrackPerformance('LOAD_RECOMMENDATIONS', 1000)
  @LogAsyncAction('LOAD_RECOMMENDATIONS', 'ProductDetailComponent')
  async loadRecommendations(): Promise<void> {
    console.log('Carregando recomendações...');

    try {
      // Simular carregamento de recomendações
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));

      this.recommendations = await this.productService.getProdutos(this.productId);

      this.logAction('RECOMMENDATIONS_LOADED', {
        productId: this.productId,
        recommendationsCount: this.recommendations.length
      });
    } catch (error) {
      this.logAction('RECOMMENDATIONS_ERROR', {
        productId: this.productId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  @LogUserAction('RECOMMENDATION_CLICKED', 'ProductDetailComponent')
  onRecommendationClick(recommendedProduct: Produto): void {
    this.logAction('RECOMMENDATION_CLICKED', {
      originalProductId: this.productId,
      recommendedProductId: recommendedProduct.id,
      recommendedProductName: recommendedProduct.name
    });

    // Navegar para o produto recomendado
    this.router.navigate(['/produtos', recommendedProduct.id]);
  }

  @LogUserAction('NAVIGATION_BACK', 'ProductDetailComponent')
  goBack(): void {
    this.router.navigate(['/produtos']);
  }
}
