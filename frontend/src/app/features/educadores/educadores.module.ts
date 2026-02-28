import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EducadoresRoutingModule } from './educadores-routing.module';
import { EducadoresListComponent } from './components/educadores-list/educadores-list.component';
import { EducadorFormComponent } from './components/educador-form/educador-form.component';

@NgModule({
  declarations: [
    EducadoresListComponent,
    EducadorFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    EducadoresRoutingModule
  ]
})
export class EducadoresModule { }
