import { Injectable } from '@angular/core';
import { Produto } from '../models/produto.model';

@Injectable()
export class ProductService {

  getProduct(id: string): Produto{
    return new Produto('Teste', 'Teste', 1, 'A');
  }

  getRecommendations(id: string): Produto[]{
    return [new Produto('Teste', 'Teste', 1, 'B')];
  }
}
