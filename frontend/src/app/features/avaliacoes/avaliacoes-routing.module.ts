import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlMatcher, UrlSegment, UrlMatchResult } from '@angular/router';
import { AvaliacoesListComponent } from './components/avaliacoes-list/avaliacoes-list.component';
import { AvaliacaoFormComponent } from './components/avaliacao-form/avaliacao-form.component';
import { AvaliacaoBnccFormComponent } from './components/avaliacao-bncc-form/avaliacao-bncc-form.component';

/** Corresponde apenas a segmentos puramente numéricos (ex: 445700001). */
export function matchNumericId(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length === 1 && /^\d+$/.test(segments[0].path)) {
    return { consumed: segments, posParams: { id: segments[0] } };
  }
  return null;
}


const routes: Routes = [
  {
    path: '',
    component: AvaliacoesListComponent
  },
  {
    matcher: matchNumericId,
    component: AvaliacoesListComponent
  },
  {
    path: 'lp-anos-1-2',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'lp-anos-3-5',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'lp-anos-6-9',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'arte-anos-1-5',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'arte-anos-6-9',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'ef-anos-1-2',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'ef-anos-3-5',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'ef-anos-6-7',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'ef-anos-8-9',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'li-ano-6',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'li-ano-7',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'li-ano-8',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'li-ano-9',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'mat-ano-1',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'mat-ano-2',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'mat-ano-3',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'mat-ano-4',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'mat-ano-5',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'mat-ano-6',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'mat-ano-7',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'mat-ano-8',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'mat-ano-9',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'ci-ano-1',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'ci-ano-2',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'ci-ano-3',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'ci-ano-4',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'ci-ano-5',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'ci-ano-6',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'ci-ano-7',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'ci-ano-8',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'ci-ano-9',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'geo-ano-1',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'geo-ano-2',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'geo-ano-3',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'geo-ano-4',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'geo-ano-5',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'geo-ano-6',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'geo-ano-7',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'geo-ano-8',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'geo-ano-9',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'hist-ano-1',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'hist-ano-2',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'hist-ano-3',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'hist-ano-4',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'hist-ano-5',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'hist-ano-6',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'hist-ano-7',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'hist-ano-8',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: 'hist-ano-9',
    component: AvaliacaoBnccFormComponent
  },
  {
    path: ':tipo',
    component: AvaliacaoFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AvaliacoesRoutingModule { }
