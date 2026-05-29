import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatrizCurricularListComponent } from './components/matriz-curricular-list/matriz-curricular-list.component';
import { MatrizCurricularFormComponent } from './components/matriz-curricular-form/matriz-curricular-form.component';

const routes: Routes = [
  {
    path: '',
    component: MatrizCurricularListComponent
  },
  {
    path: 'serie',
    component: MatrizCurricularFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MatrizCurricularRoutingModule { }
