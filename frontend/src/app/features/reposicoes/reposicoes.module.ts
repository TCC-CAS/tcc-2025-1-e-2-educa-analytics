import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ReposicoesRoutingModule } from './reposicoes-routing.module';
import { ReposicoesListComponent } from './components/reposicoes-list/reposicoes-list.component';
import { ReposicoesService } from './services/reposicoes.service';

@NgModule({
  declarations: [
    ReposicoesListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ReposicoesRoutingModule
  ],
  providers: [
    ReposicoesService
  ]
})
export class ReposicoesModule { }
