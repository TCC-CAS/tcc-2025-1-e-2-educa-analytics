import { Component } from '@angular/core';

type MatriculaTab = 'dados' | 'responsaveis';

@Component({
  selector: 'app-matricula',
  templateUrl: './matricula.component.html',
  styleUrls: ['./matricula.component.scss']
})
export class MatriculaComponent {
  activeTab: MatriculaTab = 'dados';

  setTab(tab: MatriculaTab): void {
    this.activeTab = tab;
  }
}
