import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EducandosRoutingModule } from './educandos-routing.module';
import { PortalEducandoComponent } from './components/portal-educando/portal-educando.component';

@NgModule({
  declarations: [
    PortalEducandoComponent
  ],
  imports: [
    CommonModule,
    EducandosRoutingModule
  ]
})
export class EducandosModule { }
