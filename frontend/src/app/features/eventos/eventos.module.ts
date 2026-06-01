import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EventosRoutingModule } from './eventos-routing.module';
import { EventosListComponent } from './components/eventos-list/eventos-list.component';
import { EventoFormComponent } from './components/evento-form/evento-form.component';

@NgModule({
  declarations: [
    EventosListComponent,
    EventoFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    EventosRoutingModule
  ]
})
export class EventosModule { }
