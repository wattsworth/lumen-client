import {
  Component,
  Input,
  OnInit,
  EventEmitter
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import {
  IUserGroup,
} from '../../../store/data';

@Component({
    selector: 'account-group-form',
    outputs: ['save', 'cancel'],
    templateUrl: './group-form.component.html',
    styleUrls: ['./group-form.component.css'],
    standalone: false
})
export class GroupFormComponent implements OnInit {
  @Input() group: IUserGroup;
  save: EventEmitter<any>;
  cancel: EventEmitter<any>;

  public form: FormGroup;

  constructor(
    private fb: FormBuilder,
  ) {
    this.save = new EventEmitter();
    this.cancel = new EventEmitter();
  }

  onCancel() {
    this.cancel.emit();
    this.resetForm();
  }
  onSave() {
    this.save.emit(this.form.value);
    //no need to reset because these values are now the actual group values
    //this.resetForm();
  }

  resetForm() {
    if (this.group === undefined)
      this.form.reset();
    else {
      this.form.setValue({
        name: this.group.name,
        description: this.group.description
      })
    }
  }
  ngOnInit() {
    let name = ''
    let description = ''
    //initialize values to group if present
    if (this.group !== undefined) {
      name = this.group.name;
      description = this.group.description;
    }
    //create the form
    this.form = this.fb.group({
      name: [name, Validators.required],
      description: [description]
    });
  }



}
