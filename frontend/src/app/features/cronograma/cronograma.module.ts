import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CronogramaRoutingModule } from './cronograma-routing.module';
import { CronogramaViewComponent } from './components/cronograma-view/cronograma-view.component';

@NgModule({
  declarations: [CronogramaViewComponent],
  imports: [
    CommonModule,
    FormsModule,
    CronogramaRoutingModule
  ]
})
export class CronogramaModule { }
