import { Injectable } from '@angular/core';
import  tinycolor from 'tinycolor2';
import { createSelector, Store } from '@ngrx/store';
import * as _ from 'lodash-es';
import { IRange } from '../store';
import { take } from 'rxjs/operators'
import * as PlotActions from '../store/plot/actions';
import { IAppState } from '../../app.store';
import * as plotStore from '../store/plot/types';
import { EventStreamService, MessageService } from '../../services/';
import {
  IDbElement,
  IDataSet,
  IEventStream,
  IEventsSet
} from '../../store/data';
import {
  IAxisSettings
} from '../store';
import {
  DataService,
  DbElementService,
} from '../../services';
import { data_, explorer_UI_ } from '../../selectors';
import { Dictionary } from '@ngrx/entity';
import { EventSelectorService } from './event-selector.service';


@Injectable()
export class PlotService {

  constructor(
    private store: Store<IAppState>,
    private messageService: MessageService,
    private dataService: DataService,
    private elementService: DbElementService,
    private eventStreamService: EventStreamService,
    private eventSelectorService: EventSelectorService
  ) { }

  // add element to specified axis
  //
  public plotElement(element: IDbElement, axis: string = 'either') {
    this.elementService.assignColor(element);
    this.store.dispatch(PlotActions.plotElement({element}));
  }

  // remove element from plot
  //
  public hideElement(element: IDbElement) {
    this.store.dispatch(PlotActions.hideElement({id: element.id}));
    this.elementService.removeColor(element);
  }

  // add events to the plot
  public plotEvents(stream: IEventStream){
    //NOTE: The order is important, first add the stream, then assign the color
    //otherwise 2 copies of the event stream will be added to the UI
    this.store.dispatch(PlotActions.plotEvents({stream}))
    this.eventStreamService.assignColor(stream);
  }
  public hideEvents(stream: IEventStream){
    //if this is a duplicate event stream it has to be removed from the 
    //event stream store as well (otherwise it will just be pushed back in by main_plot.ts)
    this.eventStreamService.deduplicateEventStream(stream);
    //remove any selected events from this stream
    this.eventSelectorService.removeEventStream(stream);
    this.store.dispatch(PlotActions.hideEvents({id: stream.id}));
  }
  public hideEventsAndDuplicates(stream: IEventStream){
    //hide this event stream and any duplicates of it
    this.eventStreamService.removeDuplicateEventStreams(stream);
    this.store.dispatch(PlotActions.hideEventsAndDuplicates({id: stream.id}))
  }
  
  // remove all elements from the plot
  public hideAllElements() {
    let elements: Dictionary<IDbElement>
    this.store.select(
      createSelector(data_,state=>state.dbElements.entities))
      .pipe(take(1)).subscribe(state => elements=state);
    Object.values(elements)
      .map(element => {
        this.hideElement(element);
      })
    }

  public setElementAxis(element: IDbElement, axis: string) {
    //the reducer verifies that the element can switch axes
    this.store.dispatch(PlotActions.setElementAxis({element, axis}));
  }
  public showPlot() {
    this.store.dispatch(PlotActions.showPlot());
  }
  public showDateSelector() {
    this.store.dispatch(PlotActions.showDateSelector());
  }
  public hideDateSelector() {
    this.store.dispatch(PlotActions.hideDateSelector());
  }

  public hidePlot() {
    this.store.dispatch(PlotActions.hidePlot());
  }
  public loadEventData(
    streams: IEventStream[],
    timeRange: IRange
  ){
    let existingData:IEventsSet
    this.store.select(
      createSelector(explorer_UI_,state=>state.plot.plot_event_data))
      .pipe(take(1)).subscribe(state => existingData=state);
    let neededStreams = this.findNeededElements(streams, existingData, timeRange);
    if (neededStreams.length == 0)
      return; //nothing to do

    this.store.dispatch(PlotActions.addingPlotData());
    //add padding to plot data if ranges are not null
    this.dataService.loadEvents(
      timeRange.min, timeRange.max, 
      neededStreams, 0)
      .subscribe(
        data=>{this.store.dispatch(PlotActions.addPlotEventData({data}))}
      )
  }
  // reload the data for a single event stream
  // used when an event filter changes
  public refreshEventData(
    stream: IEventStream
  ){
    let timeRange:IRange;
    this.store.select(
      createSelector(explorer_UI_,state=>state.plot.plot_time))
      .pipe(take(1)).subscribe(state => timeRange=state);
    this.store.dispatch(PlotActions.addingPlotData());
    this.dataService.loadEvents(
      timeRange.min, timeRange.max, 
      [stream], 0)
      .subscribe(
        data=>{this.store.dispatch(PlotActions.addPlotEventData({data}))}
      )
  }

