import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { normalize } from 'normalizr';
import * as schema from '../../api';
import { MessageService } from '../message.service';

import {
  IAnnotation,
} from '../../store/data';
import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';
import * as uiActions from 'app/explorer/store/annotations/actions';
import * as actions from '../../store/data/actions'
import {entityFactory, defaultAnnotation} from '../../store/data/initial-state'
@Injectable()
export class AnnotationService {

  private annotatedStreams: number[];

  constructor(
    private http: HttpClient,
    private store: Store,
    private messageService: MessageService
  ) { 
    this.annotatedStreams = [];
  }

  //create a new annotation
  public createAnnotation(annotation: IAnnotation){
    let params = {
      title: annotation.title,
      content: annotation.content,
      start: annotation.start*1e3,
      end: null,
      db_stream_id: annotation.db_stream_id,
    }
    if(annotation.end != null){
      params.end = annotation.end * 1e3
    }
    this.http
      .post(`/db_streams/${annotation.db_stream_id}/annotations.json`, params)
      .subscribe(
      json => {
        let entities = normalize(json['data'], schema.annotations).entities;
        let annotations = entityFactory(entities['annotations'], defaultAnnotation);
        this.store.dispatch(actions.receiveAnnotation({annotations}))
        this.store.dispatch(uiActions.showAnnotation({id: annotations[0].id}))
        
    },
    error => this.messageService.setErrorsFromAPICall(error)
    )
  }

  //save an annotation
  public saveAnnotation(annotation: IAnnotation){
    let params = {
      title: annotation.title,
      content: annotation.content,
    }
    this.http
      .put(`/db_streams/${annotation.db_stream_id}/annotations/${annotation.joule_id}.json`, params)
      .subscribe(
        json => {
          let normalized = normalize(json['data'], schema.annotations)
          let annotations = entityFactory(normalized.entities['annotations'], defaultAnnotation);
          this.store.dispatch(actions.receiveAnnotation({annotations}))        
        },
        error => this.messageService.setErrorsFromAPICall(error)
      );
    
  }


  public loadAnnotations(dbStreamId: number): Observable<any> {
    if(this.annotatedStreams.indexOf(dbStreamId)>-1){
      return;
    }
    let o = this.http
      .get(`db_streams/${dbStreamId}/annotations.json`, {})
      .pipe(share())

    o.subscribe(
      json => {
        let normalized = normalize(json['data'], schema.annotations)
        let annotations = entityFactory(normalized.entities['annotations'], defaultAnnotation);
        this.store.dispatch(actions.receiveAnnotation({annotations}))        
        if(this.annotatedStreams.indexOf(dbStreamId)==-1)
          this.annotatedStreams.push(dbStreamId);
      },
      error => this.messageService.setErrorsFromAPICall(error));
    return o;
  }
  public reloadAnnotations(dbStreamId: number): void{
    let index = this.annotatedStreams.indexOf(dbStreamId);
    if(index > -1){
      this.annotatedStreams.splice(index,1);
    }
    this.store.dispatch(actions.reloadStreamAnnotations({id: dbStreamId}))

    this.loadAnnotations(dbStreamId).subscribe(
      json => {
        this.messageService.setNotice("reloaded annotations")
        this.store.dispatch(actions.refreshedAnnotations({id: dbStreamId}))
      },
      error => {
        this.store.dispatch(actions.refreshedAnnotations({id: dbStreamId}))
      });
  }
  public deleteAnnotation(annotation: IAnnotation): void{
    this.http
      .delete(`/db_streams/${annotation.db_stream_id}/annotations/${annotation.joule_id}.json`, {})
      .subscribe(
      json => {
        this.store.dispatch(actions.removeAnnotation({id: annotation.id}))
        this.messageService.setMessages(json['messages']);
      },
      error => this.messageService.setErrorsFromAPICall(error)
      )
  }
}
