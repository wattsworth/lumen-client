import { Component, OnInit } from '@angular/core';
import {SessionService} from '../../services';
import { Store, select, createSelector } from '@ngrx/store'
import {users_} from '../../selectors';

@Component({
    selector: 'app-session',
    templateUrl: './session.component.html',
    styleUrls: ['./session.component.css'],
    standalone: false
})
export class SessionComponent implements OnInit {

  userId$ = this.store.pipe(select(createSelector(users_,state=>state.current)))

  constructor(
    private sessionService: SessionService,
    private store: Store
  ) { }

  ngOnInit() {
  }


  public logout(){
    this.sessionService.logout();
  }
}
