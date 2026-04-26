import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CronogramaViewComponent } from './components/cronograma-view/cronograma-view.component';

const routes: Routes = [
  { path: '', component: CronogramaViewComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CronogramaRoutingModule { }
