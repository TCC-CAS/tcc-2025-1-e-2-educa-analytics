import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EducadoresListComponent } from './components/educadores-list/educadores-list.component';
import { EducadorFormComponent } from './components/educador-form/educador-form.component';
import { MinhasTurmasComponent } from './components/minhas-turmas/minhas-turmas.component';
import { CronogramaEducadorComponent } from './components/cronograma-educador/cronograma-educador.component';
import { CompetenciasComponent } from './components/competencias/competencias.component';

const routes: Routes = [
  { path: '',                    component: EducadoresListComponent       },
  { path: 'novo',                component: EducadorFormComponent         },
  { path: ':id/editar',          component: EducadorFormComponent         },
  { path: 'cronograma',          component: CronogramaEducadorComponent   },
  { path: 'cronograma/:id',      component: CronogramaEducadorComponent   },
  { path: 'minhas-turmas',       component: MinhasTurmasComponent         },
  { path: 'minhas-turmas/:id',   component: MinhasTurmasComponent         },
  { path: 'competencias',        component: CompetenciasComponent         },
  { path: 'competencias/:id',    component: CompetenciasComponent         },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EducadoresRoutingModule { }
