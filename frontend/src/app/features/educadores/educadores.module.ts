import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { EducadoresRoutingModule } from './educadores-routing.module';
import { EducadoresListComponent } from './components/educadores-list/educadores-list.component';
import { EducadorFormComponent } from './components/educador-form/educador-form.component';
import { MinhasTurmasComponent } from './components/minhas-turmas/minhas-turmas.component';
import { CronogramaEducadorComponent } from './components/cronograma-educador/cronograma-educador.component';
import { CompetenciasComponent } from './components/competencias/competencias.component';

@NgModule({
  declarations: [
    EducadoresListComponent,
    EducadorFormComponent,
    MinhasTurmasComponent,
    CronogramaEducadorComponent,
    CompetenciasComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    EducadoresRoutingModule
  ]
})
export class EducadoresModule { }
