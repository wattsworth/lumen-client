import { createReducer, on } from '@ngrx/store';

import * as actions from './actions';
import { IState } from './types';
import { IEventsSet, IEvent} from 'src/app/store/data';
import {
  defaultEventSelectorState
} from './initial-state';

export const reducer = createReducer(
    defaultEventSelectorState,
    //enter event selector state
    on(actions.enableEventSelector, (state: IState) => ({...state, enabled: true})),
    //cancel event selector state
    on(actions.disableEventSelector, (state: IState) => ({...state, enabled: false})),
    //add events to the selection
    on(actions.addEvents, (state: IState, {eventsSet}) => {
      //make a list of all the event stream id's
      let allStreams = Object.keys(eventsSet).concat(Object.keys(state.eventsSet))
      let newEventsSet: IEventsSet = {}
      for(let id of allStreams){
        let cur_events: IEvent[] = []
        let new_events: IEvent[] = []
        if(state.eventsSet[id]){
          cur_events = state.eventsSet[id].events
        }
        if(eventsSet[id]){
          new_events = eventsSet[id].events
        }
        //only keep unique events (from Stack Overflow)
        function onlyUnique(value: IEvent, index: number, self:IEvent[]) {
          return self.indexOf(value) === index;
        }
        let events:IEvent[] = cur_events.concat(new_events).filter(onlyUnique);

        if(events.length>0){
          newEventsSet[id]={
            valid: true,
            start_time: Math.min(...events.map(e=>e.start_time)),
            end_time: Math.max(...events.map(e=>e.end_time)),
            count: events.length,
            type: eventsSet[id].type,
            events: events
          };
        }
        
      }
      return {...state, eventsSet: newEventsSet}
    }),
    //remove events from the selection
    on(actions.removeEvents, (state: IState, {eventsSet}) => {
      let newEventsSet: IEventsSet = {}
      for(let id of Object.keys(state.eventsSet)){
        if(eventsSet[id]===undefined){
          //nothing deselected in this stream
          newEventsSet[id] = {...state.eventsSet[id]}
          continue;
        }
        let removedEventIds=eventsSet[id].events.map(e=>e.id)
        let events = state.eventsSet[id].events.filter(event=>!removedEventIds.includes(event.id))
        
        if(events.length>0){
          newEventsSet[id] = {
            valid: true,
            start_time: Math.min(...events.map(e=>e.start_time)),
            end_time: Math.max(...events.map(e=>e.end_time)),
            count: events.length,
            type: eventsSet[id].type,
            events: events
          };
        }
      }
      return {...state, eventsSet: newEventsSet}
    }),
    //remove all events from the specified stream from the selection
    on(actions.removeEventStream, (state: IState, {eventStream}) => {
      const {[eventStream.id]: removed, ...remaining}  = state.eventsSet;
      return {...state, eventsSet: remaining}
    }),
    //clear the selection
    on(actions.clearSelection, (state: IState) => ({...state, eventsSet: {}}))
    );