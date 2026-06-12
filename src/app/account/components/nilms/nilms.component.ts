import { 
  Component,
  ViewChild,
  OnInit 
} from '@angular/core';
import { map } from 'rxjs/operators';
import { ModalDirective } from 'ngx-bootstrap/modal';
import * as _ from 'lodash-es';
import { Store, createSelector, select } from '@ngrx/store';
import {nilms_} from '../../../selectors';

import {
  NilmService,
  UserService
} from '../../../services';


import { AccountSelectors } from '../../account.selectors';

@Component({
    selector: 'app-account-nilms',
    templateUrl: './nilms.component.html',
    styleUrls: ['./nilms.component.css'],
    standalone: false
})
export class NilmsComponent implements OnInit {
  @ViewChild('nilmModal', {static: false}) public nilmModal: ModalDirective;

  nilms$ = this.store.pipe(select(nilms_),
    map(nilms => _.sortBy(Object.values(nilms),['name'])))

  constructor(
    private nilmService: NilmService,
    private userService: UserService,
    public accountSelectors: AccountSelectors,
    private store:Store
  ) { }

  ngOnInit() {
    this.nilmService.loadNilms();   
  }

  addNilm(){
    this.nilmModal.show()
    this.userService.requestInstallationToken()
  }

}