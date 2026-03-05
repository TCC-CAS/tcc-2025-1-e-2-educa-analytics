import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortalResponsavelComponent } from './components/portal-responsavel/portal-responsavel.component';

const routes: Routes = [
  { path: '', component: PortalResponsavelComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResponsaveisRoutingModule { }
