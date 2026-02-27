import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'matricula',
    loadChildren: () => import('./features/matricula/matricula.module').then(m => m.MatriculaModule)
  },
  {
    path: 'turmas',
    loadChildren: () => import('./features/turmas/turmas.module').then(m => m.TurmasModule)
  },
  {
    path: 'disciplinas',
    loadChildren: () => import('./features/disciplinas/disciplinas.module').then(m => m.DisciplinasModule)
  },
  {
    path: 'educadores',
    loadChildren: () => import('./features/educadores/educadores.module').then(m => m.EducadoresModule)
  },
  {
    path: 'colaboradores',
    loadChildren: () => import('./features/colaboradores/colaboradores.module').then(m => m.ColaboradoresModule)
  },
  {
    path: 'eventos',
    loadChildren: () => import('./features/eventos/eventos.module').then(m => m.EventosModule)
  },
  {
    path: 'frequencia',
    loadChildren: () => import('./features/frequencia/frequencia.module').then(m => m.FrequenciaModule)
  },
  {
    path: 'notas',
    loadChildren: () => import('./features/notas/notas.module').then(m => m.NotasModule)
  },
  {
    path: 'caixa',
    loadChildren: () => import('./features/caixa/caixa.module').then(m => m.CaixaModule)
  },
  {
    path: 'fornecedores',
    loadChildren: () => import('./features/fornecedores/fornecedores.module').then(m => m.FornecedoresModule)
  },
  {
    path: 'dashboard-financeiro',
    loadChildren: () => import('./features/dashboard-financeiro/dashboard-financeiro.module').then(m => m.DashboardFinanceiroModule)
  },
  {
    path: 'dashboard-escolar',
    loadChildren: () => import('./features/dashboard-escolar/dashboard-escolar.module').then(m => m.DashboardEscolarModule)
  },
  {
    path: 'avaliacoes',
    loadChildren: () => import('./features/avaliacoes/avaliacoes.module').then(m => m.AvaliacoesModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
