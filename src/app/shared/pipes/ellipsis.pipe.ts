import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'ellipsis',
    standalone: false
})
export class EllipsisPipe implements PipeTransform {

  transform(value: string, maxLength: number): any {
    if(maxLength===undefined){
      maxLength=10;
    }
    if (value == null)
      return value;
   
    if (value.length > maxLength) {
      return value.substring(0, maxLength) + '...';
    } else {
      return value;
    }
  }

}
