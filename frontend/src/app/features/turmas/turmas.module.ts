import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared.module';
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
    SharedModule,
    TurmasRoutingModule
  ]
})
export class TurmasModule { }
