import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContratosRoutingModule } from './contratos-routing.module';
import { ContratosListComponent } from './components/contratos-list/contratos-list.component';

@NgModule({
  declarations: [ContratosListComponent],
  imports: [CommonModule, FormsModule, ContratosRoutingModule]
})
export class ContratosModule { }
