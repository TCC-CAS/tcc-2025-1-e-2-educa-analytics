import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContratosListComponent } from './components/contratos-list/contratos-list.component';

const routes: Routes = [
  { path: '', component: ContratosListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContratosRoutingModule { }
