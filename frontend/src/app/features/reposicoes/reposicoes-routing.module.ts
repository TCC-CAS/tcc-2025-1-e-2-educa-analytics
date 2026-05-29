import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReposicoesListComponent } from './components/reposicoes-list/reposicoes-list.component';

const routes: Routes = [
  {
    path: '',
    component: ReposicoesListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReposicoesRoutingModule { }
