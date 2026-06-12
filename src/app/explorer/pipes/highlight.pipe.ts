import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'highlightFilter',
    standalone: false
})
  export class HighlightPipe implements PipeTransform {
    // from https://gist.github.com/adamrecsko/0f28f474eca63e0279455476cc11eca7
    transform(text: string, search: string): string {
        if (search === undefined){
            return text;
        }
        var pattern = search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        pattern = pattern.split(' ').filter((t) => {
            return t.length > 0;
        }).join('|');
        var regex = new RegExp(pattern, 'gi');

        return search ? text.replace(regex, (match) => `<span class="highlight">${match}</span>`) : text;
    }
  
  }