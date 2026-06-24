import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { tap, map, share, take } from 'rxjs/operators';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { normalize } from 'normalizr';
import * as _ from 'lodash-es';
import * as schema from '../../api';
import { MessageService } from '../message.service';
import { DbElementService } from './db-element.service';
import { DbStreamService } from './db-stream.service';
import { ColorService } from './color.service';
import { EventStreamService } from './event-stream.service';

import {
  IDataView,
  IData,
  IDataViewRedux,
  IDbElement,
  IDbStream,
  IEventStream
} from '../../store/data';
import * as actions from '../../store/data/actions';
import * as plotActions from '../../explorer/store/plot/actions'
import * as plot from '../../explorer/store/plot';
import { defaultDataView, 
  entityFactory, 
  defaultDataViewRedux, 
  defaultEventStreamPlotSettings, 
  defaultEventStream 
} from '../../store/data/initial-state';
import { dbElements_, dbStreams_, eventStreams_, plot_UI_Ex_ } from '../../selectors';
import { Dictionary } from '@ngrx/entity';
import { JouleService } from './joule-service';

export const MAX_SAVE_DATA_LENGTH = 200;

@Injectable()
export class DataViewService {


  private dataViewsLoaded: boolean;
  private homeViewRestored: boolean; //only load the home view once

  constructor(
    private http: HttpClient,
    private store: Store,
    private messageService: MessageService,
    private elementService: DbElementService,
    private streamService: DbStreamService,
    private colorService: ColorService,
    private eventStreamService: EventStreamService,
    private jouleService: JouleService
  ) {
    this.dataViewsLoaded = false;
  }

  // ---- HTTP API Functions ----------

  //retrive data views from server
  //
  public loadDataViews() {
    if (this.dataViewsLoaded) {
      return EMPTY;
    }
    let o = this.http
      .get('data_views.json', {}).pipe(
      map(json => normalize(json, schema.dataViews).entities))
      .pipe(share());

    o.subscribe(
      entities => {
        this.dataViewsLoaded = true;
        let views = entityFactory(entities['data_views'], defaultDataView);
        this.store.dispatch(actions.receiveDataView({views}));
      },
      error => this.messageService.setErrorsFromAPICall(error)
    );
    return o; //for other subscribers
  }

  //remove a data view owned by the current user
  //
  public deleteDataView(view: IDataView) {
    this.http
      .delete<schema.IApiResponse>(`data_views/${view.id}.json`)
      .subscribe({
      next: json => {
        this.store.dispatch(actions.removeDataView({id:view.id}));
        this.messageService.setMessages(json['messages']);
      },
      error: error => this.messageService.setErrorsFromAPICall(error)
      })
  }


  //create a new data view
  //
  
  public create(name: string, description: string, 
    isPrivate: boolean, isHome: boolean, image: string): Observable<any> {

    let state = this.getDataViewState(true);

    let visibility = isPrivate ? 'private' : 'public'
    let params = {
      name: name,
      description: description,
      image: image,
      visibility: visibility,
      stream_ids: state.stream_ids,
      home: isHome,
      redux_json: compressToEncodedURIComponent(JSON.stringify(state.redux))
    }
    let o = this.http
      .post<schema.IApiResponse>('data_views.json', params).pipe(
      tap(json => this.messageService.setMessages(json.messages)),
      map(json => normalize(json.data, schema.dataView).entities),
      share()
    )

    o.subscribe(
      entities => {
        let views = entityFactory(entities['data_views'], defaultDataView);
        this.store.dispatch(actions.receiveDataView({views}));
      },
      error => this.messageService.setErrorsFromAPICall(error)
    );
    return o;
  }

  //update an existing data view
  //
  public update(view: IDataView): Observable<any> {
    let o = this.http
      .put<schema.IApiResponse>(`data_views/${view.id}.json`, {
        name: view.name,
        description: view.description,
        visibility: view.private ? 'private' : 'public',
        home: view.home
      }).pipe(
      tap(json => this.messageService.setMessages(json.messages)),
      map(json => normalize(json.data, schema.dataView).entities),
      share())

    o.subscribe(
      entities => {
        let views = entityFactory(entities['data_views'], defaultDataView);
        this.store.dispatch(actions.receiveDataView({views}));
      },
      error => this.messageService.setErrorsFromAPICall(error)
    );
    return o;
  }