  public loadNavEventData(
    streams: IEventStream[],
    timeRange: IRange
  ){
    //NOT USED: nav plot does not display event data
    /*let existingData:IEventsSet
    this.store.select(
      createSelector(explorer_UI_,state=>state.plot.nav_event_data))
      .pipe(take(1)).subscribe(state => existingData=state);
    let neededStreams = this.findNeededElements(streams, existingData, timeRange);
    if (neededStreams.length == 0)
      return; //nothing to do
    neededStreams.map(stream=>console.log(`loading event stream ${stream.name} for nav plot`))

    this.store.dispatch(PlotActions.addingNavData());
    //add padding to plot data if ranges are not null
    console.log("adding events to nav plot??")
    this.dataService.loadEvents(
      timeRange.min, timeRange.max, 
      neededStreams, 0)
      .subscribe(
        data=>{this.store.dispatch(PlotActions.addNavEventData({data}))}
      )
    */
  }
  public loadPlotData(
    elements: IDbElement[],
    timeRange: IRange,
    resolution: number
  ) {
    let existingData:IDataSet
    this.store.select(
      createSelector(explorer_UI_,state=>state.plot.plot_data))
      .pipe(take(1)).subscribe(state => existingData=state);
    //let existingData = this.ngRedux.getState().ui.explorer.plot.plot_data;
    let neededElements = this.findNeededElements(elements, existingData, timeRange);
    if (neededElements.length == 0)
      return; //nothing to do
    this.store.dispatch(PlotActions.addingPlotData());
    //add padding to plot data if ranges are not null
    this.dataService.loadData(
      timeRange.min, timeRange.max, 
      neededElements, resolution, 0.25)
      .subscribe(
        data => {this.store.dispatch(PlotActions.addPlotData({data}))},
        error => {
          //nothing came back so create dummy error entries
          this.store.dispatch(PlotActions.addPlotData({
            data: neededElements.reduce((acc,e) => {
              acc[e.id] = {
                'element_id': e.id,
                'type': 'error',
                'data': [],
                'start_time': timeRange.min==null?0:timeRange.min,
                'end_time': timeRange.max==null?0:timeRange.max
              }
              return acc
            },{})
          })) 
      })
  }
  public loadNavData(
    elements: IDbElement[],
    timeRange: IRange,
    resolution: number
  ) {
    
    let existingData:IDataSet
    this.store.select(
      createSelector(explorer_UI_,state=>state.plot.nav_data))
      .pipe(take(1)).subscribe(state => existingData=state);    
    let neededElements = this.findNeededElements(elements, existingData, timeRange);
    if (neededElements.length == 0)
      return; //nothing to do
    this.store.dispatch(PlotActions.addingNavData());

    this.dataService.loadData(
      timeRange.min, timeRange.max, neededElements, resolution)
      .subscribe({
        next: (data) => {this.store.dispatch(PlotActions.addNavData({data}));},
        error: (error) => {
          this.store.dispatch(PlotActions.addNavData({
           data: neededElements.reduce((acc,e) => {
            acc[e.id] = {
              'element_id': e.id,
              'type': 'error',
              'data': [],
              'start_time': timeRange.min==null?0:timeRange.min,
              'end_time': timeRange.max==null?0:timeRange.max
            }
            return acc
          },{}) //nothing came back so create dummy error entries
        }))
      }})
  }

  public toggleNavZoomLock() {
    this.store.dispatch(PlotActions.toggleZoomLock());

  }
  public disableNavZoomLock() {
    this.store.dispatch(PlotActions.disableZoomLock());

  }
  public toggleDataCursor() {
    this.store.dispatch(PlotActions.toggleDataCursor());

  }
  public disableDataCursor() {
    this.store.dispatch(PlotActions.disableDataCursor());

  }
  public setLiveUpdateInterval(rate: number){
    this.store.dispatch(PlotActions.setLiveUpdateInterval({rate}));
  }
  public toggleLiveUpdate() {
    this.store.dispatch(PlotActions.toggleLiveUpdate());

  }
  public disableLiveUpdate() {
    this.store.dispatch(PlotActions.disableLiveUpdate());
  }

  public toggleShowDataEnvelope() {
    this.store.dispatch(PlotActions.toggleDataEnvelope());

  }
  public setPlotTimeRange(range: IRange) {
    this.store.dispatch(PlotActions.setPlotTimeRange({range}));
  }
  public setNavTimeRange(range: IRange) {
    this.store.dispatch(PlotActions.setNavTimeRange({range}));
  }
  public setNavRangeToPlotRange() {
    this.store.dispatch(PlotActions.setNavRangeToPlotRange());
  }
  public autoScaleAxis(axis: string) {
    this.store.dispatch(PlotActions.autoScaleAxis({axis}));
  }

