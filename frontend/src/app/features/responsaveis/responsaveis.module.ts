import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ResponsaveisRoutingModule } from './responsaveis-routing.module';
import { PortalResponsavelComponent } from './components/portal-responsavel/portal-responsavel.component';
import { CronogramaResponsavelComponent } from './components/cronograma-responsavel/cronograma-responsavel.component';

@NgModule({
  declarations: [PortalResponsavelComponent, CronogramaResponsavelComponent],
  imports: [CommonModule, HttpClientModule, ResponsaveisRoutingModule]
})
export class ResponsaveisModule { }
