import { Component, OnInit, Output, EventEmitter } from '@angular/core';

import { IDataView } from '../../../store/data';
import { DataViewService } from '../../../services';
import { PlotService } from '../../services/plot.service';
import {PlotSelectors} from '../../selectors/plot.selectors';
import {Observable} from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-load-data-view',
    templateUrl: './load-data-view.component.html',
    styleUrls: ['./load-data-view.component.css'],
    standalone: false
})
export class LoadDataViewComponent implements OnInit {

  @Output() loaded: EventEmitter<string>;
  public hasViews$: Observable<boolean>;
  public hasFilteredViews$: Observable<boolean>;

  constructor(
    public plotSelectors: PlotSelectors,
    public plotService: PlotService,
    private dataViewService: DataViewService
  ) {
    this.loaded = new EventEmitter();
   }

  ngOnInit() {

    this.hasViews$ = 
      this.plotSelectors.dataViews$.pipe(
        map(records => Object.keys(records)),
        map(ids => ids.length!=0));
        
    this.hasFilteredViews$ = 
      this.plotSelectors.filteredDataViews$
        .pipe(map(views => views.length>0))
  }

  loadDataView(view: IDataView){
    this.dataViewService.restoreDataView(view)
    this.loaded.next('success');
  }
  setDataViewFilterText(text: string){
    this.plotService.setDataViewFilterText(text);
  }
  setShowPublicDataViews(target: EventTarget){
    this.plotService.setShowPublicDataViews((target as HTMLInputElement).checked);
  }


}
