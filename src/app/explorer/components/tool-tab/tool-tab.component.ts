
import {distinctUntilChanged, filter} from 'rxjs/operators';
import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { combineLatest, Observable, Subscription, timer } from 'rxjs';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { switchMap, map } from 'rxjs/operators';

import {
  PlotService,
  MeasurementService,
  AnnotationUIService,
  EventSelectorService
} from '../../services';
import {
  MeasurementSelectors,
  PlotSelectors,
  AnnotationSelectors,
  EventSelectorSelectors
} from '../../selectors';

/*NOTE: These are set by the state now */
export const LIVE_PLOT_UPDATE_INTERVAL = 5000; //5 seconds
export const LIVE_NAV_UPDATE_INTERVAL = 60 * 1000; //1 minute

export const NAV_LIVE_INTERVAL = 60 * 60 * 1000; //1 hour
export const PLOT_LIVE_INTERVAL = 20 * 60 * 1000; //20 minutes
export const PLOT_PERCENT_FUTURE = 0.1; //10% of plot is in future

@Component({
    selector: 'app-tool-tab',
    templateUrl: './tool-tab.component.html',
    styleUrls: ['./tool-tab.component.css'],
    standalone: false
})

export class ToolTabComponent implements OnInit, OnDestroy {
  @Output() savePlotImage: EventEmitter<string>;
  @Output() saveDataView: EventEmitter<string>;
  @Output() loadDataView: EventEmitter<string>;

  public toolModeSelected$: Observable<boolean>;
  public livePlotUpdateTimer: Observable<any>;
  public liveNavUpdateTimer: Observable<any>;
  public livePlotTimerSubscription: Subscription;
  public liveNavTimerSubscription: Subscription;

  private subs: Subscription[];

  public annotateElementId: number;
  @ViewChild('liveUpdateModal', {static: false}) public liveUpdateModal: ModalDirective;

  constructor(
    public plotService: PlotService,
    public annotationUIService: AnnotationUIService,
    public measurementService: MeasurementService,
    public plotSelectors: PlotSelectors,
    public measurementSelectors: MeasurementSelectors,
    public annotationSelectors: AnnotationSelectors,
    public eventSelectorSelectors: EventSelectorSelectors,
    public eventSelectorService: EventSelectorService
  ) {
    this.savePlotImage = new EventEmitter();
    this.saveDataView = new EventEmitter();
    this.loadDataView = new EventEmitter();
    this.livePlotUpdateTimer = timer(0, LIVE_PLOT_UPDATE_INTERVAL);
    this.liveNavUpdateTimer = timer(0, LIVE_NAV_UPDATE_INTERVAL);

    this.livePlotTimerSubscription = null;
    this.liveNavTimerSubscription = null;

    this.toolModeSelected$ = combineLatest(
      [this.annotationSelectors.enabled$,
      this.eventSelectorSelectors.enabled$,
      this.measurementSelectors.enabled$]).pipe(map(
        ([x,y,z]) => x||y||z))
  
    this.subs = [];
  }

  ngOnInit() {
    this.plotSelectors.liveUpdate$
      .subscribe(live => {
        if (live)
          this.activateLiveUpdate();
        else
          this.deactivateLiveUpdate();
      })
    /* remove time bounds when plot is empty (so new elements auto scale)*/
    this.subs.push(this.plotSelectors.isPlotEmpty$.pipe(
      distinctUntilChanged(),
      filter(isEmpty => isEmpty == true))
      .subscribe(_ => {
        this.plotService.disableLiveUpdate();
      }));
    /* set the live update interval based on user setting*/
    this.livePlotUpdateTimer = this.plotSelectors.liveUpdateInterval$.pipe(
      switchMap(rate => timer(0, rate*1000)));
    
    this.liveNavUpdateTimer = this.plotSelectors.liveUpdateInterval$.pipe(
      switchMap(rate => timer(0, rate*1000*12)));
      
  }
  ngOnDestroy() {
    this.deactivateLiveUpdate();
    while (this.subs.length > 0)
      this.subs.pop().unsubscribe()
  }

  activateLiveUpdate() {
    this.livePlotTimerSubscription =
      this.livePlotUpdateTimer.subscribe(_ => {
        let now = Date.now();
        this.plotService.setPlotTimeRange({
          min: now - PLOT_LIVE_INTERVAL * (1 - PLOT_PERCENT_FUTURE),
          max: now + PLOT_LIVE_INTERVAL * (PLOT_PERCENT_FUTURE)
        })
      })
    this.liveNavTimerSubscription =
      this.liveNavUpdateTimer.subscribe(_ => {
        let now = Date.now();
        this.plotService.setNavTimeRange({
          min: now - NAV_LIVE_INTERVAL,
          max: now
        });
      })
  }

  setLiveUpdateInterval(rate: number){
    this.plotService.setLiveUpdateInterval(rate);
    this.liveUpdateModal.hide();
  }
  deactivateLiveUpdate() {
    if (this.livePlotTimerSubscription != null) {
      this.livePlotTimerSubscription.unsubscribe();
      this.livePlotTimerSubscription = null;
    }
    if (this.liveNavTimerSubscription != null) {
      this.liveNavTimerSubscription.unsubscribe();
      this.liveNavTimerSubscription = null;
    }
  }
}
