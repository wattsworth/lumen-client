import {
  Component,
  Input,
  Output,
  OnInit,
  EventEmitter
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { combineLatest, Observable } from 'rxjs';
import { map} from 'rxjs/operators';


import {
  IAnnotation, IDbStream,
} from '../../../store/data';
import { IRange } from '../../../explorer/store';
import { PlotSelectors } from '../../../explorer/selectors';

@Component({
    selector: 'app-new-annotation',
    templateUrl: './new-annotation.component.html',
    styleUrls: ['./new-annotation.component.css'],
    standalone: false
})
export class NewAnnotationComponent implements OnInit {

  @Input() range: IRange;
  @Output() save: EventEmitter<any>;
  @Output() cancel: EventEmitter<any>;

  public form: FormGroup;
  public streamList$: Observable<IStreamInfo[]>

  constructor(
    private fb: FormBuilder,
    private plotSelectors: PlotSelectors
  ) {
    this.save = new EventEmitter();
    this.cancel = new EventEmitter();
  }

  onCancel() {
    this.cancel.emit();
    this.form.reset();
  }
  onSave() {
    let annotation: IAnnotation = {
      id: null,
      joule_id: null,
      start: this.range.min,
      end: this.range.max,
      title: this.form.value.title,
      content: this.form.value.content,
      db_stream_id: this.form.value.db_stream_id
    }
    this.save.emit(annotation);
    this.form.reset();

    //no need to reset because these values are now the actual group values
    //this.resetForm();
  }

  ngOnInit() {
    
    //create the form
    this.form = this.fb.group({
      title: ['', Validators.required],
      content: [''],
      db_stream_id: [null, Validators.required]
    });

    this.streamList$ = combineLatest(
      [this.plotSelectors.plottedStreams$,
      this.plotSelectors.nilms$])
      .pipe(map(([streams,nilms])=>{
        return streams
        .filter(stream => nilms[stream.nilm_id]!==undefined)
        .map(stream => {
          return {
            stream: stream,
            installation_name: nilms[stream.nilm_id].name,
            installation_id: nilms[stream.nilm_id].id,
            installation_role: nilms[stream.nilm_id].role
          }
        })
        //only allow annotations for streams on nodes with 'admin' or 'owner' roles
        .filter(info => info.installation_role=='admin' || info.installation_role=='owner')
      }));
  }
}
interface IStreamInfo{
  stream: IDbStream,
  installation_name: string,
  installation_id: number,
  installation_role: string
}
