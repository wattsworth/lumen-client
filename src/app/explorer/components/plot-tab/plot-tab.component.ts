import { Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { ModalDirective } from 'ngx-bootstrap/modal';
import * as _ from 'lodash-es';

import { PlotSelectors } from '../../selectors/plot.selectors';
import { PlotService, AnnotationUIService, EventSelectorService } from '../../services';

import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { AnnotationService, MessageService } from '../../../services';
import { AnnotationSelectors, EventSelectorSelectors, MeasurementSelectors } from '../../../explorer/selectors';
import { IDbStream, IAnnotation, IEventsSet, IEventStream, INilm } from '../../../store/data';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Dictionary } from '@ngrx/entity';

@Component({
    selector: 'app-plot-tab',
    templateUrl: './plot-tab.component.html',
    styleUrls: ['./plot-tab.component.css'],
    animations: [
        // animation triggers go here
        trigger('slideUpDown', [
            state('in', style({ transform: 'translateY(0)' })),
            transition(':enter', [
                style({ 'opacity': 0 }),
                animate(300, style({ 'opacity': 1.0 }))
            ]),
            transition(':leave', [
                style({ 'overflow': 'hidden' }),
                animate(300, style({ 'height': 0 }))
            ])
        ]),
    ],
    standalone: false
})
export class PlotTabComponent implements OnInit, OnDestroy {

  
  private subs: Subscription[];
  public toolModeSelected$: Observable<boolean>
  public annotationMap$: Observable<IAnnotatedStream[]>
  public editForm: FormGroup;
  public selectedAnnotation: IAnnotation;
  public filterText: string;
  @ViewChild('annotationEditModal', {static: false}) public annotationModal: ModalDirective;

  constructor(
    public plotSelectors: PlotSelectors,
    public plotService: PlotService,
    public annotationService: AnnotationService,
    public annotationUIService: AnnotationUIService,
    public annotationSelectors: AnnotationSelectors,
    public measurementSelectors: MeasurementSelectors,
    public eventSelectorSelectors: EventSelectorSelectors,
    public eventSelectorService: EventSelectorService,
    public messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.subs = [];
    this.filterText = "";
    this.selectedAnnotation = {'title': 'none', 'content': 'none', 
    'id': null, 'joule_id': null, 'start':0, 'end':0, 'db_stream_id': null};
    this.toolModeSelected$ = combineLatest(
      [this.annotationSelectors.enabled$,
      this.eventSelectorSelectors.enabled$,
      this.measurementSelectors.enabled$]).pipe(map(
        ([x,y,z]) => x||y||z))
   }

  ngOnInit() {
    this.editForm = this.fb.group({
      title: ['', Validators.required],
      content: [''],
      db_stream_id: [null, Validators.required]
    })
    this.subs.push(this.plotSelectors.plottedStreams$.pipe(
      map(streams => streams.map(stream=>stream.id)),
      distinctUntilChanged((x,y)=>_.isEqual(x,y)))
      .subscribe( stream_ids => {
        stream_ids.map(id => {
          this.annotationService.loadAnnotations(id)
        })
      })
    )

    this.annotationMap$ = combineLatest([
        this.annotationSelectors.annotations$,
        this.plotSelectors.nilms$,
        this.plotSelectors.plottedStreams$]).pipe(
        map(([annotations, nilms, streams]) => {
          return streams.map(stream => {
            let editable = false;
            if (nilms[stream.nilm_id] !== undefined){
              if(nilms[stream.nilm_id].role=='admin' ||
                 nilms[stream.nilm_id].role=='owner')
                editable = true;
            }
            return{
              stream: stream,
              editable: editable,
              annotations: _.filter(annotations, 
                annotation => annotation.db_stream_id == stream.id)
            }
          })
        })
      )
  }
  ngOnDestroy() {
    while (this.subs.length > 0)
      this.subs.pop().unsubscribe()
  }
  public editAnnotation($event: any, annotation:IAnnotation){
    $event.stopPropagation();
    this.selectedAnnotation = {...annotation};
    this.annotationModal.show();
    //this.annotationService.deleteAnnotation(annotation)
  }
  public saveAnnotation(){
    this.annotationService.saveAnnotation(this.selectedAnnotation);
    this.annotationModal.hide();
  }
  public deleteAnnotation(){
    this.annotationService.deleteAnnotation(this.selectedAnnotation);
    this.annotationModal.hide();
  }
  public downloadEvents(eventsSet: IEventsSet, eventStreams: Dictionary<IEventStream>, nilms: Dictionary<INilm>){
    if(Object.keys(eventsSet).length==0){
      this.messageService.setWarning("No Events Selected");
      return;
    }
    let event_data: any[] = Object.keys(eventsSet).reduce((event_data: any[], id)=>{
      let stream = eventStreams[id]
      let nilm = nilms[stream.nilm_id]
      event_data.push({
        node: nilm.name,
        url: nilm.url,
        path: stream.path,
        display_name: stream.plot_settings.display_name,
        selection: eventsSet[id]
      })
      return event_data}, [])

    //https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
    var element = document.createElement('a');
    let event_json = JSON.stringify(event_data, null, 2);
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(event_json));
    element.setAttribute('download', 'events.txt');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
}

export interface IAnnotatedStream{
  stream: IDbStream,
  editable: boolean,
  annotations: IAnnotation[]
}

