import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'toArray',
    standalone: false
})
export class ToArrayPipe implements PipeTransform {

  transform(dict: any, args?: any): any {
    return Object.keys(dict).map(key => dict[key])
  }

}
