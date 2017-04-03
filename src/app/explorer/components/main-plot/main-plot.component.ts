import {
  Component,
  ViewChild,
  ElementRef,
  Renderer,
  OnInit,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { select } from 'ng2-redux';
import {
  IRange
} from '../../store';

import { 
  IDataSet,
  IDbElement
} from '../../../store/data';
import { ExplorerService } from '../../explorer.service';
import { ExplorerSelectors } from '../../explorer.selectors';
import { FLOT_OPTIONS } from './flot.options';
import * as _ from 'lodash';

declare var $: any;

@Component({
  
  selector: 'app-main-plot',
  templateUrl: './main-plot.component.html',
  styleUrls: ['./main-plot.component.css']
})
export class MainPlotComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('plotArea') plotArea: ElementRef

  private subs: Subscription[];
  private plot: any;

  private xBounds:  Subject<IRange>
  
  constructor(
    private renderer: Renderer,
    private explorerSelectors: ExplorerSelectors,
    private explorerService: ExplorerService
  ) {
    this.plot = null;
    this.xBounds = new Subject();
    this.subs = [];
  }

  ngOnInit(
  ) {
    let s = this.explorerSelectors.plotTimeRange$
      .distinctUntilChanged((x,y)=>_.isEqual(x,y))      
      .combineLatest(this.explorerSelectors.plottedElements$)
      .subscribe(([timeRange, elements]) => {
        this.explorerService.loadPlotData(elements, timeRange)
      })
    this.subs.push(s);
    s = this.xBounds
      .debounceTime(250)
      .distinctUntilChanged((x,y)=>_.isEqual(x,y))   
      .subscribe(range => this.explorerService.setPlotTimeRange(range));
    this.subs.push(s);
  }
  ngOnDestroy() {
    while(this.subs.length>0)
      this.subs.pop().unsubscribe()
  }
 
  ngAfterViewInit() {
    this.explorerSelectors.leftElements$
      .combineLatest(this.explorerSelectors.rightElements$)
      .map(([left, right]) => { return { left: left, right: right } })
      .combineLatest(this.explorerSelectors.plotData$)
      .subscribe(([elementsByAxis, data]) => {
        //build data structure
        let leftAxis = this.buildDataset(elementsByAxis.left, data, 1);
        let rightAxis = this.buildDataset(elementsByAxis.right, data, 2);
        let dataset = leftAxis.concat(rightAxis);
        if (dataset.length == 0) {
          this.explorerService.hidePlot();
          return; //no data to plot
        }
        this.explorerService.showPlot();
        if (this.plot == null) {
          this.plot = $.plot(this.plotArea.nativeElement,
            dataset, FLOT_OPTIONS);
          $(this.plotArea.nativeElement).bind('plotpan', this.updateAxes.bind(this))
          $(this.plotArea.nativeElement).bind('plotzoom',this.updateAxes.bind(this))

        } else {
          this.plot.setData(dataset);
          this.plot.setupGrid();
          this.plot.draw();
        }
      })
    //this.renderer.invokeElementMethod(this.plotArea.nativeElement,'focus2');
  }

  buildDataset(elements: IDbElement[], data: IDataSet, axis: number) {
    return elements.map(element => {
      if (data[element.id] === undefined || data[element.id] == null)
        return null;
      let baseConfig = {
        label: element.name,
        yaxis: axis,
        //bars: { show: false, barWidth: 2 },
        //points: { show: false },
        color: element.color,
        data: data[element.id].data
      }
      switch(data[element.id].type){
        case 'raw':
          return baseConfig;
        case 'decimated':
          return Object.assign({},baseConfig,
            {
              fillArea: [{ opacity: 0.2, representation: "asymmetric" }],
            })
        case 'interval':
          return Object.assign({},baseConfig,
            {
              label: `${element.name} *`
            })
        default:
          console.log("unknown data type: ",data[element.id].type)
      }
      return 
    }).filter(data => data != null)
  }

  updateAxes(){
    let axes = this.plot.getAxes();
    this.xBounds.next({
      min: axes.xaxis.options.min, 
      max: axes.xaxis.options.max
    })
  }
}
