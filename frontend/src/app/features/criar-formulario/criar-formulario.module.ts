import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CriarFormularioRoutingModule } from './criar-formulario-routing.module';
import { CriarFormularioComponent } from './components/criar-formulario/criar-formulario.component';

@NgModule({
  declarations: [CriarFormularioComponent],
  imports: [
    CommonModule,
    FormsModule,
    CriarFormularioRoutingModule
  ]
})
export class CriarFormularioModule { }
