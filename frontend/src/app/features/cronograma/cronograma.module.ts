import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { CronogramaRoutingModule } from './cronograma-routing.module';
import { CronogramaViewComponent } from './components/cronograma-view/cronograma-view.component';
import { GerarAutomaticoComponent } from './components/gerar-automatico/gerar-automatico.component';
import { CronogramaGestorComponent } from './components/cronograma-gestor/cronograma-gestor.component';
import { CronogramaEducadorComponent } from './components/cronograma-educador/cronograma-educador.component';
import { CronogramaEducandoComponent } from './components/cronograma-educando/cronograma-educando.component';
import { CronogramaResponsavelComponent } from './components/cronograma-responsavel/cronograma-responsavel.component';

@NgModule({
  declarations: [
    CronogramaViewComponent,
    GerarAutomaticoComponent,
    CronogramaGestorComponent,
    CronogramaEducadorComponent,
    CronogramaEducandoComponent,
    CronogramaResponsavelComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    CronogramaRoutingModule
  ]
})
export class CronogramaModule { }
