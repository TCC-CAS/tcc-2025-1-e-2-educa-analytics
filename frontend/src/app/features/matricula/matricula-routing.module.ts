import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatriculaComponent } from './components/matricula/matricula.component';
import { ListaMatriculasComponent } from './components/lista-matriculas/lista-matriculas.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'lista',
    pathMatch: 'full'
  },
  {
    path: 'lista',
    component: ListaMatriculasComponent
  },
  {
    path: 'nova',
    component: MatriculaComponent
  },
  {
    path: 'editar/:id',
    component: ListaMatriculasComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MatriculaRoutingModule { }
