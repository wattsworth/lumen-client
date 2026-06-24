import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { share } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { normalize } from 'normalizr';
import * as schema from '../../api';
import { MessageService } from '../message.service';
import { entityFactory, 
  defaultDbFolder, 
  defaultDbStream, 
  defaultDbElement, 
  defaultEventStream} from '../../store/data/initial-state'
import { IDbFolder } from '../../store/data';
import * as actions from '../../store/data/actions';
import { Observable } from 'rxjs';

@Injectable()
export class DbFolderService {


  constructor(
    private http: HttpClient,
    private store: Store,
    private messageService: MessageService
  ) { }


  public loadFolder(dbFolderId: number): Observable<any> {
    let o = this.http
      .get(`db_folders/${dbFolderId}.json`, {})
      .pipe(share());
    o.subscribe({
      next: (json) => this._dispatch(json),
      error: (error) => this.messageService.setErrorsFromAPICall(error)
    });
    
      return o; //for other subscribers
  }

  public updateFolder(dbFolder: IDbFolder): void {
    this.http
      .put<schema.IApiResponse>(`db_folders/${dbFolder.id}.json`, dbFolder)
      .subscribe({
        next: (json) => {
          this._dispatch(json.data);
          this.messageService.setMessages(json.messages);
        },
        error: (error) => this.messageService.setErrorsFromAPICall(error)
      });  
  }

  // -------- private helper functions --------
  private _dispatch(json: any) {
    let entities = normalize(json, schema.dbFolder).entities;
    let folders = entityFactory(entities['dbFolders'], defaultDbFolder);
    this.store.dispatch(actions.receiveDbFolder({folders}));
    let eventStreams = entityFactory(entities['eventStreams'], defaultEventStream);
    this.store.dispatch(actions.receiveEventStream({streams: eventStreams}))
    let streams = entityFactory(entities['dbStreams'], defaultDbStream);
    this.store.dispatch(actions.receiveDbStream({streams}));
    let elements = entityFactory(entities['dbElements'], defaultDbElement);
    this.store.dispatch(actions.receiveDbElement({elements}));
  }
}
