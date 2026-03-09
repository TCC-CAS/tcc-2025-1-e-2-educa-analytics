import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Pipes
import { SafePipe } from './pipes/safe.pipe';

// Directives
import { HighlightDirective } from './directives/highlight.directive';

// Components
import { NotificationComponent } from './components/notification/notification.component';
import { LoadingComponent } from './components/loading/loading.component';
import { ButtonComponent } from './components/button/button.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';

@NgModule({
  declarations: [
    // Pipes
    SafePipe,
    // Directives
    HighlightDirective,
    // Components
    NotificationComponent,
    LoadingComponent,
    ButtonComponent,
    ConfirmModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Pipes
    SafePipe,
    // Directives
    HighlightDirective,
    // Components
    NotificationComponent,
    LoadingComponent,
    ButtonComponent,
    ConfirmModalComponent
  ]
})
export class SharedModule { }
