import { Injectable } from '@angular/core';
import { Store, select, createSelector} from '@ngrx/store';
import {
  IState,
  IDbFolder,
  IDbElement,
  IDbStream,
  IDataApp,
  IEventStream,
  INilm,
} from '../store/data';

import {IInstallation} from './store';
import {IAppState} from '../app.store';
import { Observable, combineLatest } from 'rxjs';
import { map, filter, tap, distinctUntilChanged } from 'rxjs/operators';
import * as selectors from '../selectors';

export interface DbTreeNode {
  id: string;
  dbId: number;
  name: string;
  type: string;
  isExpanded?: boolean;
  children: DbTreeNode[];
  hasChildren: boolean;
};

@Injectable()
export class InstallationSelectors {

  
  data$ = this.store.pipe(select(selectors.data_));
  nilms$= this.store.pipe(select(selectors.nilms_));
  dbFolders$= this.store.pipe(select(selectors.dbFolders_));
  dbStreams$= this.store.pipe(select(selectors.dbStreams_));
  eventStreams$= this.store.pipe(select(selectors.eventStreams_));

  dbElements$ = this.store.pipe(select(selectors.dbElements_));
  dataApps$= this.store.pipe(select(selectors.dataApps_));

  dbAdmin$= this.store.pipe(select(selectors.installation_UI_));
  nilm_id$= this.store.pipe(select(createSelector(selectors.installation_UI_,state=>state.nilm)));
  refreshing$= this.store.pipe(select(createSelector(selectors.installation_UI_,state=>state.refreshing)));
  selectedType$= this.store.pipe(select(createSelector(selectors.installation_UI_,state=>state.selectedType)));
  root_folder_id$= this.store.pipe(select(createSelector(selectors.installation_UI_,state=>state.rootFolderId)));
  dbFolder_id$= this.store.pipe(select(createSelector(selectors.installation_UI_,state=>state.selectedDbFolder)));
  dbStream_id$= this.store.pipe(select(createSelector(selectors.installation_UI_,state=>state.selectedDbStream)));
  dataApp_id$= this.store.pipe(select(createSelector(selectors.installation_UI_,state=>state.selectedDataApp)));
  eventStream_id$= this.store.pipe(select(createSelector(selectors.installation_UI_,state=>state.selectedEventStream)));
  expanded_nodes$= this.store.pipe(select(createSelector(selectors.installation_UI_,state=>state.expanded_nodes)));
  public nilm$: Observable<INilm>;
  public dbNodes$: Observable<DbTreeNode[]>;
  public rootDbFolder$: Observable<IDbFolder>;
  public selectedDbFolder$: Observable<IDbFolder>;
  public selectedDbStream$: Observable<IDbStream>;
  public selectedEventStream$: Observable<IEventStream>;
  public selectedDataApp$: Observable<IDataApp>;
  public selectedDbStreamElements$: Observable<IDbElement[]>;


