import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EducadoresListComponent } from './components/educadores-list/educadores-list.component';
import { EducadorFormComponent } from './components/educador-form/educador-form.component';

const routes: Routes = [
  {
    path: '',
    component: EducadoresListComponent
  },
  {
    path: 'novo',
    component: EducadorFormComponent
  },
  {
    path: ':id/editar',
    component: EducadorFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EducadoresRoutingModule { }
