import { Component } from '@angular/core';
import { createLogger } from 'redux-logger'
import { NgReduxModule, NgRedux, DevToolsExtension } from '@angular-redux/store';
import { createEpicMiddleware } from 'redux-observable';

import {AppEpics} from './epics';
import { environment } from '../environments/environment';

import {
  SessionService
} from './services';

import {
  IAppState,
  rootReducer
} from './app.store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  public isStandalone: boolean;

  constructor(
    private ngRedux: NgRedux<IAppState>,
    private devTools: DevToolsExtension,
    private epics: AppEpics,
    private sessionService: SessionService
  ) {

    //set UI variables based on environment 
    this.isStandalone = environment.standalone;
    //configure redux
    const epicMiddleware = createEpicMiddleware();

    const middleware = [
      createLogger({collapsed: true}),
      epicMiddleware
    ]

    

    ngRedux.configureStore(rootReducer,
      {},
      middleware,
      devTools.isEnabled() ?
        [devTools.enhancer()] : 
        []
    );
    epicMiddleware.run(this.epics.root);
    //todo: add interceptor to insert API URL
    /*
    //configure angular2-token
    tokenService.init({
     
    })*/

    sessionService.validateToken();
  }

}
