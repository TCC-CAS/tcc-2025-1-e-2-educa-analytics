import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EducadoresListComponent } from './components/educadores-list/educadores-list.component';
import { EducadorFormComponent } from './components/educador-form/educador-form.component';
import { MinhasTurmasComponent } from './components/minhas-turmas/minhas-turmas.component';
import { CronogramaEducadorComponent } from './components/cronograma-educador/cronograma-educador.component';

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
    path: 'cronograma',
    component: CronogramaEducadorComponent
  },
  {
    path: 'minhas-turmas',
    component: MinhasTurmasComponent
  },
  {
    path: ':id/editar',
    component: EducadorFormComponent
  },
  {
    path: ':id/minhas-turmas',
    component: MinhasTurmasComponent
  },
  {
    path: ':id/cronograma',
    component: CronogramaEducadorComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EducadoresRoutingModule { }
