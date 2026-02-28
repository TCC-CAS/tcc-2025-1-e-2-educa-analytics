import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CaixaRoutingModule } from './caixa-routing.module';
import { CaixaListComponent } from './components/caixa-list/caixa-list.component';
import { CaixaFormComponent } from './components/caixa-form/caixa-form.component';

@NgModule({
  declarations: [
    CaixaListComponent,
    CaixaFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    CaixaRoutingModule
  ]
})
export class CaixaModule { }
