import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortalResponsavelComponent } from './components/portal-responsavel/portal-responsavel.component';
import { CronogramaResponsavelComponent } from './components/cronograma-responsavel/cronograma-responsavel.component';

const routes: Routes = [
  { path: '', component: PortalResponsavelComponent },
  { path: 'cronograma', component: CronogramaResponsavelComponent },
  { path: 'cronograma/:id', component: CronogramaResponsavelComponent },
  { path: ':id', component: PortalResponsavelComponent },
  { path: ':id/cronograma', component: CronogramaResponsavelComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResponsaveisRoutingModule { }
