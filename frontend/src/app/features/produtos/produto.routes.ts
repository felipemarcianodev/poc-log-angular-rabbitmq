import { Routes } from "@angular/router";
import { LoggingRouteGuard } from "../../core/logging/guards/logging-route.guard";
import { ProdutoComponent } from "./pages/produto.component";
import { ProdutoDetalheComponent } from "./components/produto-detalhe.component";

export const routes: Routes = [
  {
    path: 'produtos', component: ProdutoComponent,  canActivate: [LoggingRouteGuard],
    children: [
      { path: 'produtos/detalhes', component: ProdutoDetalheComponent },
    ]
  }
];
