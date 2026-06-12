
import * as actions from './actions';
import * as _ from 'lodash-es';

import { createReducer, on} from '@ngrx/store';
import {EntityAdapter, createEntityAdapter} from '@ngrx/entity';


import * as types from './types';
import {defaultEventStreamPlotSettings} from './initial-state';
import { max } from 'lodash';

export const nilmAdapter: EntityAdapter<types.INilm> = createEntityAdapter<types.INilm>()
export const dataAppAdapter: EntityAdapter<types.IDataApp> = createEntityAdapter<types.IDataApp>()
export const dbFolderAdapter: EntityAdapter<types.IDbFolder> = createEntityAdapter<types.IDbFolder>()
export const eventStreamAdapter: EntityAdapter<types.IEventStream> = createEntityAdapter<types.IEventStream>()
export const dbStreamAdapter: EntityAdapter<types.IDbStream> = createEntityAdapter<types.IDbStream>()
export const annotationAdapter: EntityAdapter<types.IAnnotation> = createEntityAdapter<types.IAnnotation>()
export const dbElementAdapter: EntityAdapter<types.IDbElement> = createEntityAdapter<types.IDbElement>()
export const userAdapter: EntityAdapter<types.IUser> = createEntityAdapter<types.IUser>()
export const userGroupAdapter: EntityAdapter<types.IUserGroup> = createEntityAdapter<types.IUserGroup>()
export const permissionAdapter: EntityAdapter<types.IPermission> = createEntityAdapter<types.IPermission>()
export const dataViewAdapter: EntityAdapter<types.IDataView> = createEntityAdapter<types.IDataView>()

//  -----------  Nilm Reducer --------------
export const nilmReducer = createReducer(
  nilmAdapter.getInitialState(),
  //RECEIVE: update Nilm with server data (implicitly clears "refreshing")
  on(actions.receiveNilm, (state: types.INilmState, {nilms}) => nilmAdapter.upsertMany(nilms, state)),
  //REFRESHING: set UI state of Nilm to indicate new data is requested
  on(actions.refreshingNilm, (state, {id}) => nilmAdapter.updateOne({id, changes: {refreshing: true}},state)),
  //REFRESHED: clear "refreshing" UI state (whether or not new data was received)
  on(actions.refreshedNilm, (state, {id}) => nilmAdapter.updateOne({id: id, changes: {refreshing: false}},state)),
  //REMOVE: remove Nilm from store
  on(actions.removeNilm, (state, {id}) => nilmAdapter.removeOne(id,state))
);

//  -----------  Data App Reducer --------------
export const dataAppReducer = createReducer(
  dataAppAdapter.getInitialState(),
  //RECEIVE
  on(actions.receiveDataApp, (state: types.IDataAppState, {apps}) => dataAppAdapter.upsertMany(apps, state))
);

//  -----------  DbFolder Reducer --------------
export const dbFolderReducer = createReducer(
  dbFolderAdapter.getInitialState(),
  //RECEIVE
  on(actions.receiveDbFolder, (state: types.IDbFolderState, {folders}) => dbFolderAdapter.upsertMany(folders, state))
);

