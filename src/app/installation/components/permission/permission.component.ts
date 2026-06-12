import { Component, Input, OnInit, EventEmitter } from '@angular/core';

import {
  IPermission,
} from '../../../store/data';


@Component({
    selector: 'app-permission',
    outputs: ['remove'],
    templateUrl: './permission.component.html',
    styleUrls: ['./permission.component.css'],
    standalone: false
})

export class PermissionComponent implements OnInit {

  @Input() permission: IPermission;
  remove: EventEmitter<IPermission>;

  constructor() { 
    this.remove = new EventEmitter();
  }

  ngOnInit() {
  }

  removePermission(){
    this.remove.emit(this.permission);
  }
}
