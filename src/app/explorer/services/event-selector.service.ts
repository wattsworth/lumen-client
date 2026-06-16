import { Injectable } from '@angular/core';
import { IAppState } from '../../app.store';
import { Store } from '@ngrx/store';

import * as EventSelectorActions from '../store/event-selector/actions';
import * as MeasurementActions from '../store/measurement/actions';
import * as AnnotationActions from '../store/annotations/actions'
import { IEventsSet, IEventStream } from 'src/app/store/data';
@Injectable()
export class EventSelectorService {

    constructor(
        private store: Store<IAppState>,
    ){}
  //start event selection mode
  //
  public startEventSelector() {
    this.store.dispatch(EventSelectorActions.enableEventSelector());
    //make sure the Annotation and Measurement Modes are disabled
    this.store.dispatch(MeasurementActions.disableMeasurements());
    this.store.dispatch(AnnotationActions.disableAnnotations());
  }

  //exit event selection mode
  //
  public exitEventSelector() {
    this.store.dispatch(EventSelectorActions.disableEventSelector());
  }

  //add events to the selection
  //
  public addEvents(eventsSet: IEventsSet){
    this.store.dispatch(EventSelectorActions.addEvents({eventsSet}));
  }

  //remove events from the selection
  //
  public removeEvents(eventsSet: IEventsSet){
    this.store.dispatch(EventSelectorActions.removeEvents({eventsSet}));
  }

  //remove all the events from the specified EventStream
  //
  public removeEventStream(eventStream: IEventStream){
    this.store.dispatch(EventSelectorActions.removeEventStream({eventStream}))
  }
  //clear selection
  //
  public clearEventSelection(){
    this.store.dispatch(EventSelectorActions.clearSelection());
  }
}

