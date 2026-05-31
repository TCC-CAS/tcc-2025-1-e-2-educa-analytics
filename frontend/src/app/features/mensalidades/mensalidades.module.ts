import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { MensalidadesRoutingModule } from './mensalidades-routing.module';
import { MensalidadesListComponent } from './components/mensalidades-list/mensalidades-list.component';

@NgModule({
  declarations: [MensalidadesListComponent],
  imports: [CommonModule, FormsModule, HttpClientModule, MensalidadesRoutingModule]
})
export class MensalidadesModule { }
