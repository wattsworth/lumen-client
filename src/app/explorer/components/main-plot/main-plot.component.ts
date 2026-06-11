
import { withLatestFrom } from 'rxjs/operators';
import {
  Component,
  ViewChild,
  ElementRef,
  Renderer2,
  OnInit,
  OnDestroy,
  AfterViewInit,

} from '@angular/core';
import { Subscription, Subject, combineLatest } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged} from 'rxjs/operators';
import html2canvas from "html2canvas"

import { 
  PlotService,
  MeasurementService,
  AnnotationUIService,
  EventSelectorService
} from '../../services';
import { 
  PlotSelectors,
  MeasurementSelectors, 
  AnnotationSelectors,
  EventSelectorSelectors
} from '../../selectors';

import { FLOT_OPTIONS } from './flot.options';

import * as _ from 'lodash-es';
import { EventStreamService } from '../../../services';
import {IRange} from '../../store/helpers'
import { IEventsSet } from 'src/app/store/data';
declare var $: any;

@Component({
    selector: 'app-main-plot',
    templateUrl: './main-plot.component.html',
    styleUrls: ['./main-plot.component.css'],
    standalone: false
})
export class MainPlotComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('plotArea', {static: true}) plotArea: ElementRef

  private subs: Subscription[];
  private plot: any;

  private xBounds: Subject<IRange>
  private plotIntervalSelection: Subject<IRange>
  private plotPointSelection: Subject<number>
  //make a local copy of FLOT_OPTIONS so the plot
  //can be customized before it is displayed
  private flot_options: any;  

  //saved by the time range listener if the plot
  //isn't drawn yet
  private storedPlotTimeRange: IRange;

  //keep track of currently displayed events so they can be (de)selected
  private displayedEventsSet: IEventsSet;
  
  constructor(
    private plotSelectors: PlotSelectors,
    private measurementSelectors: MeasurementSelectors,
    private annotationSelectors: AnnotationSelectors,
    private eventSelectorSelectors: EventSelectorSelectors,
    private plotService: PlotService,
    private measurementService: MeasurementService,
    private annotationUIService: AnnotationUIService,
    private eventSelectorService: EventSelectorService
  ) {
    this.plot = null;
    this.xBounds = new Subject();
    this.plotIntervalSelection = new Subject();
    this.plotPointSelection = new Subject();
    this.flot_options = _.cloneDeep(FLOT_OPTIONS);
    this.subs = [];
    this.storedPlotTimeRange = { min: null, max: null }
    this.displayedEventsSet = {};
  }

  ngOnInit(
  ) {
    /* load data based on changes to the plotTimeRange */
    let newTimeRange = this.plotSelectors.plotTimeRange$.pipe(
      distinctUntilChanged((x, y) => _.isEqual(x, y)))
    let newPlottedElements = this.plotSelectors.plottedElements$.pipe(
      distinctUntilChanged((x,y) => _.isEqual(x,y)));
    let newPlottedEventStreams = this.plotSelectors.plottedEventStreams$.pipe(
      distinctUntilChanged((x,y) => _.isEqual(x,y))
    )
    this.subs.push(combineLatest(
      [newTimeRange, newPlottedElements, newPlottedEventStreams]).pipe(
        withLatestFrom(this.plotSelectors.addingPlotData$),
        filter(([[timeRange, elements, streams], busy]) => !busy && (elements.length!=0 ||  streams.length!=0)))
      .subscribe(([[timeRange, elements, streams], busy]) => {
        //retrieve current width of plot to determine the appropriate resolution
        let resolution = $(this.plotArea.nativeElement).width();
        this.plotService.loadPlotData(elements, timeRange, resolution*2)
        this.plotService.loadEventData(streams, timeRange)
      }));
    /* set the plotTimeRange based on changes to xbounds */
    this.subs.push(this.xBounds.pipe(
      debounceTime(250),
      distinctUntilChanged((x, y) => _.isEqual(x, y)))
      .subscribe(range =>
        this.plotService.setPlotTimeRange(range)));
    /* set plot axes based on changes to plotTimeRange */
    this.subs.push(this.plotSelectors.plotTimeRange$.pipe(
      distinctUntilChanged((x, y) => _.isEqual(x, y)))
      .subscribe(timeRange => {
        if (this.plot == null) {
          this.storedPlotTimeRange = timeRange;
          return;
        }
        let xaxis = this.plot.getAxes().xaxis;
        xaxis.options.min = timeRange.min;
        xaxis.options.max = timeRange.max;
        this.plot.setupGrid();
        this.plot.draw();
      }));
    /* when an event stream is duplicated, add it to the plot */
    this.subs.push(combineLatest(
      [this.plotSelectors.plottedEventStreams$,this.plotSelectors.eventStreams$])
      .subscribe(([plotted_streams, all_streams])=>{
          let plotted_ids = plotted_streams.map(stream=>stream.id)
          Object.values(all_streams)
            //find all of the duplicate streams that are not already plotted
            .filter(stream=>stream.id.indexOf('_')>0 && !plotted_ids.includes(stream.id))
            .map(stream => this.plotService.plotEvents(stream))
        }))
    /* set data cursor visibility based on state */
    this.subs.push(this.plotSelectors.dataCursor$.pipe(
      distinctUntilChanged())
      .subscribe(val => {
        if (this.plot != null)
          this.plot.enableTooltip(val);
      })
    );
    /* enable selection mode when the plot is in measurement state*/
    this.subs.push(
      
      combineLatest(
        [this.measurementSelectors.enabled$, 
          this.annotationSelectors.enabled$,
          this.eventSelectorSelectors.enabled$
        ]).pipe(distinctUntilChanged())
      .subscribe(([measure, annotate, select]) => {
        if (this.plot != null){
          if(measure||annotate||select){ //enter selection mode
            //enable selection
            this.plot.getOptions()['selection']['interactive']="true";
            //disable pan/zoom
            this.plot.getOptions()['zoom']['interactive']=false;
            this.plot.getOptions()['pan']['interactive']=false;
            if (select){
              //green and red highlight depending on selection direction
              this.plot.getOptions()['selection']['color']="#00b33c"
              this.plot.getOptions()['selection']['altColor']="#cc0000"
              this.plot.getOptions()['selection']['transient']=true
            } else {
              //gray highlight regardless of selection direction
              this.plot.getOptions()['selection']['color']="#e8cfac"
              this.plot.getOptions()['selection']['altColor']="#e8cfac"
              this.plot.getOptions()['selection']['transient']=false

            }
          } else {
            //disable selection
            this.plot.getOptions()['selection']['interactive']=false;
            this.plot.clearSelection(true);
            //enable pan/zoom
            this.plot.getOptions()['zoom']['interactive']=true;
            this.plot.getOptions()['pan']['interactive']=true;          }
        }
      })
    );
    /* set the left axis (y1) range based on state */
    this.subs.push(this.plotSelectors.plotY1$
      .subscribe(range => {
        if (this.plot != null) {
          this.plot.getAxes().yaxis.options.min = range.min;
          this.plot.getAxes().yaxis.options.max = range.max;
          this.plot.setupGrid();
          this.plot.draw();
        }
      }));
    /* set the right axis (y2) range based on state */
    this.subs.push(this.plotSelectors.plotY2$
      .subscribe(range => {
        if (this.plot != null) {
          this.plot.getAxes().y2axis.options.min = range.min;
          this.plot.getAxes().y2axis.options.max = range.max;
          this.plot.setupGrid();
          this.plot.draw();
        }
      }));
    /* remove time bounds when plot is empty (so new elements auto scale)*/
    this.subs.push(this.plotSelectors.isPlotEmpty$.pipe(
      distinctUntilChanged(),
      filter(isEmpty => isEmpty==true))
      .subscribe(_ => {
        this.plotService.resetTimeRanges();
      }));
    /* set the left axis options based on state */
    let newLeftElementUnits = this.plotSelectors.leftElementUnits$.pipe(
      distinctUntilChanged((x,y) => _.isEqual(x,y)));
    this.subs.push(combineLatest(
      [this.plotSelectors.leftAxisSettings$,newLeftElementUnits])
      .subscribe(([settings,units]) => {
        let options = this.flot_options.yaxes[0];
        this.flot_options.legend.left_font_size=settings.legend_font_size;
        if(this.plot!=null){
          this.plot.getOptions().legend.left_font_size=settings.legend_font_size;          
          options = this.plot.getAxes().yaxis.options;
        }
        this.configureAxis(options, settings, units);
        if(this.plot != null){  
          this.plot.setupGrid();
          this.plot.draw();
        }
      }))
    /* set the right axis options based on state */
    let newRightElementUnits = this.plotSelectors.rightElementUnits$.pipe(
      distinctUntilChanged((x,y) => _.isEqual(x,y)));
    this.subs.push(combineLatest(
      [this.plotSelectors.rightAxisSettings$, newRightElementUnits])
      .subscribe(([settings,units]) => {
        let options = this.flot_options.yaxes[1];
        this.flot_options.legend.right_font_size=settings.legend_font_size;
        if(this.plot!=null){
          this.plot.getOptions().legend.right_font_size=settings.legend_font_size;          
          options = this.plot.getAxes().y2axis.options;
        }
        this.configureAxis(options, settings, units);
        if(this.plot != null){  
          this.plot.setupGrid();
          this.plot.draw();
        }
      }))
    /* set the time axis options based on state */
    this.subs.push(this.plotSelectors.timeAxisSettings$
      .subscribe(settings => {
        let options = this.flot_options.xaxis;
        if(this.plot!=null){
          options = this.plot.getAxes().xaxis.options;
        }
        if(settings.axis_font_size!=null)
          options.font.size = settings.axis_font_size;
        else
          options.font.size = 12;
        options.ticks = settings.ticks;       
        if(this.plot != null){  
          this.plot.setupGrid();
          this.plot.draw();
        }
      }))

    // ---- MEASUREMENT SELECTORS ----
    //auto scale the axes to match the data when elements
    //are added to an empty axis
    //autoscale y1 (left)
    this.subs.push(this.plotSelectors.leftElementIDs$
      .pipe(map(ids => ids.length == 0),
      distinctUntilChanged(),
      filter(isEmpty => isEmpty == true))
      .subscribe(x => {
        if (this.plot == null)
          return;
        this.plotService.autoScaleAxis('left');
      }));
    this.subs.push(this.plotSelectors.rightElementIDs$
      .pipe(map(ids => ids.length == 0),
      distinctUntilChanged(),
      filter(isEmpty => isEmpty == true))
      .subscribe(x => {
        if (this.plot == null)
          return;
        this.plotService.autoScaleAxis('right');
      }));
    //

    /* listen for plot measurement selections (range) */
    this.subs.push(
      this.plotIntervalSelection.pipe(
        withLatestFrom(this.measurementSelectors.enabled$))
      .subscribe( ([range, enabled]) => {
        if(enabled)
          this.measurementService.setRange(range);
      })
    );

    /* show the zero range */
    this.subs.push(this.measurementSelectors.zeroRange$
      .subscribe(range => {
        if(this.plot==null)
          return; //no plot so nothing to highlight

        if(range===undefined || range==null){
          this.plot.showHighlight(false);  
        } else {
          this.plot.setHighlight(range.min, range.max);
        }
      }));
    
    /* remove the selector when range is cleared */
    this.subs.push(this.measurementSelectors.measurementRange$
      .subscribe(range => {
        if(this.plot==null)
          return; //no plot so nothing to do
        if(range==null){
          this.plot.clearSelection(true);
        }
      }))
    // ---- END MEASUREMENT SELECTORS ----

    // --- ANNOTATION SELECTORS ----
    /* listen for plot annotation selections (range) */
    this.subs.push(this.plotIntervalSelection.pipe(
        withLatestFrom(this.annotationSelectors.enabled$))
        .subscribe( ([range, enabled]) => {
        if(enabled){
          this.annotationUIService.setRange(range);
        }
      })
    );

    /* listen for plot annotation selections (point) */
    this.subs.push(this.plotPointSelection.pipe(
      withLatestFrom(this.annotationSelectors.enabled$))
        .subscribe(([timestamp, enabled])=>{
          if(enabled){
            this.annotationUIService.setRange({
              min: timestamp, 
              max: null})
          }
        })
    );

    /* remove the selector when range is cleared */
    this.subs.push(this.annotationSelectors.selectionRange$
      .subscribe(range => {
        if(this.plot==null)
          return; //no plot so nothing to do
        if(range==null){
          this.plot.clearSelection(true);
        }
      }))

    /* show the annotated range */
    this.subs.push(
      this.annotationSelectors.annotatedRange$.pipe(
        withLatestFrom(this.plotSelectors.plotTimeRange$))
      
      .subscribe(([annotation_range, plot_range]) => {
        if(this.plot==null)
          return; //no plot so nothing to highlight

        // highlight the annotation
        if(annotation_range===undefined || annotation_range==null){
          this.plot.showHighlight(false);
          return; 
        } else {
          this.plot.setHighlight(annotation_range.min, annotation_range.max);
        }
        //move the plot to show the annotation
        let new_plot_range = _.clone(plot_range)
        if(plot_range.min == null || plot_range.max==null)
          return; //autoscale time axis
        //find the mid point of the selected annotation
        let midpoint = (annotation_range.min + annotation_range.max)/2
        //if the midpoint is off the plot, move until it is visible
        let plot_width = plot_range.max - plot_range.min;
        let annotation_width = annotation_range.max - annotation_range.min;
        if(midpoint < plot_range.min || midpoint > plot_range.max){
          //keep the current plot width but move the center point
          new_plot_range.min = midpoint - plot_width/2;
          new_plot_range.max = midpoint + plot_width/2;
        }
        //if the plot width is too small to display the whole annotation
        //then expand it with some padding
        if(annotation_width != 0){
          if(new_plot_range.min >= annotation_range.min)
            new_plot_range.min = annotation_range.min - (annotation_width*0.1);
          if(new_plot_range.max <= annotation_range.max)
            new_plot_range.max = annotation_range.max + (annotation_width*0.1);
        }
        //change the plot time bounds
        if(!_.isEqual(plot_range, new_plot_range)){
          this.plotService.setPlotTimeRange(new_plot_range);
        }
      }));
    // ---- END ANNOTATION SELECTORS ----

    // ---- BEGIN EVENT SELECTOR TOOLS ---

    /* listen for plot selections (range) */
    this.subs.push(this.plotIntervalSelection.pipe(
      withLatestFrom(this.eventSelectorSelectors.enabled$))
      .subscribe( ([range, enabled]) => {
      if(enabled){
        //figure out what events are inside this range
        //create a filtered IEventsSet object with just these
        //events
        let selectedEvents = Object.keys(this.displayedEventsSet)
          .reduce((eventsSet: IEventsSet, id)=>{
            eventsSet[id] = {...this.displayedEventsSet[id]}
            eventsSet[id].events = this.displayedEventsSet[id].events
              .filter(event => event.end_time>range.min && event.start_time<range.max)
            return eventsSet;
            }, {} as IEventsSet)
        if(range.leftToRight){
         this.eventSelectorService.addEvents(selectedEvents)
        } else{
          this.eventSelectorService.removeEvents(selectedEvents)
        }
      }
    })
  );
    // ---- END EVENT SELECTOR TOOLS ---
  }
  
  ngOnDestroy() {
    while (this.subs.length > 0)
      this.subs.pop().unsubscribe()
  }

  ngAfterViewInit() {
    let elementsByAxis = combineLatest(
      [this.plotSelectors.leftElements$,this.plotSelectors.rightElements$])
      .pipe(map(([left, right]) => { return { left: left, right: right } }));
    
    // Plot Data
    this.subs.push(combineLatest(
        [elementsByAxis,
          this.plotSelectors.plottedEventStreams$,
        this.plotSelectors.plotEventData$,
        this.eventSelectorSelectors.selectedEventsSet$,
        this.plotSelectors.plotData$, 
        this.plotSelectors.showDataEnvelope$,
       ])
      .subscribe(([elementsByAxis, eventStreams, eventsSet, selectedEventsSet, data, showEnvelope]) => {
        //build data structure
        let leftAxis = this.plotService
          .buildDataset(elementsByAxis.left, data, 1, showEnvelope);
        let rightAxis = this.plotService
          .buildDataset(elementsByAxis.right, data, 2, showEnvelope);
        let eventData = this.plotService
          .buildEventDataset(eventStreams, eventsSet, selectedEventsSet)
        //store event data to use with event selector tools
        this.displayedEventsSet = eventsSet;
        let dataset = [...leftAxis, ...rightAxis, ...eventData]
        if (dataset.length == 0) {
          this.plotService.hidePlot();
          return; //no data to plot
        }
        this.plotService.showPlot();
        if (this.plot == null) {
          this.flot_options.xaxis.min = this.storedPlotTimeRange.min;
          this.flot_options.xaxis.max = this.storedPlotTimeRange.max;
          this.plot = $.plot(this.plotArea.nativeElement,
            dataset, this.flot_options);
          $(this.plotArea.nativeElement).bind('plotpan', this.updateAxes.bind(this))
          $(this.plotArea.nativeElement).bind('plotzoom', this.updateAxes.bind(this))
          $(this.plotArea.nativeElement).bind('plotselected', this.updateMeasurement.bind(this))
          $(this.plotArea.nativeElement).bind('plotclicked', this.updatePlotSelection.bind(this))
          $(this.plotArea.nativeElement).bind('eventSettingsChanged', this.updateEventSettings.bind(this))
          setTimeout(()=>this.plotService.disableDataCursor(),0);
        
        } else {
          this.plot.setData(dataset);
          this.plot.setupGrid();
          this.plot.draw();
        }
      }));
  }

  
  //flot helper function to customize axes based on settings
  configureAxis(axis_options: any, settings: any, units: any){
    axis_options.axisLabel=this.buildUnitLabel(units,settings.scale);
    if(settings.axis_font_size!=null)
      axis_options.font.size = settings.axis_font_size;
    else
      axis_options.font.size = 12;
    axis_options.ticks = settings.ticks;
    axis_options.tickDecimals = settings.precision;
    axis_options.tickScaler = (val: any) => {
      if(settings.scale!=null)
        val = (val/(10**settings.scale));
      return val;
    };
  }

  //flot hook to listen for event settings changes
  updateEventSettings(event: any, settings: any){
    console.log(settings)
  }
  //flot hook to listen for zoom/scroll events
  updateAxes() {
    let axes = this.plot.getAxes();
    this.xBounds.next({
      min: Math.round(axes.xaxis.options.min),
      max: Math.round(axes.xaxis.options.max)
    })
  }

  //flot hook to listen for plot selection events (measurements or annotations)
  updateMeasurement() {
    let selection = this.plot.getSelection();
    this.plotIntervalSelection.next({
      min: Math.round(selection['xaxis']['from']),
      max: Math.round(selection['xaxis']['to']),
      leftToRight: selection['xaxis']['leftToRight']
    })
  }
  clearEventSelectionHighlight(event: any){

  }
  //flot hook to listen for plot click events (annotation only)
  updatePlotSelection(event: any) {
    //DISABLED- no point events, must specify an interval
    //let selection = this.plot.getSelection(true);
    //this.plotPointSelection.next(selection['xaxis']['to'])
  }

  getCanvas(){
    return html2canvas(this.plotArea.nativeElement);
  };

  //flot helper to add scientific notation to unit
  buildUnitLabel(units: string, scale: number){
    if(units==null || units=="none" || units=="event")
      return null;
    switch(scale){
      case -12:
        return "p"+units;
      case -9:
        return "n"+units;
      case -6:
        return "&mu;"+units;
      case -3:
        return "m"+units;
      case null:
      case 0:
        return units;
      case 3:
        return "k"+units;
      case 6:
        return "M"+units;
      case 9:
        return "G"+units;
      case 12:
        return "T"+units;
      default:
        return units+`&times;10<sup>${scale}</sup>`
    }
  }
};


