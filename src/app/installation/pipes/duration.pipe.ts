import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'duration',
    standalone: false
})
export class DurationPipe implements PipeTransform {

  transform(microseconds: number, args?: any): any {
    if(microseconds==null){
			return "Not Available";
		}
		var seconds = microseconds/1e6;
		if(microseconds<60){ //display as seconds
			return seconds.toString()+" seconds";
		} 
		else if(seconds<(60*60)){ //display as minutes
			return (seconds/(60)).toFixed(2).toString() + " minutes";
		}
		else if(seconds<(60*60*24)){//display as hours
			return (seconds/(60*60)).toFixed(2).toString() + " hours";
		}
		else if(seconds<(60*60*24*365)){//display as days
			return (seconds/(60*60*24)).toFixed(2).toString() + " days";
		} else{ //display as years
			return (seconds/(60*60*24*365)).toFixed(2).toString() + " years";
		}
  }

}
