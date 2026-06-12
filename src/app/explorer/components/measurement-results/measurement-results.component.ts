
import {combineLatest} from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import {
  MeasurementService,
  PlotService
} from '../../services';
import { 
  IRange
} from "../../store/helpers"
import {
  MeasurementSelectors,
  PlotSelectors
} from "../../selectors"
import { 
  IMeasurement,
  IMeasurementSet
 } from "../../store/measurement";
import { DataService } from "../../../services";
import { IData } from "../../../store/data";

@Component({
    selector: 'app-measurement-results',
    templateUrl: './measurement-results.component.html',
    styleUrls: ['./measurement-results.component.css'],
    standalone: false
})
export class MeasurementResultsComponent implements OnInit, OnDestroy {

  public displayedMeasurements$: Observable<IDisplayedMeasurement[]>
  private subs: Subscription[];

  constructor(
    public measurementSelectors: MeasurementSelectors,
    public measurementService: MeasurementService,
    public plotService: PlotService,
    public plotSelectors: PlotSelectors,
    public dataService: DataService
  ) {
    this.subs = [];

    //figure out whether measurements are direct or relative
    //
    let activeMeasurements$ = combineLatest([
      this.measurementSelectors.relative$,
      this.measurementSelectors.directMeasurements$,
      this.measurementSelectors.relativeMeasurements$])
      .pipe(map(([isRelative, direct, relative]) => isRelative ? relative : direct))

    //create the display data type
    //
    this.displayedMeasurements$ = combineLatest(
      [activeMeasurements$,
      this.plotSelectors.plottedElements$]).pipe(
      map(([measurements, elements]) => {
        return elements.map(e => {
          let m: IDisplayedMeasurement = { 'name': e.name, 'color': e.color, 'valid': false }
          m.name = e.display_name.length == 0 ? m.name : e.display_name;

          if (measurements[e.id] === undefined ||
            measurements[e.id].valid == false ||
            e.display_type == 'event')
            return m;

          m.mean = measurements[e.id].mean;
          m.min = measurements[e.id].min;
          m.max = measurements[e.id].max;
          m.valid = true;
          return m;
        })
      }));
  }


  ngOnInit() {
    //make direct measurements
    //
    this.subs.push(
      combineLatest([this.measurementSelectors.enabled$,
        this.measurementSelectors.measurementRange$,
        this.plotSelectors.plottedElements$]).pipe(
      filter(([enabled, range, elements]) => (enabled && range != null)))
      .subscribe(([enabled, range, elements]) => {
        let dataSet = this.plotService.getPlotData();
        let measurements = elements.reduce((acc:IMeasurementSet, e) => {
          if(dataSet[e.id]===undefined){
            acc[e.id] = {valid: false}
          } else {
            acc[e.id] = this.measure(dataSet[e.id], range);
          }
          return acc;
        }, {})
        this.measurementService
          .setDirectMeasurements(measurements)

      }));

    //make relative measurements
    //
    this.subs.push(
      combineLatest([this.measurementSelectors.enabled$,
      this.measurementSelectors.zeroRange$,
      this.measurementSelectors.directMeasurements$,
      this.measurementSelectors.zeroMeasurements$])
      .subscribe(([enabled, range, measurements, zeros]) => {
        if(!enabled){
          return; //measurement not enabled
        }
        if(range==null){
          return; //no zero set so no relative measurements
        }
        let relative_measurements =
          Object.keys(measurements).reduce((acc, id) => {
            if (zeros[id] === undefined) {
              //we don't have zero data for this element
              acc[id] = { valid: false }
            } else {
              acc[id] = {
                mean: measurements[id].mean - zeros[id].mean,
                min: measurements[id].min - zeros[id].min,
                max: measurements[id].max - zeros[id].max,
                valid: measurements[id].valid && zeros[id].valid
              }
            }
            return acc;
          }, {} as any);
        this.measurementService
          .setRelativeMeasurements(relative_measurements)
      }));

    //retrieve missing data from zero range
    //
    this.subs.push(combineLatest([
      this.measurementSelectors.enabled$,
      this.plotSelectors.plottedElements$,
      this.measurementSelectors.zeroMeasurements$,
      this.measurementSelectors.zeroRange$])
      .subscribe(([enabled, plottedElements, measurements, range]) => {
        if(!enabled)
          return; //not enabled
        if(range===undefined || range == null)
          return; //no zero is set

        //figure out if any elements are missing zero measurements
        let missing_elements =
          plottedElements.reduce((acc, e) => {
            if (measurements[e.id] === undefined) {
              acc.push(e);
            }
            return acc;
          }, []);
        if(missing_elements.length==0)
          return; //we have all the data, return

        //some data is missing, retrieve it (use a small resolution and no padding)
        this.dataService.loadData(range.min, range.max, missing_elements, 200, 0)
          .subscribe(dataSet => {
            let measurements = Object.keys(dataSet).reduce((acc, id) => {
              acc[id] = this.measure(dataSet[id], range);
              return acc;
            }, {} as any)
            this.measurementService.addZeroMeasurements(measurements)
          })
      }));
  }

  public setRelativeMeasurement(event:EventTarget){
    this.measurementService.setRelative((event as HTMLInputElement).checked)
  }

  ngOnDestroy() {
    while (this.subs.length > 0)
      this.subs.pop().unsubscribe()
  }

  //-------------
  private measure(data: IData, range: IRange): IMeasurement {
    let measurement: IMeasurement = {
      mean: 0,
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY,
      valid: false
    }
    if (data.valid == false || data.type == 'interval')
      return measurement;

    let numPoints = 0; //for calculating the mean

    data.data.reduce((measurement, x) => {
      if (x == null || x[0] < range.min || x[0] > range.max)
        return measurement; //this point is out of bounds
      numPoints += 1;
      switch (data.type) {
        case "raw":
          measurement.mean += x[1];
          measurement.min = Math.min(measurement.min, x[1])
          measurement.max = Math.max(measurement.max, x[1])
          break;
        case "decimated":
          measurement.mean += x[1];
          measurement.min = Math.min(measurement.min, x[2])
          measurement.max = Math.max(measurement.max, x[3])
          break;
        default:
          console.log("error, unknown data type: ", data.type);
      }
      return measurement;
    }, measurement)
    if (numPoints > 0) {
      measurement.mean /= numPoints;
      measurement.valid = true;
    }
    return measurement;
  }
}


export interface IDisplayedMeasurement {
  name: string,
  color: string,
  mean?: number,
  min?: number,
  max?: number,
  valid: boolean
}
