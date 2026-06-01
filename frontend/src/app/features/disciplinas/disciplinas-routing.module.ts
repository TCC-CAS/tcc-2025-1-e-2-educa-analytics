import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DisciplinasListComponent } from './components/disciplinas-list/disciplinas-list.component';
import { DisciplinaFormComponent } from './components/disciplina-form/disciplina-form.component';

const routes: Routes = [
  {
    path: '',
    component: DisciplinasListComponent
  },
  {
    path: 'nova',
    component: DisciplinaFormComponent
  },
  {
    path: ':id/editar',
    component: DisciplinaFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DisciplinasRoutingModule { }
