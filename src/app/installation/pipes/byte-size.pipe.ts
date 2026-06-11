import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'byteSize',
    standalone: false
})
export class ByteSizePipe implements PipeTransform {

  transform(bytes: number, args?: any): any {
    if(bytes<Math.pow(2,20)){ //show as KiB
			return (bytes/Math.pow(2,10)).toFixed(2)+' KiB';
		}
		else if(bytes<Math.pow(2,30)){ //show as MiB
			return (bytes/Math.pow(2,20)).toFixed(2)+' MiB';
		} 
		else{ //show as GiB
			return(bytes/Math.pow(2,30)).toFixed(2)+' GiB'
		}
  }

}
