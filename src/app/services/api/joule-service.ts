import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { share } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { normalize } from 'normalizr';
import * as schema from '../../api';
import { MessageService } from '../message.service';
import * as _ from 'lodash-es';
import { entityFactory, 
  defaultDbFolder, 
  defaultDbStream, 
  defaultDbElement, 
  defaultEventStream} from '../../store/data/initial-state'
import { IEventStream } from '../../store/data';
import * as actions from '../../store/data/actions';
import { DbStreamService } from './db-stream.service';
import { EventStreamService } from './event-stream.service';
import { ColorService } from './color.service';
import { IState } from 'src/app/explorer/store/plot';
import { defaultPlotState } from 'src/app/explorer/store/plot/initial-state';
import * as plotActions from '../../explorer/store/plot/actions'
import { IRange } from 'src/app/explorer/store';

@Injectable()
export class JouleService {


  constructor(
    private http: HttpClient,
    private store: Store,
    private messageService: MessageService,
    private colorService: ColorService,
  ) { }


  public loadObjects(config_data: IDataViewURLQuery) {
    //pass a list of data streams and event streams to API and receive all of the associated folders and their
    //contents which are then added to the data store
    let o = this.http
      .put<schema.IApiResponse>(`data_views/map_joule_objects.json`, config_data.joule_objects)
      .pipe(share());

    o.subscribe(
    {
      next: (json) => this._dispatch(json.data, config_data),
      error:(error) => this.messageService.setErrorsFromAPICall(error)
    });
    return o; //for other subscribers
  }

