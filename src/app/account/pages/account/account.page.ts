import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {environment } from '../../../../environments/environment'

import {
  UserGroupService,
  NilmService,
  DataViewService,
  SessionService
} from '../../../services';

import {
  IUserState,
} from '../../../store/data';


import { AccountSelectors } from '../../account.selectors';
import { AccountService } from '../../account.service';
@Component({
    selector: 'app-account',
    templateUrl: './account.page.html',
    styleUrls: ['./account.page.css'],
    standalone: false
})
export class AccountPageComponent implements OnInit {

  public helpUrl: string;

  constructor(
    private nilmService: NilmService,
    private userGroupService: UserGroupService,
    public accountSelectors: AccountSelectors,
    public accountService: AccountService,
    public dataViewService: DataViewService, 
    private sessionService: SessionService
  ) {
    this.helpUrl = environment.helpUrl;
    this.sessionService.validateToken();
  }

  ngOnInit() {
    
    //load the nilms
    this.nilmService.loadNilms()
      .subscribe(
      () => { },
      () => { },
      () => this.accountService.setNilmsLoaded());
    //load the data views
    this.dataViewService.loadDataViews()
      .subscribe(
      () => { },
      () => { },
      () => this.accountService.setDataViewsLoaded());
    //load the user groups
    this.userGroupService.loadUserGroups()
      .subscribe(
      () => { },
      () => { },
      () => this.accountService.setUserGroupsLoaded());
  }
  
  
}
