
import {combineLatest} from 'rxjs';
import { IconFamily } from '@fortawesome/fontawesome-common-types';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {NestedTreeControl} from '@angular/cdk/tree'
import { map, tap } from 'rxjs/operators';
import * as _ from 'lodash-es';

import {
  NilmService,
  DbFolderService,
} from '../../../services';
import {
  INilm,
  IDbFolder,
  IDbStream,
  IDbElement,
  IDataApp,
  IData,
  IEventStream
} from '../../../store/data';
import { 
  PlotService,
  InterfacesService 
} from '../../services';
import { 
  PlotSelectors,
} from '../../selectors';
import { Dictionary } from '@ngrx/entity';

@Component({
    selector: 'app-file-tree',
    templateUrl: './file-tree.component.html',
    styleUrls: ['./file-tree.component.css'],
    standalone: false
})

export class FileTreeComponent implements OnInit {
  public dbNodes$: Observable<DbTreeNode[]>;
  expandedNodes:Array<string> = []
  pendingChildren:Array<string> = []
  treeControl = new NestedTreeControl<DbTreeNode>(node => node.children )
  constructor(
    public nilmService: NilmService,
    private dbFolderService: DbFolderService,
    public plotService: PlotService,
    public plotSelectors: PlotSelectors,
    public interfacesService: InterfacesService
  ) {
  }

  hasChildren = (_:number, node: DbTreeNode) => node.hasChildren;
  isNilm = (_:number, node: DbTreeNode) => node.type=='nilm';
  isFolder = (_:number, node: DbTreeNode) => node.type=='dbFolder';
  isStream = (_:number, node: DbTreeNode) => node.type=='dbStream';
  isEventStream = (_:number, node: DbTreeNode) => node.type=='eventStream';
  isElement = (_:number, node: DbTreeNode) => node.type=='dbElement';
  isDataApp =  (_:number, node: DbTreeNode) => node.type=='dataApp';
  isLoading = (node: DbTreeNode) => node.hasChildren && node.children == null && node.isExpanded;

  ngOnInit() {
    this.nilmService.loadNilms()
    .subscribe(()=>{},
    ()=>{},
    () => this.plotService.setNilmsLoaded());
      //.subscribe({complete: this.plotService.setNilmsLoaded});

    
    this.dbNodes$ = combineLatest([
      this.plotSelectors.data$,
      this.plotSelectors.plottedElements$,
      this.plotSelectors.plottedEventStreamIDs$,
      this.plotSelectors.expandedNodes$])
      .pipe(map(([data,elements,plotted_event_streams,expanded_nodes]) => {
        let nilms = Object.values(data.nilms.entities);
        return nilms.map(nilm => {
          return this.mapNilm(nilm, 
            data.dbFolders.entities[nilm.root_folder],
            data.dataApps.entities,
            data.dbFolders.entities, 
            data.dbStreams.entities, 
            data.eventStreams.entities,
            data.dbElements.entities,
            plotted_event_streams,
            expanded_nodes)
        }).sort((a,b) => a.name > b.name ? 1:-1)
      }));
  }

  public toggleNode(node: DbTreeNode){
    if(node.isExpanded){
      this.plotService.collapseNode(node.id);
      return; //nothing to do
    }
    this.plotService.expandNode(node.id);
    
  }
  public getChildren(node: DbTreeNode) {
    if (this.pendingChildren.includes(node.id)){
      return; //ignore duplicate requests for the same node
    }
    let id = +node.id.slice(1, node.id.length);
    switch (node.type) {
      case 'nilm':
        this.pendingChildren.push(node.id);
        this.nilmService.loadNilm(id).subscribe(
          ()=>{},()=>{},
          ()=>this.pendingChildren = this.pendingChildren.filter(x=>x!=node.id));
        
        break;
      case 'dbFolder':
        this.pendingChildren.push(node.id);
        this.dbFolderService.loadFolder(id).subscribe(
          ()=>{},()=>{},
          ()=>this.pendingChildren = this.pendingChildren.filter(x=>x!=node.id));
        break;
      default:
        console.log(`unexpected call to getChildren with ${node.type}`)
    }
  }

  mapNilm(
    nilm: INilm,
    rootDbFolder: IDbFolder,
    dataApps: Dictionary<IDataApp>,
    folders: Dictionary<IDbFolder>,
    streams: Dictionary<IDbStream>,
    eventStreams: Dictionary<IEventStream>,
    elements: Dictionary<IDbElement>,
    plottedEventStreams: string[],
    expanded_nodes: string[]
  ): DbTreeNode {
    let nodeId = 'n' + nilm.id
    let isExpanded =expanded_nodes.indexOf(nodeId)!=-1
    if (rootDbFolder !== undefined) {
      //nilm is loaded, map it out
      let root = this.mapFolder(rootDbFolder,
        folders, streams, eventStreams, elements, plottedEventStreams, expanded_nodes);
      //add the Joule Modules to the top of the folder listing
      root.children.unshift(...this.mapJouleModules(
        nilm.data_apps, dataApps));
      return Object.assign({}, root, {
        id: nodeId,
        type: 'nilm',
        refreshing: nilm.refreshing,
        nilmId: nilm.id,
        name: nilm.name,
        isExpanded: isExpanded
      });
    } else {
      //nilm is a stub, it has not been loaded
      let node:DbTreeNode = {
        id: nodeId,
        type: 'nilm',
        refreshing: nilm.refreshing,
        nilmId: nilm.id,
        name: nilm.name,
        children: null,
        hasChildren: true,
        isExpanded: isExpanded
      }
      if(isExpanded){
        this.getChildren(node)
      }
      return node;
    }
  }

