import { Component, OnInit, Input, OnChanges, SimpleChange } from '@angular/core';
import {
  trigger, animate, style, transition
} from '@angular/animations';
import { PlotService } from '../../services/plot.service'

import { IRange } from '../../store';
import {BsDatepickerConfig} from 'ngx-bootstrap/datepicker';

@Component({
    animations: [
        trigger('fadeInOut', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate(500, style({ opacity: 1 }))
            ]),
            /*transition(':leave', [   // :leave is alias to '* => void'
              animate(500, style({ opacity: 0 }))
            ])*/
        ])
    ],
    selector: 'app-date-picker',
    templateUrl: './date-picker.component.html',
    styleUrls: ['./date-picker.component.css'],
    standalone: false
})
export class DatePickerComponent implements OnInit, OnChanges {
  @Input() timeRange: IRange;

  public startDate: Date;
  public endDate: Date;
  public startTime: Date;
  public endTime: Date;
  public invalidRange: boolean;
  public bsConfig: Partial<BsDatepickerConfig>;

  constructor(
    private plotService: PlotService
  ) { 
    this.invalidRange = false;
    this.bsConfig = Object.assign({}, {containerClass: 'theme-blue'});
  }

  ngOnInit() {
  }

  public setRange() {
    let range: IRange = {
      min: new Date(
        this.startDate.getFullYear(),
        this.startDate.getMonth(),
        this.startDate.getDate(),
        this.startTime.getHours(),
        this.startTime.getMinutes(),
        this.startTime.getSeconds(),
        this.startTime.getMilliseconds()
      ).getTime(),
      max: new Date(
        this.endDate.getFullYear(),
        this.endDate.getMonth(),
        this.endDate.getDate(),
        this.endTime.getHours(),
        this.endTime.getMinutes(),
        this.endTime.getSeconds(),
        this.endTime.getMilliseconds()
      ).getTime()
    }
    if(range.min>=range.max){
      this.invalidRange = true;
      return;
    }
    this.invalidRange = false;
    this.plotService.setPlotTimeRange(range);
    this.plotService.hideDateSelector();
  }
  public cancel(){
    this.invalidRange = false;
    this.plotService.hideDateSelector();
  }

  ngOnChanges(
    changes: { [propName: string]: SimpleChange }
  ): void {
    if (changes['timeRange'] !== undefined) {
      this.startDate = new Date(changes['timeRange'].currentValue.min);
      this.endDate = new Date(changes['timeRange'].currentValue.max);
      this.startTime = new Date(this.startDate);
      this.endTime = new Date(this.endDate);
      this.invalidRange = false;
    }

  }

}
