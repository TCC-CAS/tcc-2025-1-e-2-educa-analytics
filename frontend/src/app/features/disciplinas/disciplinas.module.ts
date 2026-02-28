import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DisciplinasRoutingModule } from './disciplinas-routing.module';
import { DisciplinasListComponent } from './components/disciplinas-list/disciplinas-list.component';
import { DisciplinaFormComponent } from './components/disciplina-form/disciplina-form.component';

@NgModule({
  declarations: [
    DisciplinasListComponent,
    DisciplinaFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DisciplinasRoutingModule
  ]
})
export class DisciplinasModule { }
