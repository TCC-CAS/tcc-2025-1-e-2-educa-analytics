import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FrequenciaListComponent } from './components/frequencia-list/frequencia-list.component';

const routes: Routes = [
  {
    path: '',
    component: FrequenciaListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FrequenciaRoutingModule { }
