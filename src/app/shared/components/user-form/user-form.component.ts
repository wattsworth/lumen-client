import { 
  Component, 
  EventEmitter,
  OnInit 
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
/*https://github.com/yuyang041060120/ng2-validation*/
import { CustomValidators } from 'ng2-validation';

@Component({
    selector: 'app-user-form',
    outputs: ['save', 'cancel'],
    templateUrl: './user-form.component.html',
    styleUrls: ['./user-form.component.css'],
    standalone: false
})
export class UserFormComponent implements OnInit {

  public form: FormGroup;
  save: EventEmitter<any>;
  cancel: EventEmitter<any>;
  constructor(
    private fb: FormBuilder
  ) { 
     this.save = new EventEmitter();
    this.cancel = new EventEmitter();
  }

  ngOnInit() {
    this.buildForm();
   
  }

  buildForm(){
    this.form = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required,CustomValidators.email]],
      passwords: this.fb.group({
        password: [""],
        password_confirmation: [""],
      },{validator: this.passwordValidator})
    });
  }

  passwordValidator(group: FormGroup){
    const password = group.get('password');
    const confirm = group.get('password_confirmation');
    if(password.value === confirm.value){
      return null; //ok
    }
    return {
      areEqual: false
    }
  }

  onCancel() {
    this.cancel.emit();
  }
  onSave(formValues: any) {
    const userParams = {
      first_name: formValues.first_name,
      last_name: formValues.last_name,
      email: formValues.email,
      password: formValues.passwords.password,
      password_confirmation: formValues.passwords.password_confirmation
    }

    this.save.emit(userParams);
  }

}
