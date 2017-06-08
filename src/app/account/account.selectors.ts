import { Injectable } from '@angular/core';
import { NgRedux } from '@angular-redux/store';
import { Observable } from 'rxjs';
import { select } from '@angular-redux/store';
import * as _ from 'lodash';

import { IAppState } from '../app.store';
import{
  IUserRecord,
  IUserStoreRecord,
  IUserGroupRecord,
  IUserGroupStore
} from '../store/data';

@Injectable()
export class AccountSelectors {

  @select(['ui', 'account', 'nilms_loaded']) nilmsLoaded$: Observable<boolean>;
  @select(['ui', 'account', 'data_views_loaded']) dataViewsLoaded$: Observable<boolean>;
  @select(['ui', 'account', 'user_groups_loaded']) userGroupsLoaded$: Observable<boolean>;

  @select(['data', 'userGroups']) userGroups$: Observable<IUserGroupStore>

  public ownedGroups$: Observable<IUserGroupRecord[]>;
  public memberGroups$: Observable<IUserGroupRecord[]>;

  constructor() {
    this.ownedGroups$ = this.userGroups$.map(store => {
      return store.owner.map(id => store.entities[id]);
    });
    this.memberGroups$ = this.userGroups$.map(store => {
      return store.member.map(id => store.entities[id]);
    });
  }
}