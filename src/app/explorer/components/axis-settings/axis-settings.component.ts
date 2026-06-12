import { Component, OnInit, OnDestroy, Input, Output, EventEmitter} from '@angular/core';
import {IAxisSettings } from '../../store';

import * as _ from 'lodash-es';

@Component({
    selector: 'app-axis-settings',
    templateUrl: './axis-settings.component.html',
    styleUrls: ['./axis-settings.component.css'],
    standalone: false
})
export class AxisSettingsComponent implements OnInit, OnDestroy{
  @Input() settings: IAxisSettings;
  @Output() changed: EventEmitter<IAxisSettings>;
  @Input("yaxis-settings") yaxis_settings: boolean;

  private prev_settings: IAxisSettings;

  constructor() {
    this.changed = new EventEmitter();
    this.prev_settings = Object.assign({},this.settings);
  }

  ngOnInit() {
    
  }

  ngOnDestroy(){
  }
  onBlur(){
  
    if(!_.isEqual(this.prev_settings,this.settings)){
      this.changed.next(this.settings);
      this.prev_settings = Object.assign({},this.settings);
    }    
  }

}
