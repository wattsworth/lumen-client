import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { appRoutes, JwtInterceptor } from './app-routing.module';
import { AppComponent } from './app.component';
import { SERVICE_PROVIDERS } from './services';
import { PageEffects } from './effects/page.effects';
import { AuthGuard } from './app.guards';
import { AlertModule } from 'ngx-bootstrap/alert';
import {ModalModule} from 'ngx-bootstrap/modal';
import {ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { StoreModule } from '@ngrx/store';

import { AccountModule } from './account/account.module';
import { InstallationModule } from './installation/installation.module';
import { ExplorerModule } from './explorer/explorer.module';

import {
  MessagesComponent,
  SessionComponent,
} from './components';


import {
  uiReducer,
} from './app.store';
import {
  reducer
} from './store/data'
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import { environment } from '../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


@NgModule({ declarations: [
        AppComponent,
        MessagesComponent,
        SessionComponent,
    ],
    bootstrap: [AppComponent], imports: [
        BrowserModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        AlertModule,
        ProgressbarModule,
        ModalModule,
        AccountModule,
        InstallationModule,
        ExplorerModule,
        appRoutes,
        StoreModule.forRoot({
            ui: uiReducer,
            data: reducer
        }),
        StoreDevtoolsModule.instrument({
            maxAge: 25, //retain last 25 states
            logOnly: environment.production,
            connectInZone: true
        }),
        EffectsModule.forRoot([PageEffects]),
        BrowserAnimationsModule], providers: [
        AuthGuard,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: JwtInterceptor,
            multi: true
        },
        SERVICE_PROVIDERS,
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule { }
