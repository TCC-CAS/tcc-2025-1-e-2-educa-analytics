import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { EducandosRoutingModule } from './educandos-routing.module';
import { PortalEducandoComponent } from './components/portal-educando/portal-educando.component';
import { CronogramaEducandoComponent } from './components/cronograma-educando/cronograma-educando.component';

@NgModule({
  declarations: [
    PortalEducandoComponent,
    CronogramaEducandoComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    EducandosRoutingModule
  ]
})
export class EducandosModule { }
