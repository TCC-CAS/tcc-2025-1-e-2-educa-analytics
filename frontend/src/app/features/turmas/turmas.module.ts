import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TurmasRoutingModule } from './turmas-routing.module';
import { TurmasListComponent } from './components/turmas-list/turmas-list.component';
import { TurmaFormComponent } from './components/turma-form/turma-form.component';

@NgModule({
  declarations: [
    TurmasListComponent,
    TurmaFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TurmasRoutingModule
  ]
})
export class TurmasModule { }
