import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortalEducandoComponent } from './components/portal-educando/portal-educando.component';
import { CronogramaEducandoComponent } from './components/cronograma-educando/cronograma-educando.component';

const routes: Routes = [
  {
    path: '',
    component: PortalEducandoComponent
  },
  {
    path: 'cronograma',
    component: CronogramaEducandoComponent
  },
  {
    path: ':id',
    component: PortalEducandoComponent
  },
  {
    path: ':id/cronograma',
    component: CronogramaEducandoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EducandosRoutingModule { }
