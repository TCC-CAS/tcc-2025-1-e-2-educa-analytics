import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EducadoresRoutingModule } from './educadores-routing.module';
import { EducadoresListComponent } from './components/educadores-list/educadores-list.component';
import { EducadorFormComponent } from './components/educador-form/educador-form.component';
import { MinhasTurmasComponent } from './components/minhas-turmas/minhas-turmas.component';

@NgModule({
  declarations: [
    EducadoresListComponent,
    EducadorFormComponent,
    MinhasTurmasComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    EducadoresRoutingModule
  ]
})
export class EducadoresModule { }