  // -------- private helper functions --------
  private _dispatch(api_data: any, config_data: IDataViewURLQuery) {
    let object_map: IObjectMaps = api_data.object_map
    let entities = normalize(api_data.db_folders, schema.dbFolders).entities;
    let folders = entityFactory(entities['dbFolders'], defaultDbFolder);
    this.store.dispatch(actions.receiveDbFolder({folders}));
    let event_streams = entityFactory(entities['eventStreams'], defaultEventStream);
    let streams = entityFactory(entities['dbStreams'], defaultDbStream);
    this.store.dispatch(actions.receiveDbStream({streams}));
    let elements = entityFactory(entities['dbElements'], defaultDbElement);

    //configure the event streams
    //The object_map has the link between Joule ID and (Lumen) ID {id: X, joule_id: Y}
    let api_id = (joule_id: number) => object_map.event_streams.find(x=>x.joule_id==joule_id).id

    let configured_event_streams = event_streams.reduce((acc: Array<IEventStream>,event_stream) => {
      //check if this event stream has one or more configurations
      let configs = config_data.event_streams.filter(event_config => api_id(event_config.id).toString()==event_stream.id)
      if(configs.length==0){ //this event stream is not part of the plot, leave the defaults unchanged
        return [...acc, event_stream]
      }
      let copy_index = 0
      let event_stream_copies = configs.map((config)=>{
        let new_event_stream = <IEventStream>_.cloneDeep(event_stream)
        //make sure the event_stream has a unique id since it may be a duplicate displayed version
        if(copy_index>0)
          new_event_stream.id = `${event_stream.id}_${copy_index}`
        copy_index += 1
        //this event stream has a configuration so it is part of the plot
        new_event_stream.plot_settings.display_name = config.display_name;
        //event stream color
        new_event_stream.default_color = this.colorService.requestEventColor();
        if(config.color){
          new_event_stream.plot_settings.color.type = config.color.setting_type;
          if(config.color.setting_type=='fixed')
            new_event_stream.plot_settings.color.value.fixed = config.color.value
          if(config.color.setting_type=='attribute')
            new_event_stream.plot_settings.color.value.attribute = config.color.value
        } else {
          new_event_stream.plot_settings.color.type = 'fixed'
          new_event_stream.plot_settings.color.value.fixed = new_event_stream.default_color;
        }
        //event stream label
        if(config.label){
          new_event_stream.plot_settings.label.type = config.label.setting_type;
          new_event_stream.plot_settings.label.size = config.label.size;
          if(config.label.setting_type=='fixed')
            new_event_stream.plot_settings.label.value.fixed = config.label.value
          if(config.label.setting_type=='attribute')
            new_event_stream.plot_settings.label.value.attribute = config.label.value
        }
        //event stream marker
        if(config.marker){
          new_event_stream.plot_settings.marker.type = config.marker.setting_type;
          new_event_stream.plot_settings.marker.size = config.marker.size;
          if(config.marker.setting_type=='fixed')
            new_event_stream.plot_settings.marker.value.fixed = config.marker.value
          if(config.marker.setting_type=='attribute')
            new_event_stream.plot_settings.marker.value.attribute = config.marker.value
        }
        //event stream position
        if(config.position){
          new_event_stream.plot_settings.position.type = config.position.setting_type;
          new_event_stream.plot_settings.position.axis = config.position.axis;
          if(config.position.setting_type=='fixed')
            new_event_stream.plot_settings.position.value.fixed = config.position.value
          if(config.position.setting_type=='attribute')
            new_event_stream.plot_settings.position.value.attribute = config.position.value
        }
        //event stream height
        if(config.height){
          new_event_stream.plot_settings.height.type = config.height.setting_type;
          if(config.height.setting_type=='fixed')
            new_event_stream.plot_settings.height.value.fixed = config.height.value
          if(config.height.setting_type=='attribute')
            new_event_stream.plot_settings.height.value.attribute = config.height.value
        }
        //event filter
        //syntax [ [ GRP ], [ GRP ], ...] where GRP = [[CLAUSE],[CLAUSE],...] 
        // where CLAUSE = [PROPERTY, OPERATOR, VALUE] 
        // where OPERATOR = eq|neq|gt|gte|lt|lte|is|not|like|unlike
        if(config.filter && config.filter.length>0){
          new_event_stream.filter_groups = config.filter.map(filter_group =>
            filter_group.map(clause => {
              return {key: clause[0], comparison: clause[1], value: clause[2]}})
          )
        }
        return new_event_stream;
      })
      return [...acc, ...event_stream_copies]
    }, []);
    this.store.dispatch(actions.receiveEventStream({streams: configured_event_streams}))

    //configure the elements
    //The API elements have a column field and db_stream_id (Lumen ID)
    //while the q.elements fields have an index (AKA column) and stream_id (Joule ID)
    //The object_map has the link between Joule ID and (Lumen) ID {id: X, joule_id: Y}
    //This map operation links the element configuration to an API element and issues the commands
    //to properly display it on the plot:
    api_id = (joule_id: number) => object_map.db_streams.find(x=>x.joule_id==joule_id).id

    let configuredElements = elements.map(element => {
      //check if this element has a configuration
      let config = config_data.elements.find(elem_config => api_id(elem_config.stream_id)==element.db_stream_id && elem_config.index==element.column)
      if(config==null){ //this element is not part of the plot, leave the defaults unchanged
        return element
      }
      //this element has a configuration so it is part of the plot
      element.display_name=config.display_name;
      //if a color is not specified use the color service
      if(config.color==""){
        element.color = this.colorService.requestColor();
      } else {
        element.color = config.color;
      }
      return element;
    });
    this.store.dispatch(actions.receiveDbElement({elements: configuredElements}));

    //make a list of the left axis elements
    let leftUnits = ''
    let leftElements: Array<number> = elements.reduce((acc: Array<number>, element)=>{
      let config = config_data.elements.find(elem_config => api_id(elem_config.stream_id)==element.db_stream_id && elem_config.index==element.column)
      if(config==null) //this element is not part of the plot, ignore
        return acc;
      if(config.axis=='left'||config.axis==''){ //try to add to the left axis
        if(leftUnits=='' || leftUnits==element.units){
          leftUnits=element.units;
          return [...acc,element.id]
        } else {
          if(config.axis=='')
            config.axis='right'; //push to the right axis
          else
            this.messageService.setWarning(`Incompatible Element Units on Left Axis, Ignoring ${element.name}`);
          return acc;
        }
      } else {
        return acc; //a right axis element
      }
    }, [])
    //make a list of the right axis elements
    let rightUnits = '';
    let rightElements: Array<number> = elements.reduce((acc: Array<number>, element)=>{
      let config = config_data.elements.find(elem_config => api_id(elem_config.stream_id)==element.db_stream_id && elem_config.index==element.column)
      if(config==null||config.axis!='right') //this element is not part of the plot or on the left axis
        return acc;
      if(rightUnits=='' || rightUnits==element.units){
          rightUnits=element.units;
          return [...acc,element.id]
      } else {
          this.messageService.setWarning(`Incompatible Element Units on Right Axis, Ignoring ${element.name}`);
          return acc;
      }
    }, [])
    
    //expand the tree nodes for the folders, data streams and event streams
    let folder_ids = object_map.db_folders.map(folder => `f${folder.id}`);
    let db_stream_ids = object_map.db_streams.map(db_stream => `s${db_stream.id}`);
    let expanded_ids = [`n${object_map.nilm}`].concat(folder_ids, db_stream_ids);

    let plotState: IState = {
      ...defaultPlotState,
      plot_time: config_data.main_time_bounds,
      nav_time: config_data.nav_time_bounds,
      //note Y limites have no effect because the plot is not initialized until there is data (main-plot.component.ts:79)
      plot_y1: config_data.left_y_bounds, 
      plot_y2: config_data.right_y_bounds,
      expanded_nodes: expanded_ids,
      left_elements: leftElements,
      right_elements: rightElements,
      left_units: leftUnits,
      right_units: rightUnits,
      event_streams: object_map.event_streams.map(event_stream => event_stream.id.toString()),
      show_plot: true
    }

            
    this.store.dispatch(plotActions.restoreDataView({saved_state: plotState}))
  }
}

export interface IDataViewURLQuery{
  joule_objects: IJouleObjects
  elements: Array<IURLQueryElementConfig>
  event_streams: Array<IURLQueryEventStreamConfig> //TODO
  nav_time_bounds: IRange
  main_time_bounds: IRange
  left_y_bounds: IRange
  right_y_bounds: IRange
}
export interface IURLQueryElementConfig{
  axis: string
  color: string
  display_name: string
  index: number
  stream_id: number
}
export interface IURLQueryEventStreamSetting{
  setting_type: string,
  value: string,
  size?: number,
  axis?: string
}
export interface IURLQueryEventStreamConfig{
  id: number,
  display_name: string,
  color: IURLQueryEventStreamSetting,
  marker: IURLQueryEventStreamSetting,
  label: IURLQueryEventStreamSetting,
  position: IURLQueryEventStreamSetting,
  height: IURLQueryEventStreamSetting
  filter: Array<Array<any>>
}
export interface IJouleObjects{
  event_stream_ids: Array<number>
  data_stream_ids: Array<number>
  folder_ids: Array<number>
}

export interface IObjectMap{
  id: number
  joule_id: number
}
export interface IObjectMaps{
  nilm: number
  db_folders: Array<IObjectMap>
  db_streams: Array<IObjectMap>
  event_streams: Array<IObjectMap>
}