  public resetTimeRanges() {
    this.store.dispatch(PlotActions.resetTimeRanges());
  }

  public setTimeRangeToNow(){
    let now = Date.now();
    const NAV_NOW_INTERVAL = 60 * 60 * 1000; //1 hour
    const PLOT_NOW_INTERVAL = 20 * 60 * 1000; //20 minutes
    this.setPlotTimeRange({
      min: now - PLOT_NOW_INTERVAL,
      max: now
    })
    this.setNavTimeRange({
      min: now - NAV_NOW_INTERVAL,
      max: now
    });
  }
  public autoScaleTime() {
    this.store.dispatch(PlotActions.setPlotTimeRange({range: {min: null, max:null}}));
  }

  public setDataViewFilterText(filter: string) {
    this.store.dispatch(PlotActions.setDataViewFilterText({filter}));
  }

  public setShowPublicDataViews(show: boolean) {
    this.store.dispatch(PlotActions.showPublicDataViews({show}));
  }

  public setLeftAxisSettings(settings: IAxisSettings){
    this.store.dispatch(PlotActions.setLeftAxisSettings({settings}));
  }

  public toggleLeftAxisSettings(){
    this.store.dispatch(PlotActions.toggleLeftAxisSettings());
  }

  public setRightAxisSettings(settings: IAxisSettings){
    this.store.dispatch(PlotActions.setRightAxisSettings({settings}));
  }

  public toggleRightAxisSettings(){
    this.store.dispatch(PlotActions.toggleRightAxisSettings());
  }

  public setTimeAxisSettings(settings: IAxisSettings){
    this.store.dispatch(PlotActions.setTimeAxisSettings({settings}));
  }

  public toggleTimeAxisSettings(){
    this.store.dispatch(PlotActions.toggleTimeAxisSettings());
  }

  //set flag to indicate nilms have been loaded
  //
  public setNilmsLoaded(){
    this.store.dispatch(PlotActions.setNilmLoaded());
  }
  //set flag to indicate data views have been loaded
  //
  public setDataViewsLoaded(){
    this.store.dispatch(PlotActions.setDataViewsLoaded());
  }

  //expand node in file tree
  //
  expandNode(id: string){
    this.store.dispatch(PlotActions.expandNode({id}));
  }

  //collapse node in file tree
  //
  collapseNode(id: string){
    this.store.dispatch(PlotActions.collapseNode({id}));
  }

  ///------ helpers ------------

