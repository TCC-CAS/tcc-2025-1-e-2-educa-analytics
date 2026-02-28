import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventosListComponent } from './components/eventos-list/eventos-list.component';
import { EventoFormComponent } from './components/evento-form/evento-form.component';

const routes: Routes = [
  {
    path: '',
    component: EventosListComponent
  },
  {
    path: 'novo',
    component: EventoFormComponent
  },
  {
    path: ':id/editar',
    component: EventoFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EventosRoutingModule { }
