import { Component, OnInit } from '@angular/core';

import { Store, select } from '@ngrx/store';
import { global_UI_ } from '../../selectors';

@Component({
    selector: 'app-messages',
    templateUrl: './messages.component.html',
    styleUrls: ['./messages.component.css'],
    standalone: false
})
export class MessagesComponent {
  
  public messages$ = this.store.pipe(select(global_UI_))

  constructor(
    private store: Store
  ) { }


}
