import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardFinanceiroComponent } from './components/dashboard-financeiro/dashboard-financeiro.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardFinanceiroComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardFinanceiroRoutingModule { }
