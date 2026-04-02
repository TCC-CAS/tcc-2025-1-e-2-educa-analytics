import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NotasRoutingModule } from './notas-routing.module';
import { NotasListComponent } from './components/notas-list/notas-list.component';

@NgModule({
  declarations: [
    NotasListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NotasRoutingModule
  ]
})
export class NotasModule { }
