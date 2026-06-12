import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ModalDirective } from 'ngx-bootstrap/modal';
import * as _ from 'lodash-es';

import {
  DataViewService
} from '../../../services';
import {
  IDataView,
} from '../../../store/data';
import { Store, createSelector, select } from '@ngrx/store';
import { dataViews_ } from '../../../selectors';

@Component({
    selector: 'app-data-views',
    templateUrl: './data-views.component.html',
    styleUrls: ['./data-views.component.css'],
    standalone: false
})
export class DataViewsComponent{
  @ViewChild('editDataViewModal', {static: false}) public editViewModal: ModalDirective;
  
  public dataViews$ = this.store.pipe(
    select(dataViews_),
    map(dataViews => Object.values(dataViews).filter(view => view.owner)));
  
  //the current view being editted
  public activeView: IDataView;

  constructor(
    private store: Store,
    public dataViewService: DataViewService,
    
  ) {
  }

  //make a bold title with muted description
  formatTitle(view: IDataView){
    let description = view.description==null ? '' : view.description;
    return `<b>${view.name}</b> <span class='text-muted'>${description}</span>`
  }

  editDataView(view: IDataView){
    this.activeView = _.cloneDeep(view);
    this.editViewModal.show();
  }
  updateDataView(view: IDataView){
    this.dataViewService.update(view)
      .subscribe( success => this.editViewModal.hide(),
      _ => console.log('error updating view'))
  }
}
