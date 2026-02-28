import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FrequenciaRoutingModule } from './frequencia-routing.module';
import { FrequenciaListComponent } from './components/frequencia-list/frequencia-list.component';

@NgModule({
  declarations: [
    FrequenciaListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FrequenciaRoutingModule
  ]
})
export class FrequenciaModule { }
