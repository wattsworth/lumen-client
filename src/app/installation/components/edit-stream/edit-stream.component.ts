import { Component, Input, OnInit }from '@angular/core';
import { trigger, state, animate, transition, style } from '@angular/animations'; 
import { Observable } from 'rxjs';
/*https://github.com/yuyang041060120/ng2-validation*/
import { CustomValidators } from 'ng2-validation';

import {
  IDbStream,
  IDbElement,
} from '../../../store/data';

import { DbStreamService } from '../../../services';

import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators
} from '@angular/forms';

@Component({
    selector: 'app-edit-stream',
    templateUrl: './edit-stream.component.html',
    animations: [
        trigger('elementsToggled', [
            state('true', style({ height: '*', opacity: 1 })),
            state('false', style({ height: '0px', opacity: 0 })),
            transition('* => *', animate('.5s ease-in'))
        ])
    ],
    styleUrls: ['./edit-stream.component.css'],
    standalone: false
})
export class EditStreamComponent implements OnInit {


  @Input()
  public set dbStream(val: IDbStream) {
    this.stream = val;
    this.buildForm(this.stream, this.elements);
  }
  @Input()
  public set dbElements(val: IDbElement[]) {
    this.elements = val
    this.buildForm(this.stream, this.elements)
  }

  public form: FormGroup;
  public formElementsArray: FormArray;
  public stream: IDbStream;
  public elements: IDbElement[];
  public showElements = true;

  public displayTypeOptions = ['continuous','discrete','event'];

  constructor(
    private fb: FormBuilder,
    private dbStreamService: DbStreamService
  ) { }

  ngOnInit() {}

  onSubmit(streamValues: any){
    this.dbStreamService.updateStream(streamValues);
  }

  public toggleElements() {
    this.showElements = !this.showElements;
  }

  // --- note: form attributes correspond to API parameters ---
  buildForm(stream: IDbStream, elements: IDbElement[]) {
    if (stream == null || elements == null) {
      return;
    }
    this.form = this.fb.group({
      name: [stream.name],
      description: [stream.description],
      id: [stream.id],
      db_elements_attributes: this.fb.array(this._buildElementGroups(elements))
    });
    if(stream.locked)
      this.form.disable()
    this.formElementsArray = <FormArray>this.form.get('db_elements_attributes');
  }

  private _buildElementGroups(dbElements: IDbElement[]) {
    return dbElements
    .sort((a,b) => a.column - b.column)
    .map(element =>
      this.fb.group({
        id: [element.id],
        plottable: [element.plottable],
        display_type: [element.display_type],
        name: [element.name, Validators.required],
        units: [element.units],
        offset: [element.offset, [Validators.required, CustomValidators.number]],
        scale_factor: [element.scale_factor, [Validators.required, CustomValidators.number]],
        default_min: [element.default_min, CustomValidators.number],
        default_max: [element.default_max, CustomValidators.number]
      }));
  }

}