//  -----------  EventStream Reducer --------------
export const eventStreamReducer = createReducer(
  eventStreamAdapter.getInitialState(),
  //RECEIVE (this respects local settings)
  on(actions.receiveEventStream, (state: types.IEventStreamState, {streams}) => {
    streams = streams.map(stream => {
      //convert id to a string type
      stream = {...stream, id: stream.id.toString()}
      //keep local values if they have been customized
      if(state.entities[stream.id]!==undefined){
        return {...stream, 
          plot_settings: state.entities[stream.id].plot_settings,
          filter_groups: state.entities[stream.id].filter_groups}
      }
      return stream;
    });
    return eventStreamAdapter.upsertMany(streams, state)}),
  //SET stream default color
  on(actions.setEventStreamColor, (state: types.IEventStreamState, {id, color})=> {
    return eventStreamAdapter.updateOne({id: id, changes:{default_color: color}}, state)}),
  //SET plot settings
  on(actions.setEventStreamPlotSettings, (state: types.IEventStreamState, {id, settings})=> 
    eventStreamAdapter.updateOne({id: id, changes:{plot_settings: settings}}, state)),
  //SET event filters
  on(actions.setEventStreamFilterGroups, (state: types.IEventStreamState, {id, filter_groups})=>
    eventStreamAdapter.updateOne({id: id, changes:{filter_groups: filter_groups}}, state)),
  //RESTORE: replace event streams with new objects
  on(actions.restoreEventStream, (state: types.IEventStreamState, {streams})=> eventStreamAdapter.upsertMany(streams,state)),
  //RESET: remove plot settings
  on(actions.resetEventStream, (state: types.IEventStreamState)=> {
    let ids:any[]= state.ids; //force type to array to avoid type error
    let changes = ids.map(id=>({id, changes:{plot_settings: defaultEventStreamPlotSettings}}))
    return eventStreamAdapter.updateMany(changes,state)
  }),
  //DUPLICATE: make another copy of this event stream
  on(actions.duplicateEventStream, (state: types.IEventStreamState, {id}) =>{
    let base_id = id.toString().split('_')[0]
    //get 
    let duplicate_offset= (<string[]>state.ids)
      .filter(val => val.toString().startsWith(`${base_id}_`))
      .map(composite_id => composite_id.split('_')[1])
      .reduce((max_offset, offset)=>max([max_offset, +offset+1]),1)
    console.log(`base_id=${base_id}, offset=${duplicate_offset}`)
    let duplicate = <types.IEventStream>_.cloneDeep(state.entities[id])
    duplicate.id=`${base_id}_${duplicate_offset}`;
    duplicate.name += "-copy"
    return eventStreamAdapter.addOne(duplicate, state)
  }),
  //REMOVE DUPLICATE
  on(actions.deduplicateEventStream, (state: types.IEventStreamState, {id})=>{
    if(id.includes('_'))
      return eventStreamAdapter.removeOne(id, state);
    else
      return state;
  }),
  //REMOVE ALL DUPLICATES
  on(actions.removeDuplicateEventStreams, (state: types.IEventStreamState, {id})=>{
    let base_id = id.split('_')[0]
    let duplicate_ids = (<string[]>state.ids).filter(stream_id => stream_id.startsWith(base_id+'_'))
    return eventStreamAdapter.removeMany(duplicate_ids, state);
  })

);


//  -----------  DbStream Reducer --------------
export const dbStreamReducer = createReducer(
  dbStreamAdapter.getInitialState(),
  //RECEIVE
  on(actions.receiveDbStream, (state: types.IDbStreamState, {streams}) => dbStreamAdapter.upsertMany(streams, state)),
  //SET reloading annotations attribute
  on(actions.reloadStreamAnnotations, (state: types.IDbStreamState, {id})=> dbStreamAdapter
    .updateOne({id: id, changes:{reloading_annotations: true}}, state)),
  //CLEAR reloading annotations attribute
  on(actions.refreshedAnnotations, (state: types.IDbStreamState, {id})=> dbStreamAdapter
    .updateOne({id: id, changes:{reloading_annotations: false}}, state))
);

//  -----------  Annotation Reducer --------------
export const annotationReducer = createReducer(
  annotationAdapter.getInitialState(),
  //RECEIVE
  on(actions.receiveAnnotation, (state: types.IAnnotationState, {annotations}) => annotationAdapter.upsertMany(annotations, state)),
  //RELOAD: remove all annotations associated with this stream id
  on(actions.reloadStreamAnnotations, (state: types.IAnnotationState, {id})=>{
    let ids:any[]= state.ids; //force type to array to avoid type error
    let target_ids = ids.filter(id => state.entities[id].db_stream_id==id)
    return annotationAdapter.removeMany(target_ids,state);
   }),
  //REMOVE
  on(actions.removeAnnotation, (state, {id}) => annotationAdapter.removeOne(id,state))
)

