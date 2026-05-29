import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AvaliacoesRoutingModule } from './avaliacoes-routing.module';
import { AvaliacoesListComponent } from './components/avaliacoes-list/avaliacoes-list.component';
import { AvaliacaoFormComponent } from './components/avaliacao-form/avaliacao-form.component';
import { AvaliacaoBnccFormComponent } from './components/avaliacao-bncc-form/avaliacao-bncc-form.component';

@NgModule({
  declarations: [
    AvaliacoesListComponent,
    AvaliacaoFormComponent,
    AvaliacaoBnccFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AvaliacoesRoutingModule
  ]
})
export class AvaliacoesModule { }
