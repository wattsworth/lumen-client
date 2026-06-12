import { Dictionary, EntityState } from '@ngrx/entity';
import * as plot from '../../explorer/store/plot';

// ---- Nilm ----
export interface INilm {
  id: number;
  name: string;
  description: string;
  available: boolean;
  url: string;
  role: string;
  refreshing: boolean;
  max_points_per_plot: number;
  max_events_per_plot: number;
  root_folder: number; //id of database root
  data_apps: Array<number>;
}
export interface INilmState extends EntityState<INilm> { };


// ---- DataApp ----
export interface IDataApp{
  id: number;
  name: string;
  url: string;
  nilm_id: number;  //id of the NILM owner
}
export interface IDataAppState extends EntityState<IDataApp> { };


// ---- DbFolder ----
export interface IDbFolder {
  id: number;
  name: string;
  description: string;
  path: string;
  hidden: boolean;
  locked: boolean;
  subfolders: Array<number>;
  streams: Array<number>;
  event_streams: Array<string>;
  start_time: number;
  end_time: number;
  size_on_disk: number;
  shallow: boolean; // true if contents have not been retrieved from server
}
export interface IDbFolderState extends EntityState<IDbFolder> { };

// ---- DbStream ----
export interface IDbStream {
  id: number;
  name: string;
  description: string;
  path: string;
  start_time: number;
  end_time: number;
  size_on_disk: number;
  total_rows: number;
  total_time: number;
  data_type: string;
  name_abbrev: string;
  locked: boolean;
  hidden: boolean;
  active: boolean;
  elements: Array<number>;
  nilm_id: number;
  reloading_annotations: boolean;
}
export interface IDbStreamState extends EntityState<IDbStream> { };

export interface IEventStream {
  id: string;
  name: string;
  description: string;
  path: string;
  start_time: number;
  end_time: number;
  event_count: number;
  nilm_id: number;
  event_fields: Dictionary<string>
  //dynamically managed by the client
  default_color: string; //assigned by color service
  plot_settings: IEventStreamPlotSettings
  filter_groups: IEventStreamFilterGroups;
}
export interface IEventStreamState extends EntityState<IEventStream> { };

export interface IEventStreamPlotSettings{
  display_name: string;
  color: {
    type: string; //fixed, attribute, numeric
    value: {
      fixed: string;     //use this color (initialized to default)
      attribute: string; //use this attribute as CSS color
      numeric: {         //apply a color map
        attribute: string; //use this attribute as the numeric value for the event
        min: number;     //left end of color map
        max: number      //right end of color map
      }
    }
  },
  marker: {
    type: string; //fixed, attribute
    size: number;
    value: {
      fixed: string;
      attribute: string;
    }
  },
  label: {
    type: string; //fixed, attribute
    size: number;
    value: {
      fixed: string;
      attribute: string;
    }
  }
  position: {
    type: string; //fixed, attribute
    axis: string; //left, right, float
    value: {
      fixed: string;
      attribute: string;
    }
  }
  height: {
    type: string; //fixed, attribute
    value: {
      fixed: string;
      attribute: string;
    }
  }
}

export type IEventStreamFilterGroup = Array<IEventStreamFilter>
export type IEventStreamFilterGroups = Array<IEventStreamFilterGroup>

type numeric_comparison = 'lt'|'lte'|'gt'|'gte'|'eq'|'neq';
type string_comparison = 'like'|'unlike'|'is'|'not'
export interface IEventStreamFilter{
  key: string;
  comparison: numeric_comparison|string_comparison
  value: string|number;
}
// ---- DbElements ----
export interface IDbElement {
  id: number;
  db_stream_id: number;
  name: string;
  units: string;
  column: number;
  default_max: number;
  default_min: number;
  scale_factor: number;
  offset: number;
  plottable: boolean;
  display_type: string;
  path: string; 
  //dynamically managed by the client
  color: string;
  display_name: string;
}
export interface IDbElementState extends EntityState<IDbElement> {};

// --- Stream Annotation ---
export interface IAnnotation{
  id: string;
  joule_id: number;
  db_stream_id: number;
  title: string;
  content: string;
  start: number;
  end: number
}
export interface IAnnotationState extends EntityState<IAnnotation> { };


// ---- User ----
export interface IUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}
export interface IUserState extends EntityState<IUser> { 
  current: number | null;
  new_installation_token: string;
  installation_token_available: boolean;
};

// ---- UserGroup ----
export interface IUserGroup {
  id: number;
  name: string;
  description: string;
  members: number[];
}
export interface IUserGroupState extends EntityState<IUserGroup>{
  owner: number[];
  member: number[];
}

// ---- Permission ----
export interface IPermission {
  id: number;
  target_name: string;
  target_type: string;
  nilm_id: number;
  role: string;
  removable: boolean
}
export interface IPremissionState extends EntityState<IPermission> { };

// --- Events (Group of Event Objects for a particular Event Stream) ---
export interface IEvents{
  valid: boolean
  start_time: number;
  end_time: number;
  count: number; //number of events, if events is null then there are too many to display
  type: string; //events, histogram
  events: IEvent[];
}

// --- Event ---
export interface IEvent{
  id: number,
  start_time: number,
  end_time: number,
  content: any //arbitrary key/value pairs
}


// ---- EventSet ----
export interface IEventsSet {
  [index: string]: IEvents; //indexed by EventStream ID
}

// --- EventOverflow --- 
// list of plotted event streams with too many events in the time window
export interface IEventOverflow {
  name: string,
  count: number;
}

// --- Data ---
export interface IData {
  start_time: number;
  end_time: number;
  data: any[]; //raw: [[ts, val],...]
               //decimated: [[ts, ]]
  type: string; //raw, decimated, interval
  valid: boolean;
}

// ---- DataSet ----
export interface IDataSet {
  [index: string]: IData; //indexed by DbElement ID
}

export interface IDataViewRedux{
  ui_explorer: plot.IState,
  data_dbElements: Dictionary<IDbElement>,
  data_eventStreams: Dictionary<IEventStream>
}

// ---- DataView ----
export interface IDataView {
  id: number;
  name: string;
  description: string;
  image: string;
  redux: IDataViewRedux;
  owner: boolean;
  live: boolean;
  private: boolean;
  home: boolean;
}


export interface IDataViewState extends EntityState<IDataView> { };
