import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContasPagarListComponent } from './components/contas-pagar-list/contas-pagar-list.component';

const routes: Routes = [
  { path: '', component: ContasPagarListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContasPagarRoutingModule { }
