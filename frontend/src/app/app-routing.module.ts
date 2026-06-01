import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { CriarSenhaComponent } from './features/criar-senha/criar-senha.component';
import { ResetarSenhaComponent } from './resetar-senha/resetar-senha.component';
import { OAuthCallbackComponent } from './features/oauth-callback/oauth-callback.component';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

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
    path: 'criar-senha',
    component: CriarSenhaComponent
  },
  {
    path: 'resetar-senha',
    component: ResetarSenhaComponent
  },
  {
    path: 'auth/callback/google',
    component: OAuthCallbackComponent
  },
  {
    path: 'auth/callback/microsoft',
    component: OAuthCallbackComponent
  },
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'matricula',
    loadChildren: () => import('./features/matricula/matricula.module').then(m => m.MatriculaModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo', 'colaborador'] }
  },
  {
    path: 'turmas',
    loadChildren: () => import('./features/turmas/turmas.module').then(m => m.TurmasModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo', 'colaborador'] }
  },
  {
    path: 'salas',
    loadChildren: () => import('./features/salas/salas.module').then(m => m.SalasModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo', 'colaborador'] }
  },
  {
    path: 'disciplinas',
    loadChildren: () => import('./features/disciplinas/disciplinas.module').then(m => m.DisciplinasModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo', 'educador', 'colaborador'] }
  },
  {
    path: 'matriz-curricular',
    loadChildren: () => import('./features/matriz-curricular/matriz-curricular.module').then(m => m.MatrizCurricularModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo', 'educador', 'colaborador'] }
  },
  {
    path: 'educadores',
    loadChildren: () => import('./features/educadores/educadores.module').then(m => m.EducadoresModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo', 'educador', 'colaborador'] }
  },
  {
    path: 'colaboradores',
    loadChildren: () => import('./features/colaboradores/colaboradores.module').then(m => m.ColaboradoresModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo', 'colaborador'] }
  },
  {
    path: 'eventos',
    loadChildren: () => import('./features/eventos/eventos.module').then(m => m.EventosModule),
    canActivate: [AuthGuard],
    data: { roles: ['educador', 'educando', 'responsavel', 'colaborador', 'gestor', 'administrativo'] }
  },
  {
    path: 'caixa',
    loadChildren: () => import('./features/caixa/caixa.module').then(m => m.CaixaModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo', 'colaborador'] }
  },
  {
    path: 'mensalidades',
    loadChildren: () => import('./features/mensalidades/mensalidades.module').then(m => m.MensalidadesModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo', 'colaborador'] }
  },
  {
    path: 'fornecedores',
    loadChildren: () => import('./features/fornecedores/fornecedores.module').then(m => m.FornecedoresModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo', 'colaborador'] }
  },
  {
    path: 'contas-pagar',
    loadChildren: () => import('./features/contas-pagar/contas-pagar.module').then(m => m.ContasPagarModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo', 'colaborador'] }
  },
  {
    path: 'contratos',
    loadChildren: () => import('./features/contratos/contratos.module').then(m => m.ContratosModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo', 'colaborador'] }
  },
  {
    path: 'dashboard-financeiro',
    loadChildren: () => import('./features/dashboard-financeiro/dashboard-financeiro.module').then(m => m.DashboardFinanceiroModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo'] }
  },
  {
    path: 'dashboard-escolar',
    loadChildren: () => import('./features/dashboard-escolar/dashboard-escolar.module').then(m => m.DashboardEscolarModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo', 'educador', 'educando', 'responsavel', 'colaborador'] }
  },
  {
    path: 'avaliacoes',
    loadChildren: () => import('./features/avaliacoes/avaliacoes.module').then(m => m.AvaliacoesModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['educando', 'educador', 'responsavel'] }
  },
  {
    path: 'educandos',
    loadChildren: () => import('./features/educandos/educandos.module').then(m => m.EducandosModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['educando', 'responsavel', 'gestor', 'administrativo'] }
  },
  {
    path: 'responsaveis',
    loadChildren: () => import('./features/responsaveis/responsaveis.module').then(m => m.ResponsaveisModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['responsavel', 'gestor', 'administrativo'] }
  },
  {
    path: 'cronograma',
    loadChildren: () => import('./features/cronograma/cronograma.module').then(m => m.CronogramaModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'administrativo', 'educador', 'colaborador'] }
  },
  {
    path: 'criar-formulario',
    loadChildren: () => import('./features/criar-formulario/criar-formulario.module').then(m => m.CriarFormularioModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['gestor', 'colaborador', 'administrativo'] }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
