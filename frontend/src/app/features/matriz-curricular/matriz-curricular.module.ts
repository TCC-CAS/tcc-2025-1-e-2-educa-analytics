import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatrizCurricularRoutingModule } from './matriz-curricular-routing.module';
import { MatrizCurricularListComponent } from './components/matriz-curricular-list/matriz-curricular-list.component';
import { MatrizCurricularFormComponent } from './components/matriz-curricular-form/matriz-curricular-form.component';
import { MatrizCurricularService } from './services/matriz-curricular.service';

@NgModule({
  declarations: [
    MatrizCurricularListComponent,
    MatrizCurricularFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatrizCurricularRoutingModule
  ],
  providers: [
    MatrizCurricularService
  ]
})
export class MatrizCurricularModule { }
