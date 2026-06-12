import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'interval',
    standalone: false
})
export class IntervalPipe implements PipeTransform {

  transform(value: number): any {
      let seconds = +value;
      if(seconds<60)
        return Math.floor(seconds).toString()+"sec ";
      else{
        let minutes = seconds/60
        if(Math.floor(minutes)==minutes)
          return minutes.toString()+"min";
        else
          return (minutes).toFixed(1)+" min";
      }
  }

}