  constructor(
    private store: Store
  ) {
    // ---- nilm: INilm ------
    this.nilm$ = combineLatest(
      [this.nilm_id$,this.nilms$]).pipe(
      map(([id, nilms]) => nilms[id]),
      filter(nilm => !(nilm === undefined)));


    // ---- selectedDbRootFolder: IDbFolderRecord ------
    this.rootDbFolder$ = combineLatest(
      [this.root_folder_id$,this.dbFolders$]).pipe(
      map(([id, folders]) => folders[id]),
      filter(folder => !(folder === undefined)));

    // ---- selectedDbFolder: IDbFolderRecord ------
    this.selectedDbFolder$ = combineLatest(
      [this.dbFolders$,this.dbFolder_id$]).pipe(
      map(([dbFolders, id]) => dbFolders[id]),
      filter(dbFolder => !(dbFolder === undefined)),
      distinctUntilChanged());
    //this.selectedDbFolder$.subscribe(x=>console.log(x))

    // ---- selectedDataApp: IDataAppRecord ------
    this.selectedDataApp$ = combineLatest(
      [this.dataApps$,this.dataApp_id$]).pipe(
      map(([dataApps, id]) => dataApps[id]),
      filter(app => !(app === undefined)),
      distinctUntilChanged(),
      );

    // ---- selectedDbStream: IDbStreamRecord ------
    this.selectedDbStream$ = combineLatest(
      [this.dbStreams$, this.dbStream_id$]).pipe(
      map(([dbStreams, id]) => dbStreams[id]),
      filter(dbStream => !(dbStream === undefined)),
      distinctUntilChanged());

     // ---- selectedEventStream: IEventStreamRecord ------
    this.selectedEventStream$ = combineLatest(
      [this.eventStreams$, this.eventStream_id$]).pipe(
      map(([eventStreams, id]) => eventStreams[id]),
      filter(eventStream => !(eventStream === undefined)),
      distinctUntilChanged());


    // ---- selectedDbElements: IDbElements[] -----
    this.selectedDbStreamElements$ = combineLatest(
      [this.selectedDbStream$,this.dbElements$]).pipe(
       map(([stream, elements]) => stream.elements.map(id => elements[id])),
       filter(elements =>
        elements.reduce((i, e) => i && !(e === undefined), true)),
      distinctUntilChanged());

    // ---- dbNodes: DbTreeNode[] -----
    this.dbNodes$ = combineLatest(
      [this.root_folder_id$, this.data$]).pipe(
      filter(([root_id, data]) => data.dbFolders.entities[root_id] !== undefined),
      map(([root_id, data]) => this._mapRoot(data, data.dbFolders.entities[root_id]))
    );
  }

  ///----------- Tree Helper Functions -----------------------
  ///
  private _mapRoot(data: IState, root: IDbFolder): DbTreeNode[] {
    let dbs = this._mapFolder(data, root);
    dbs.name='database';
    dbs.type='root';
    dbs.isExpanded = true;
    //let interfaces= this._mapInterfaces(data.jouleModules)
    return [ dbs];
  }
  private _mapFolder(data: IState, folder: IDbFolder): DbTreeNode {
    let children = null;

    //if folder is loaded, map children
    if (!folder.shallow) {
      children = [].concat(
        //first map subfolders
        folder.subfolders
          .filter(id => data.dbFolders.entities[id] !== undefined)
          .map(id => this._mapFolder(data,data.dbFolders.entities[id])),
        //now map streams
        folder.streams
          .filter(id => data.dbStreams.entities[id] !== undefined)
          .map(id => this._mapStream(data, data.dbStreams.entities[id])))
    }
    /*
    if (!dbFolder.shallow) {
      children =
        dbFolder.subfolders
          .map(subfolder_id => this._mapFolder(data, subfolder_id))
          .concat(dbFolder.streams
            .filter(stream_id => stream_id in data.dbStreams)
            .map(stream_id => this._mapStream(data, stream_id)));
    }*/
    return {
      id: 'f'+folder.id,
      dbId: folder.id,
      name: folder.name,
      type: 'dbFolder',
      children: children,
      hasChildren: true,
    };
  }

  private _mapStream(data: IState, stream: IDbStream ): DbTreeNode {
    return {
      id: 's'+stream.id,
      dbId: stream.id,
      name: stream.name,
      type: 'dbStream',
      hasChildren: false,
      children: []
    };
  }
/*
  private _mapInterfaces(modules: IDataApp[]): DbTreeNode {
    let nodes = modules.map( a => { return {
      id: 'a'+a.id,
      dbId: a.id,
      name: a.name,
      type: 'dataApp',
      hasChildren: false,
      children: []
    }})
    return {
      id: 'mroot',
      dbId: 0,
      name: 'root',
      type: 'jouleModule',
      children: nodes,
      hasChildren: true,
    };
  }*/
}
