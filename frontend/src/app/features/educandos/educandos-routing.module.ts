import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortalEducandoComponent } from './components/portal-educando/portal-educando.component';

const routes: Routes = [
  {
    path: '',
    component: PortalEducandoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EducandosRoutingModule { }