  buildEventDataset(
    eventStreams: IEventStream[],
    eventsSet: IEventsSet,
    selectedEvents: IEventsSet
  ){
    return eventStreams.map(stream => {
      if(eventsSet[stream.id]===undefined||eventsSet[stream.id]==null){
        return null;
      }
      if(eventsSet[stream.id].type=='histogram'){
        let base_color = tinycolor(stream.plot_settings.color.value.fixed)
        let max_count = Math.max(...eventsSet[stream.id].events.map(event => event.content.count))
        let histBins = eventsSet[stream.id].events.map(event=>{
          return {...event,
          content: {...event.content,
          color: base_color.setAlpha(event.content.count/max_count).toRgbString()}}
        })
        //override settings for histogram
        let settings = _.cloneDeep(stream.plot_settings); //{...stream.plot_settings}
        settings.color.type= 'attribute' //color based on count
        settings.color.value.attribute = 'color'
        settings.marker.type= 'fixed' // no marker
        settings.marker.size = 0
        settings.label.type= 'fixed' // no label
        settings.label.value.fixed = ''
        settings.position.type= 'fixed' //fixed height & position
        settings.position.axis = 'float' //float on y-axis
        settings.height.type= 'fixed'
        return {
          label: stream.name,
          yaxis: 5, //this is the event y-axis (not shown on plot)
          //bars: { show: false, barWidth: 2 },
          //points: { show: false },
          lines: { show: false },
          events: {
            show: true,
            decimated: true,
            stream_id: stream.id,
            settings: settings,
            color: stream.default_color
          },
          data: histBins
        }
      }
      let eventsWithSelect = eventsSet[stream.id].events.map(event=>{
        let selected=false;
        if(selectedEvents[stream.id]!=undefined){
          if(selectedEvents[stream.id].events.map(e=>e.id).includes(event.id)){
            selected=true 
          }
        }
        return {...event, selected}
      })      
      return {
        label: stream.name,
        yaxis: 5, //this is the event y-axis (not shown on plot)
        //bars: { show: false, barWidth: 2 },
        //points: { show: false },
        lines: { show: false },
        events: {
          show: true,
          decimated: false,
          stream_id: stream.id,
          settings: stream.plot_settings
        },
        color: stream.default_color,
        data: eventsWithSelect
      }
    }).filter(data => data != null)
  }
  //PUBLIC: 
  buildDataset(
    elements: IDbElement[],
    data: IDataSet,
    axis: number,
    showEnvelope: boolean) {
    
    return elements.map(element => {
      if (data[element.id] === undefined || data[element.id] == null)
        return null;
      //use custom display_name if present
      let label = element.name;
      if (element.display_name != "")
        label = element.display_name;
      //if the data is corrupt add a warning icon
      if (data[element.id].valid == false) {
        // add SVG icon to legend (not managed by Angular)
        label += ' <svg aria-hidden="true" data-prefix="fas" data-icon="exclamation-circle" class="svg-inline--fa fa-exclamation-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zm-248 50c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"></path></svg>';
      }
      let baseConfig = {
        label: label,
        yaxis: axis,
        //bars: { show: false, barWidth: 2 },
        //points: { show: false },
        lines: { show: false },
        events: { show: false },
        color: element.color,
        data: data[element.id].data,
        default_min: element.default_min,
        default_max: element.default_max
      }

      switch (data[element.id].type) {
        case 'raw':
          switch (element.display_type) {
            case 'continuous':
              return Object.assign({}, baseConfig,
                {
                  lines: { show: true },
                });
            case 'discrete':
              return Object.assign({}, baseConfig,
                {
                  points: { show: true, radius: 2 },
                });
            case 'event':
              return Object.assign({}, baseConfig,
                {
                  bars: { show: true, barWidth: 2 },
                });
            default:
              console.log(`error in continuous case, unexpected display_type ${element.display_type}`)
              return {}
          }
        case 'decimated':
          let opacity = showEnvelope ? 0.2: 0.0;
          switch (element.display_type) {
            case 'continuous':
              return Object.assign({}, baseConfig,
                {
                  fillArea: [{ opacity: opacity, representation: "asymmetric" }],
                  lines: { show: true }
                });
            case 'discrete':
              return Object.assign({}, baseConfig,
                {
                  fillArea: [{ opacity: opacity, representation: "asymmetric" }],
                  points: { show: true, radius: 1 }
                });
            default:
              console.log(`error in decimated case, unexpected display_type ${element.display_type}`)
              return {};
          }
        case 'interval':
          return Object.assign({}, baseConfig,
            {
              yaxis: baseConfig.yaxis + 2,
              lines: {
                lineWidth: 5,
              },
              points: {
                show: true
              },
              default_min: null,
              default_max: null
            })
        default:
          console.log("unknown data type: ", data[element.id].type)
      }
      return {}
    }).filter(data => data != null)
  }

  //isElementPlottable: return true if units can be plotted
  // (if units match an existing axis or an axis is empty)
  //
  isElementPlottable(units: string){
    let plotState:plotStore.IState;
    this.store.select(
      createSelector(explorer_UI_,state=>state.plot))
      .pipe(take(1)).subscribe(state => plotState=state);
    if (plotState.left_units == units ||
      plotState.right_units == units ||
      plotState.left_elements.length == 0 ||
      plotState.right_elements.length == 0) {
      return true;
    }
    return false;
  }

  //isElementPlotted: return true if the element is currently 
  // shown on the plot
  isElementPlotted(element: IDbElement){
    let plotState:plotStore.IState;
    this.store.select(
      createSelector(explorer_UI_,state=>state.plot))
      .pipe(take(1)).subscribe(state => plotState=state);   
    if (_.includes(plotState.left_elements, element.id) ||
      _.includes(plotState.right_elements, element.id)) {
      return true;
    }
    return false;
  }

  //isEventStreamPlotted: return true if the element is currently 
  // shown on the plot
  isEventStreamPlotted(stream: IEventStream){
    let plotState:plotStore.IState;
    this.store.select(
      createSelector(explorer_UI_,state=>state.plot))
      .pipe(take(1)).subscribe(state => plotState=state);   
    if (_.includes(plotState.event_streams, stream.id)) {
      return true;
    }
    return false;
  }

  //getPlotData: return IDataSet of plot data
  //
  getPlotData(){
    let plotData:IDataSet
    this.store.select(
      createSelector(explorer_UI_,state=>state.plot.plot_data))
      .pipe(take(1)).subscribe(state => plotData=state); 
    return plotData;
  }
  
  //PRIVATE
  private findNeededElements(
    elements: Array<any>,
    existingData: IDataSet|IEventsSet,
    timeRange: IRange
  ) {
    return elements
      .filter(e => {
        let data = existingData[e.id];
        if (data === undefined || data == null) {
          return true;
        } else if (data.start_time != timeRange.min || data.end_time != timeRange.max) {
          return true;
        } else {
          return false;
        }
      })      
  }


}