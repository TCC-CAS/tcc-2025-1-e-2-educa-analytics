import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RECAPTCHA_SETTINGS, RecaptchaModule } from 'ng-recaptcha';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { LoginComponent } from './features/login/login.component';
import { CriarSenhaComponent } from './features/criar-senha/criar-senha.component';
import { ResetarSenhaComponent } from './resetar-senha/resetar-senha.component';
import { OAuthCallbackComponent } from './features/oauth-callback/oauth-callback.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    CriarSenhaComponent,
    ResetarSenhaComponent,
    OAuthCallbackComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
    RecaptchaModule
  ],
  providers: [
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: {
        siteKey: '6Lf37_MsAAAAAK997gkVdKgqQrBjLYkhrDpCCO8-'
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
