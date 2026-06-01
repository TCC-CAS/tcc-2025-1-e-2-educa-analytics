import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ColaboradoresRoutingModule } from './colaboradores-routing.module';
import { ColaboradoresListComponent } from './components/colaboradores-list/colaboradores-list.component';
import { ColaboradorFormComponent } from './components/colaborador-form/colaborador-form.component';

@NgModule({
  declarations: [
    ColaboradoresListComponent,
    ColaboradorFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ColaboradoresRoutingModule
  ]
})
export class ColaboradoresModule { }
