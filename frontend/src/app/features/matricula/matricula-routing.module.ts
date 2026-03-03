import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatriculaComponent } from './components/matricula/matricula.component';
import { ListaMatriculasComponent } from './components/lista-matriculas/lista-matriculas.component';

const routes: Routes = [
  {
    path: '',
    component: MatriculaComponent
  },
  {
    path: 'lista',
    component: ListaMatriculasComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MatriculaRoutingModule { }