//  -----------  DbElement Reducer --------------
export const dbElementReducer = createReducer(
  dbElementAdapter.getInitialState(),
   //RECEIVE (this respects local settings)
   on(actions.receiveDbElement, (state: types.IDbElementState, {elements}) => {
     elements = elements.map(element => {
       //keep local values if they have been customized
       if(state.entities[element.id]!==undefined){
         return {...element, 
          display_name:state.entities[element.id].display_name, 
          color:  state.entities[element.id].color }
       }
       return element;
      });
     return dbElementAdapter.upsertMany(elements, state)}),
   //SET element color
   on(actions.setDbElementColor, (state: types.IDbElementState, {id, color})=> dbElementAdapter
     .updateOne({id: id, changes:{color: color}}, state)),
   //SET display name
   on(actions.setDbElementName, (state: types.IDbElementState, {id, name})=> dbElementAdapter
     .updateOne({id, changes:{display_name: name}}, state)),
   //RESTORE: replace elements with new objects
   on(actions.restoreDbElement, (state: types.IDbElementState, {elements})=> dbElementAdapter.upsertMany(elements,state)),
   //RESET: remove display name and color setting
   on(actions.resetDbElement, (state: types.IDbElementState)=> {
     let ids:any[]= state.ids; //force type to array to avoid type error
     let changes = ids.map(id=>({id, changes:{color: '', display_name: ''}}))
     return dbElementAdapter.updateMany(changes,state)
  })
)

//  -----------  User Reducer --------------
export const userReducer = createReducer(
  userAdapter.getInitialState<types.IUserState>({
    current: null,
    new_installation_token: "",
    installation_token_available: false
  }),
  //RECEIVE
  on(actions.receiveUser, (state: types.IUserState, {users}) => {
    //current user has more data fields, don't 
    //overwrite it with this limited 'public' view
    users = users.filter(user => user.id!=state.current)
    return userAdapter.upsertMany(users, state)}),
  //SET current
  on(actions.setCurrentUser, (state: types.IUserState, {user}) => {
    let new_state = userAdapter.upsertOne(user, state);
    return { ...new_state, current: user.id };
  }),
  //SET Installation Token
  on(actions.receiveUserInstallationToken, (state: types.IUserState, {token}) => {
    return { ...state, new_installation_token: token, installation_token_available: true };
  }),
  //SET Installation Token Unavailable
  on(actions.installationTokensUnavailable, (state: types.IUserState) => {
    return { ...state, new_installation_token: "", installation_token_available: false };
  })
)

// ------ User Group Reducer -----
export const userGroupReducer = createReducer(
  userGroupAdapter.getInitialState<types.IUserGroupState>({owner: [], member: []}),
  //RECEIVE generic groups
  on(actions.receiveGroups, (state: types.IUserGroupState, {groups}) => userGroupAdapter.upsertMany(groups, state)),
  //RECEIVE owner group
  on(actions.receiveOwnerGroups, (state: types.IUserGroupState, {groups}) => {
    let new_state = userGroupAdapter.upsertMany(groups, state)
    return {...new_state, owner: groups.map(group=>group.id)}
  }),
  //RECEIVE member group
  on(actions.receiveMemberGroups, (state: types.IUserGroupState, {groups}) => {
    let new_state = userGroupAdapter.upsertMany(groups, state)
    return {...new_state, member: groups.map(group=>group.id)}
  }),
  //REMOVE group and remove it's id from the owner array (only an owner can remove a group)
  on(actions.removeUserGroup, (state: types.IUserGroupState, {id}) => {
    let new_state = userGroupAdapter.removeOne(id, state);
    return {...new_state, owner: state.owner.filter(gid=>gid!=id)}
  })
)

// ------ Permission Reducer -----
export const permissionReducer = createReducer(
  permissionAdapter.getInitialState(),
  //RECEIVE
  on(actions.receivePermission, (state: types.IPremissionState, {permissions}) => permissionAdapter.upsertMany(permissions, state)),
  //REMOVE
  on(actions.removePermission, (state, {id}) => permissionAdapter.removeOne(id,state))
);

// ------ DataView Reducer -----
export const dataViewReducer = createReducer(
  dataViewAdapter.getInitialState(),
  //RECEIVE
  on(actions.receiveDataView, (state: types.IDataViewState, {views}) =>{
    //check if one of the new views is the home view, if so clear the flags from existing ones
    let isNewHome = views.map(view=>view.home).reduce((home_set, is_home)=>home_set||is_home, false);
    if (isNewHome){
      let ids:any[]= state.ids; //force type to array to avoid type error
      let changes = ids.map(id=>({id, changes:{home: false}}))
      let new_state =  dataViewAdapter.updateMany(changes, state)
      return dataViewAdapter.upsertMany(views, new_state);
    }
    return dataViewAdapter.upsertMany(views, state)
  } ),
  //REMOVE
  on(actions.removeDataView, (state, {id}) => dataViewAdapter.removeOne(id,state))
);
