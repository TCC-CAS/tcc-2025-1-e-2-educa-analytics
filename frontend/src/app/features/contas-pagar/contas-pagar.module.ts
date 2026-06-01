import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContasPagarRoutingModule } from './contas-pagar-routing.module';
import { ContasPagarListComponent } from './components/contas-pagar-list/contas-pagar-list.component';

@NgModule({
  declarations: [ContasPagarListComponent],
  imports: [CommonModule, FormsModule, ContasPagarRoutingModule]
})
export class ContasPagarModule { }
