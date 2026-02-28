import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AvaliacoesListComponent } from './components/avaliacoes-list/avaliacoes-list.component';
import { AvaliacaoFormComponent } from './components/avaliacao-form/avaliacao-form.component';

const routes: Routes = [
  {
    path: '',
    component: AvaliacoesListComponent
  },
  {
    path: ':tipo',
    component: AvaliacaoFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AvaliacoesRoutingModule { }
