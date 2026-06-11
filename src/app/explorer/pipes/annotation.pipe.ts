import { Pipe, PipeTransform } from '@angular/core';
import { IAnnotation } from '../../store/data';
import * as _ from 'lodash-es';

@Pipe({
    name: 'annotationFilter',
    standalone: false
})
  export class AnnotationPipe implements PipeTransform {
  
    transform(list: IAnnotation[], filterText: string): IAnnotation[] {
      return _.sortBy(list, ['start'])
        .filter(annotation => annotation.title.search(filterText) > -1)
      //return list ? list.filter(item => item.title.search(filterText) > -1) : [];
    }
  
  }