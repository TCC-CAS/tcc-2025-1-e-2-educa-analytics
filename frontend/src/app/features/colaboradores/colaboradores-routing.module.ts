import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ColaboradoresListComponent } from './components/colaboradores-list/colaboradores-list.component';
import { ColaboradorFormComponent } from './components/colaborador-form/colaborador-form.component';

const routes: Routes = [
  {
    path: '',
    component: ColaboradoresListComponent
  },
  {
    path: 'novo',
    component: ColaboradorFormComponent
  },
  {
    path: ':id/editar',
    component: ColaboradorFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ColaboradoresRoutingModule { }
