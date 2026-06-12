import { Component, Input, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import {
  DbFolderService,
} from '../../../services';
import { InstallationService } from '../../installation.service';
import { InstallationSelectors } from '../../installation.selectors';
import {
  INilm,
  IDbFolder,
  IDbStream,
  IEventStream,
  IDataApp
} from '../../../store/data';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import {NestedTreeControl} from '@angular/cdk/tree'
import { Dictionary } from '@ngrx/entity';
import { faCogs } from '@fortawesome/free-solid-svg-icons';
import { IDbModuleNode } from 'src/app/explorer/components/file-tree/file-tree.component';

@Component({
    selector: 'installation-database-tab',
    templateUrl: './database.tab.html',
    styleUrls: ['./database.tab.css'],
    standalone: false
})
export class DatabaseTabComponent {

  @Input() nilm: INilm;

  private subs: Subscription[];
  public dbNodes$: Observable<DbTreeNode[]>
  public selectedNode?: DbTreeNode;
  pendingChildren:Array<string> = []
  treeControl = new NestedTreeControl<DbTreeNode>(node => node.children )

  faCogs = faCogs;


  hasChildren = (_:number, node: DbTreeNode) => node.hasChildren;
  isNilm = (_:number, node: DbTreeNode) => node.type=='nilm';
  isFolder = (_:number, node: DbTreeNode) => node.type=='dbFolder';
  isStream = (_:number, node: DbTreeNode) => node.type=='dbStream';
  isEventStream = (_:number, node: DbTreeNode) => node.type=='dbEventStream';
  isElement = (_:number, node: DbTreeNode) => node.type=='dbElement';
  isDataApp =  (_:number, node: DbTreeNode) => node.type=='dataApp';
  isLoading = (node: DbTreeNode) => node.hasChildren && node.children == null && node.isExpanded;


  constructor(
    public installationService: InstallationService,
    private dbFolderService: DbFolderService,
    public installationSelectors: InstallationSelectors,
  ) {
    this.subs = [];
    this.dbNodes$ = combineLatest(
      [this.installationSelectors.nilm$,
      this.installationSelectors.data$,
      this.installationSelectors.expanded_nodes$]).pipe(
        map(([nilm, data,expanded_nodes]) => this.mapNilm(nilm, 
          data.dataApps.entities,
          data.dbFolders.entities,
          data.dbStreams.entities,
          data.eventStreams.entities,
          expanded_nodes)));
  };
  

  public refresh(){
    this.installationService.refresh();
  }

  public toggleNode(node: DbTreeNode){
    if(node.isExpanded){
      this.installationService.collapseNode(node.id);
      return; //nothing to do
    }
    this.installationService.expandNode(node.id);
    
  }
  public nodeSelected(node:DbTreeNode){
    if(this.selectedNode === undefined){
      return false
    }
    return this.selectedNode.id == node.id;
  }

  public selectNode(node: DbTreeNode) {
    this.selectedNode = node;
    let id = +node.id.slice(1, node.id.length);

    switch (node.type) {
      case 'dbFolder':
        this.installationService.selectDbFolder(id);
        return;
      case 'dbStream':
        this.installationService.selectDbStream(id);
        return;
      case 'dataApp':
        this.installationService.selectDataApp(id);
        return;
      case 'eventStream':
        this.installationService.selectEventStream(id);
        return;
      default:
        console.log(`unknown type ${node.type}`);
    }
  }

  mapNilm(
    nilm: INilm,
    data_apps: {[id: number]: IDataApp },
    folders: {[id: number]: IDbFolder },
    streams: {[id: number]: IDbStream },
    eventStreams: Dictionary<IEventStream>,
    expanded_nodes: string[]
  ): DbTreeNode[] {    

    //first map folders
    let root = folders[nilm.root_folder]
    if(root===undefined){
      return [] //waiting on the root node
    }
    let folder_nodes = root.subfolders
      .filter(id => folders[id] !== undefined)
      .map(id => this.mapFolder(
        folders[id], folders, streams, eventStreams, expanded_nodes))
    let module_nodes = this.mapDataApps(nilm.data_apps, data_apps)
    return module_nodes.concat(folder_nodes);
    }
  

  mapDataApps(
    moduleIds: Array<number>,
    dataApps:  {[id: number]: IDataApp },
  ): DbTreeNode[]{
    return moduleIds.map(id => dataApps[id])
    .filter(app => app !== undefined)
    .map(app => {
      let node:IModuleNode = {
      id: 'a'+app.id,
      link: app.url,
      type: 'dataApp',
      name: app.name,
      children: [],
      hasChildren: false
      }
      return node
    })
  }

  mapFolder(
    folder: IDbFolder,
    folders:  {[id: number]: IDbFolder },
    streams:  {[id: number]: IDbStream },
    eventStreams: Dictionary<IEventStream>,
    expanded_nodes: string[]
  ): DbTreeNode {
    let children = null;
    //if folder is loaded, map children
    if (!folder.shallow) {
      children = [].concat(
        //first map subfolders
        folder.subfolders
          .filter(id => folders[id] !== undefined)
          .map(id => this.mapFolder(
            folders[id], folders, streams, eventStreams,
            expanded_nodes))
            .sort((a,b) => a.name > b.name ? 1:-1),
        //now map streams
        folder.streams
          .filter(id => streams[id] !== undefined)
          .map(id => this.mapStream(
            streams[id]))
          .sort((a,b) => a.name > b.name ? 1:-1),
        //now map event streams
        folder.event_streams
          .filter(id => eventStreams[id] !== undefined)
          .map(id => this.mapEventStream(eventStreams[id]))
          .sort((a,b) => a.name > b.name ? 1:-1))
    }
    //create the DbNode and return it
    let nodeId = 'f' + folder.id
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

  getChildren(node: DbTreeNode){
    if (this.pendingChildren.includes(node.id)){
      return; //ignore duplicate requests for the same node
    }
    let id = +node.id.slice(1, node.id.length);
    this.pendingChildren.push(node.id);
        this.dbFolderService.loadFolder(id).subscribe(
          ()=>{},()=>{},
          ()=>this.pendingChildren = this.pendingChildren.filter(x=>x!=node.id));
    }

  mapStream(
    stream: IDbStream,
  ): DbTreeNode {
    return {
      id: 's' + stream.id,
      name: stream.name,
      type: 'dbStream',
      children: [],
      hasChildren: false
    }
  }


  mapEventStream(
    stream: IEventStream,
  ): DbTreeNode {
    //let plotted = this.plotService.isEventStreamPlotted(stream);

    //create the DbNode and return it
    return {
      id: 'v' + stream.id, //e is  taken by elements
      name: stream.name,
      type: 'eventStream',
      children: [],
      hasChildren: false,
    }
  }

  ngOnDestroy() {
    for (var sub of this.subs) {
      sub.unsubscribe();
    }
  }
}

export interface DbTreeNode {
  id: string;
  name: string;
  type: string;
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