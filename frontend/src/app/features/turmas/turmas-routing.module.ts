import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TurmasListComponent } from './components/turmas-list/turmas-list.component';
import { TurmaFormComponent } from './components/turma-form/turma-form.component';

const routes: Routes = [
  {
    path: '',
    component: TurmasListComponent
  },
  {
    path: 'nova',
    component: TurmaFormComponent
  },
  {
    path: ':id/editar',
    component: TurmaFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TurmasRoutingModule { }
