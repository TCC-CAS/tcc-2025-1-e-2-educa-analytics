import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CronogramaViewComponent } from './components/cronograma-view/cronograma-view.component';
import { GerarAutomaticoComponent } from './components/gerar-automatico/gerar-automatico.component';
import { CronogramaGestorComponent } from './components/cronograma-gestor/cronograma-gestor.component';
import { CronogramaEducadorComponent } from './components/cronograma-educador/cronograma-educador.component';
import { CronogramaEducandoComponent } from './components/cronograma-educando/cronograma-educando.component';
import { CronogramaResponsavelComponent } from './components/cronograma-responsavel/cronograma-responsavel.component';

const routes: Routes = [
  { path: '', component: CronogramaViewComponent },
  { path: 'gestor', component: CronogramaGestorComponent },
  { path: 'educador', component: CronogramaEducadorComponent },
  { path: 'educando', component: CronogramaEducandoComponent },
  { path: 'responsavel', component: CronogramaResponsavelComponent },
  { path: 'gerar-automatico', component: GerarAutomaticoComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CronogramaRoutingModule { }
