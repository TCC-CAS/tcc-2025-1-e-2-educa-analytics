import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DashboardEscolarRoutingModule } from './dashboard-escolar-routing.module';
import { DashboardEscolarComponent } from './components/dashboard-escolar/dashboard-escolar.component';

@NgModule({
  declarations: [
    DashboardEscolarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DashboardEscolarRoutingModule
  ]
})
export class DashboardEscolarModule { }
