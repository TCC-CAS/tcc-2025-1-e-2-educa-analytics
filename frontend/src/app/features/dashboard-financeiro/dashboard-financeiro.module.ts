import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DashboardFinanceiroRoutingModule } from './dashboard-financeiro-routing.module';
import { DashboardFinanceiroComponent } from './components/dashboard-financeiro/dashboard-financeiro.component';

@NgModule({
  declarations: [
    DashboardFinanceiroComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DashboardFinanceiroRoutingModule
  ]
})
export class DashboardFinanceiroModule { }
