import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MensalidadesListComponent } from './components/mensalidades-list/mensalidades-list.component';

const routes: Routes = [
  { path: '', component: MensalidadesListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MensalidadesRoutingModule { }
