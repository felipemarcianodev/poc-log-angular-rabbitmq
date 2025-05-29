import { Injectable } from '@angular/core';
import { Produto } from '../models/produto.model';

@Injectable()
export class ProdutoService {

  getProduct(id: string): Produto{
    return new Produto('Teste', 'Teste', 1, 'A');
  }

  getProdutos(id: string): Produto[]{
    return [new Produto('Teste', 'Teste', 1, 'B')];
  }
}
