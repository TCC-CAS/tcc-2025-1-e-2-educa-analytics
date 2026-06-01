import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CaixaListComponent } from './components/caixa-list/caixa-list.component';
import { CaixaFormComponent } from './components/caixa-form/caixa-form.component';

const routes: Routes = [
  {
    path: '',
    component: CaixaListComponent
  },
  {
    path: 'novo',
    component: CaixaFormComponent
  },
  {
    path: ':id/editar',
    component: CaixaFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CaixaRoutingModule { }