  mapJouleModules(
    appIds: Array<number>,
    dataApps: Dictionary<IDataApp>
  ): IModuleNode[]{
    return appIds.map(id => dataApps[id])
    .filter(app => app !== undefined)
    .map(app => {
      let node:IModuleNode = {
      id: 'a'+app.id,
      type: 'dataApp',
      name: app.name,
      link: app.url,
      children: null,
      hasChildren: false
      }
      return node;
    })
  }

  mapFolder(
    folder: IDbFolder,
    folders: Dictionary<IDbFolder>,
    streams: Dictionary<IDbStream>,
    eventStreams: Dictionary<IEventStream>,
    elements: Dictionary<IDbElement>,
    plottedEventStreams: string[],
    expanded_nodes: string[]
  ): DbTreeNode {
    let children = null;
    //helper function to handle duplicated event streams
    let isEventStreamPlotted=(id:string)=>{
      let base_ids = plottedEventStreams.map(composite_id => composite_id.split('_')[0])
      return base_ids.includes(id);
    }
    //if folder is loaded, map children
    if (!folder.shallow) {
      children = [].concat(
        //first map subfolders
        folder.subfolders
          .filter(id => folders[id] !== undefined)
          .map(id => this.mapFolder(
            folders[id], folders, streams, eventStreams, 
            elements, plottedEventStreams, expanded_nodes))
          .sort((a,b) => a.name > b.name ? 1:-1),
        //now map streams
        folder.streams
          .filter(id => streams[id] !== undefined)
          .map(id => this.mapStream(
            streams[id], elements, expanded_nodes))
          .sort((a,b) => a.name > b.name ? 1:-1),
        //now map event streams
        folder.event_streams
          .filter(id => eventStreams[id] !== undefined)
          .map(id => this.mapEventStream(eventStreams[id],isEventStreamPlotted(id)))
          .sort((a,b) => a.name > b.name ? 1:-1)
          )
    } 
    let nodeId = 'f' + folder.id
    //create the DbNode and return it
    let node = {
      id: nodeId,
      name: folder.name,
      type: 'dbFolder',
      children: children,
      hasChildren: true,
      isExpanded: expanded_nodes.indexOf(nodeId)!=-1
    }
    // see if we need to load data
    if(folder.shallow && node.isExpanded) {
      this.getChildren(node);
    }
    return node;
  }

  mapStream(
    stream: IDbStream,
    elements: Dictionary<IDbElement>,
    expanded_nodes: string[]
  ): DbTreeNode {
    let children = stream.elements
      .map(id => elements[id])
      .filter(element => element !== undefined)
      .filter(element => element.plottable)
      .sort((a,b) => a.column - b.column)
      .map(element => this.mapElement(element))
    let nodeId = 's' + stream.id
    //create the DbNode and return it
    return {
      id: nodeId,
      name: stream.name,
      type: 'dbStream',
      children: children,
      hasChildren: children != null,
      active: stream.active,
      isExpanded: expanded_nodes.indexOf(nodeId)!=-1
    }
  }

  mapEventStream(
    stream: IEventStream,
    plotted: boolean,
  ): IEventStreamNode {
    //let plotted = this.plotService.isEventStreamPlotted(stream);

    //create the DbNode and return it
    return {
      id: 'v' + stream.id, //e is  taken by elements
      name: stream.name,
      stream: stream,
      type: 'eventStream',
      plotted: plotted,
      children: [],
      hasChildren: false,
      color: null,
      tooltip: "",
    }
  }

  mapElement(
    element: IDbElement,
  ): IDbElementNode {
    let plotted = this.plotService.isElementPlotted(element);
    let plottable = this.plotService.isElementPlottable(element.units);

    let tooltip = "";
    if (plottable == false) {
      tooltip = `no axis for [ ${element.units} ]`;
    }
    //create the DbNode and return it
    return {
      id: 'e' + element.id,
      name: element.name,
      type: 'dbElement',
      element: element,
      plotted: plotted,
      plottable: plottable,
      color: element.color,
      tooltip: tooltip,
      children: [],
      hasChildren: false
    }
  }
}


export interface DbTreeNode {
  id: string;
  name: string;
  type: string;
  active?: boolean;
  refreshing?: boolean;
  isExpanded?: boolean;
  children: DbTreeNode[];
  hasChildren: boolean;
  priveleged?: boolean;
  nilmId?: number;
};
export interface IModuleNode 
  extends DbTreeNode{
  link: string;
}
export interface IEventStreamNode 
  extends DbTreeNode{
  stream: IEventStream;
  plotted: boolean;
  tooltip: string;
  color: string;
}
export interface IDbElementNode
  extends DbTreeNode {
  element: IDbElement;
  plotted: boolean;
  plottable: boolean;
  tooltip: string;
  color: string;
}