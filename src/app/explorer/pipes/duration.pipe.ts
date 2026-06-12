import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

import {
  IRange
} from '../store';
@Pipe({
    name: 'duration',
    standalone: false
})
export class DurationPipe implements PipeTransform {

  constructor(private datePipe: DatePipe) { }

  transform(range: IRange, args?: any): string {

    if (range == null)
      return "";
    if (range.min == null || range.max == null)
      return "";
    var min = new Date(range.min); var max = new Date(range.max);
    var matchLevel = '';
    if (min.getFullYear() == max.getFullYear()) {
      matchLevel = "YEAR";
      if (min.getMonth() == max.getMonth()) {
        matchLevel = "MONTH";
        if (min.getDate() == max.getDate()) {
          matchLevel = "DAY";
          if (min.getHours() == max.getHours()) {
            matchLevel = "HOURS";
            if (min.getMinutes() == max.getMinutes()) {
              matchLevel = "MINUTES";
              if (min.getSeconds() == max.getSeconds()) {
                matchLevel = "SECONDS";
              }
            }
          }
        }
      }
    }
    switch (matchLevel) {
      case '': return this.datePipe.transform(min, "y") + " — " + this.datePipe.transform(max, "y");
      case "YEAR": return this.datePipe.transform(min,"y MMM") + " — " + this.datePipe.transform(max,"MMM");
      case "MONTH": return this.datePipe.transform(min,"y MMM d") + " — " + this.datePipe.transform(max,"d");
      case "DAY": //return min.format("yyyy mmm dd");
      case "HOURS": return this.datePipe.transform(min,"y MMM d HH:mm") + " — " + this.datePipe.transform(max,"HH:mm");
      case "MINUTES": return this.datePipe.transform(min,"y MMM d HH:mm");
      case "SECONDS": return this.datePipe.transform(min,"y MMM d HH:mm.ss");
    }
    return "error creating title";
  }
}