  //load and restore a user's home view
  //
  public restoreHomeDataView() {
    if (this.homeViewRestored)
      return;
    this.homeViewRestored = true;
    this.http
      .get('data_views/home.json', {}).pipe(
       map(json => normalize(json, schema.dataView)),
       map(json => json.entities['data_views'][json.result]),
       map(json => ({...defaultDataView, ...json})))
      .subscribe({
      next: (view) => this.restoreDataView(view),
      error: error => {}//no home view
      });
  }

  //------------------ Local Functions -----------------------
  // Restore:
  // Set redux state from data view
  //
  public restoreDataView(view: IDataView) {
    //first clear the plot
    this.elementService.resetElements();
    this.store.dispatch(plotActions.hideAllElements())
    this.store.dispatch(plotActions.hideAllEvents())

    //add any missing keys to redux (compatibility with previous data view formats)
    let redux = {...defaultDataViewRedux, ...view.redux}
    //now set the plot & nav time ranges so we don't reload the data 
    //(they are null after HIDE_ALL_ELEMENTS)
    this.store.dispatch(plotActions.setPlotTimeRange({range: redux.ui_explorer.plot_time}))

    this.store.dispatch(plotActions.setNavTimeRange({range: redux.ui_explorer.nav_time}))

    //now load the data elements
    this.elementService.restoreElements(Object.values(redux.data_dbElements))

    

    //register colors with color service
    let newElements = redux.data_dbElements;
    Object.keys(newElements)
      .map(id => newElements[id])
      .map(element => {
        this.colorService.checkoutColor(element.color);
      })
    //fill in any missing plot_settings keys with defaults
    let eventStreams = Object.values(redux.data_eventStreams)
      .map(stream => {
        let new_stream = {...defaultEventStream, ...stream as IEventStream};
        new_stream.plot_settings = {...defaultEventStreamPlotSettings,
                                    ...(stream as IEventStream).plot_settings}
        this.colorService.checkoutEventColor(new_stream.default_color);
        //if the stream is missing a fixed color use the default color
        if(new_stream.plot_settings.color.value.fixed==null){
          new_stream.plot_settings.color.value.fixed = new_stream.default_color;
        }
        return new_stream;
      })
    //now load the event streams
    this.eventStreamService.restoreEventStreams(Object.values(eventStreams))

    //restore the plot
    this.store.dispatch(plotActions.restoreDataView({saved_state: redux.ui_explorer}))

    //load the associated streams if they haven't been retrieved already
    let dbStreams: Dictionary<IDbStream>;
    this.store.pipe(select(dbStreams_),take(1)).subscribe(state=>dbStreams=state)
    let viewStreamIds = _.uniq(_.keys(newElements)
      .map(id => newElements[id])
      .map(elem => elem.db_stream_id))
    let existingStreamIds = _.keys(dbStreams)
      .map(id => parseInt(id))
    let newStreamIds = _.difference(viewStreamIds, existingStreamIds)
    if (newStreamIds.length > 0)
      this.streamService.loadStreams(newStreamIds)

  }

  // GetDataViewState:
  // Compute redux state for the data view
  //
  
