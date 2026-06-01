import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalasListComponent } from './components/salas-list/salas-list.component';
import { SalaFormComponent } from './components/sala-form/sala-form.component';

const routes: Routes = [
  {
    path: '',
    component: SalasListComponent
  },
  {
    path: 'nova',
    component: SalaFormComponent
  },
  {
    path: ':id/editar',
    component: SalaFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SalasRoutingModule { }
