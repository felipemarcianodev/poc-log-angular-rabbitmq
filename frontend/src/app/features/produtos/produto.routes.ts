import { Routes } from "@angular/router";
import { LoggingRouteGuard } from "../../core/logging/guards/logging-route.guard";
import { ProdutoComponent } from "./pages/produto.component";
import { ProdutoDetalheComponent } from "./components/produto-detalhe.component";

export const routes: Routes = [
  {
    path: '', component: ProdutoComponent,  canActivate: [LoggingRouteGuard],
    children: [
      { path: 'detalhes', component: ProdutoDetalheComponent },
    ]
  }
];
