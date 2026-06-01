import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SalasRoutingModule } from './salas-routing.module';
import { SalasListComponent } from './components/salas-list/salas-list.component';
import { SalaFormComponent } from './components/sala-form/sala-form.component';

@NgModule({
  declarations: [
    SalasListComponent,
    SalaFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SalasRoutingModule
  ]
})
export class SalasModule { }
