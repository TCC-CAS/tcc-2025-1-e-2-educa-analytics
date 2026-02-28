import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FornecedoresListComponent } from './components/fornecedores-list/fornecedores-list.component';
import { FornecedorFormComponent } from './components/fornecedor-form/fornecedor-form.component';

const routes: Routes = [
  {
    path: '',
    component: FornecedoresListComponent
  },
  {
    path: 'novo',
    component: FornecedorFormComponent
  },
  {
    path: ':id/editar',
    component: FornecedorFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FornecedoresRoutingModule { }
