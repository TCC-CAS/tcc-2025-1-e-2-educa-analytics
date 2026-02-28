import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardEscolarComponent } from './components/dashboard-escolar/dashboard-escolar.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardEscolarComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardEscolarRoutingModule { }
