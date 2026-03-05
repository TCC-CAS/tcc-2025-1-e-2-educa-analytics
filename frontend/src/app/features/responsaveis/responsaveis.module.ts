import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResponsaveisRoutingModule } from './responsaveis-routing.module';
import { PortalResponsavelComponent } from './components/portal-responsavel/portal-responsavel.component';

@NgModule({
  declarations: [PortalResponsavelComponent],
  imports: [CommonModule, ResponsaveisRoutingModule]
})
export class ResponsaveisModule { }
