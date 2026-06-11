
import { Component, Input, OnInit } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Store, select, createSelector } from '@ngrx/store';
import {
  PermissionService
} from '../../../services';

import {
  IPermission,
  IUserGroup,
  IUser

} from '../../../store/data';
import { InstallationSelectors } from '../../installation.selectors';
import { permissions_, users_, userGroups_ } from '../../../selectors';

@Component({
    selector: 'installation-admin-tab',
    templateUrl: './admin.tab.html',
    styleUrls: ['./admin.tab.css'],
    standalone: false
})
export class AdminTabComponent implements OnInit {

  permissions$ = this.store.pipe(select(permissions_));
  users$ = this.store.pipe(select(createSelector(users_,state=>state.entities)));
  groups$ = this.store.pipe(select(createSelector(userGroups_,state=>state.entities)));
  public admins$: Observable<IPermission[]>
  public owners$: Observable<IPermission[]>
  public viewers$: Observable<IPermission[]>

  private nilmSub: Subscription;
  constructor(
    private permissionService: PermissionService,
    public installationSelectors: InstallationSelectors,
    private store: Store
  ) { 
    
  }

  ngOnInit() {
    this.nilmSub = this.installationSelectors.nilm$.subscribe(
      nilm => this.permissionService.loadPermissions(nilm.id)
    )
    let nilmPermissions = combineLatest(
      this.installationSelectors.nilm$, this.permissions$).pipe(
      map(([nilm, permissions]) => {
        let values = Object.keys(permissions)
                                .map(id=>permissions[id])
        return values.filter(p => p.nilm_id==nilm.id)
      }));
    this.admins$ = nilmPermissions.pipe(map(permissions =>
      permissions.filter(p => p.role=='admin')))
    this.owners$ = nilmPermissions.pipe(map(permissions =>
      permissions.filter(p => p.role=='owner')))
    this.viewers$ = nilmPermissions.pipe(map(permissions =>
      permissions.filter(p => p.role=='viewer')))
  }

  ngOnDestroy() {
    this.nilmSub.unsubscribe();
  }
}