  public getDataViewState(includeData: boolean): IDataViewState {
    let allElements:Dictionary<IDbElement>
    this.store.select(dbElements_)
      .pipe(take(1)).subscribe(state => allElements=state);

    let eventStreams:Dictionary<IEventStream>
    this.store.select(eventStreams_)
      .pipe(take(1)).subscribe(state => eventStreams=state);
    
  
    let explorerState: plot.IState;
    this.store.select(plot_UI_Ex_)
      .pipe(take(1)).subscribe(state => explorerState=_.cloneDeep(state));
    let plottedElements = _.concat(
      explorerState.left_elements,
      explorerState.right_elements)
      .reduce((acc: any, id) => {
        acc[id] = allElements[id];
        return acc
      }, {});
    let plottedEventStreams = explorerState.event_streams.reduce((acc: any,id)=>{
      acc[id]=eventStreams[id];
      return acc
    }, {});

    //compute array of unique stream ids so we can organize
    //data views by permission on the server
    let stream_ids = _.uniq(Object.keys(plottedElements)
      .map(id => plottedElements[id].db_stream_id))
    
    let event_stream_ids = Object.keys(plottedEventStreams).map(id=>+id);
    //sanitize explorer ui state
    explorerState.show_date_selector = false; //hide in case it is visible
    if (includeData) {
      //remove nav_data and data that are not part of plottedElements
      explorerState.plot_data = Object.keys(plottedElements)
        .reduce((acc: any, id) => {
          let dataset = explorerState.plot_data[id];
          if (dataset === undefined) {
            return acc; //data is missing we can't save it
          }
          acc[id] = this.decimateDataset(dataset);
          return acc;
        }, {})
        explorerState.nav_data = Object.keys(plottedElements)
        .reduce((acc: any, id) => {
          let dataset = explorerState.nav_data[id];
          if (dataset === undefined) {
            return acc; //data is missing we can't save it
          }
          acc[id] = this.decimateDataset(dataset);
          return acc;
        }, {})
        explorerState.plot_event_data = Object.keys(plottedEventStreams)
        .reduce((acc: any,id) =>{
          let dataset = explorerState.plot_event_data[id];
          if (dataset === undefined) {
            return acc; //data is missing we can't save it
          }
          acc[id] = dataset
          return acc;
        },{})
        explorerState.nav_event_data = Object.keys(plottedEventStreams)
        .reduce((acc: any,id) =>{
          let dataset = explorerState.nav_event_data[id];
          if (dataset === undefined) {
            return acc; //data is missing we can't save it
          }
          acc[id] = dataset
          return acc;
        },{})
    } else {
      explorerState.plot_data = {};
      explorerState.nav_data = {};
      explorerState.plot_event_data = {};
      explorerState.nav_event_data = {};
    }
    return {
      redux: {
        ui_explorer: explorerState,
        data_dbElements: plottedElements,
        data_eventStreams: plottedEventStreams
      },
      stream_ids: stream_ids,
      event_stream_ids: event_stream_ids
    }
  }

  public loadViewFromURLQuery(raw_query: string){
    //given the string value of the 'view' query parameter, unpack and build a data structure
    //that can be used to populate the explorer state model
    let q = JSON.parse(decompressFromEncodedURIComponent(raw_query))
   
    //////////////////////////////
    //retrieve the data and event streams and folders based on their Joule ID's 
    this.jouleService.loadObjects(q);
  }

  public decimateDataset(dataset: IData) {
    let smallDataset: IData = { //manually copy so this is not an immutable record
      data: dataset.data,
      end_time: dataset.end_time,
      start_time: dataset.start_time,
      valid: dataset.valid,
      type: dataset.type
    }
    let data = dataset.data
    if (data !== undefined && data.length > MAX_SAVE_DATA_LENGTH) {
      //we need to decimate the data, there is too much
      smallDataset.data = [];
      //remove time stamps so the client will automatically reload this
      //data at the full resolution
      smallDataset.end_time = 0;
      smallDataset.start_time = 0;
      let step = Math.ceil(data.length / MAX_SAVE_DATA_LENGTH)
      for (let i = 0; i < data.length; i = i + step) {
        smallDataset.data.push(data[i])
      }
      //console.log('orig, decimated:', data.length, smallDataset.data.length)
    } else {
      //console.log('no decimation required: ',data.length, smallDataset.data.length);
    }
    return smallDataset

  }
}

export interface IDataViewState {
  redux: IDataViewRedux
  stream_ids: Array<number>
  event_stream_ids: Array<number>
}
export const defaultDataViewState: IDataViewState = {
  redux: defaultDataViewRedux,
  stream_ids: [],
  event_stream_ids: []
}

