import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CriarFormularioComponent } from './components/criar-formulario/criar-formulario.component';

const routes: Routes = [
  { path: '', component: CriarFormularioComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CriarFormularioRoutingModule { }
