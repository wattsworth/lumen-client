import { createSelector, Store, select } from '@ngrx/store';
import { Component } from '@angular/core';
import { IAppState } from './app.store';
import { global_UI_ } from './selectors';

//import {AppEpics} from './epics';

import {
  SessionService
} from './services';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent {

  uiSelect = (state: IAppState) => state?.ui?.global
  
  public pageHeader$ = this.store.pipe(select(createSelector(global_UI_, state=>state?.page_header)));

  constructor(
    //private epics: AppEpics,
    private sessionService: SessionService,
    private store: Store
  ) {
    /*
    //configure redux
    const epicMiddleware = createEpicMiddleware();

    const middleware = [
      createLogger({collapsed: true}),
      epicMiddleware
    ]*/

    

    
    //epicMiddleware.run(this.epics.root);
    
    sessionService.retrieveSiteSettings();
    
  }

}
