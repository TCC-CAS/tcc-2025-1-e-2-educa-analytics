import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FornecedoresRoutingModule } from './fornecedores-routing.module';
import { FornecedoresListComponent } from './components/fornecedores-list/fornecedores-list.component';
import { FornecedorFormComponent } from './components/fornecedor-form/fornecedor-form.component';

@NgModule({
  declarations: [
    FornecedoresListComponent,
    FornecedorFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FornecedoresRoutingModule
  ]
})
export class FornecedoresModule { }
