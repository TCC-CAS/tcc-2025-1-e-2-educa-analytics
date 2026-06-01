import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotasListComponent } from './components/notas-list/notas-list.component';

const routes: Routes = [
  {
    path: '',
    component: NotasListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotasRoutingModule { }
