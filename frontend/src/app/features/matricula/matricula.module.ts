import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatriculaRoutingModule } from './matricula-routing.module';
import { MatriculaComponent } from './components/matricula/matricula.component';
import { ListaMatriculasComponent } from './components/lista-matriculas/lista-matriculas.component';

@NgModule({
  declarations: [
    MatriculaComponent,
    ListaMatriculasComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatriculaRoutingModule
  ]
})
export class MatriculaModule { }
