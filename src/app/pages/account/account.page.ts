import { Component, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select } from 'ng2-redux';

import {
  SessionService
} from '../../services';

import{
  IUserRecord,
  IUserStoreRecord
} from '../../store';

import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
/*https://github.com/yuyang041060120/ng2-validation*/
import { CustomValidators } from 'ng2-validation';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.css']
})
export class AccountPageComponent implements OnInit {

  @select(['data','users']) users$: Observable<IUserStoreRecord>
  public form: FormGroup;
  private sub: Subscription;

  constructor(
     private fb: FormBuilder,
     private sessionService: SessionService
  ) { }

  ngOnInit() {
    this.sub = this.users$.subscribe(
      users =>{
        if(users.current!=null && 
           users.entities[users.current]!==undefined){
          this.buildForm(users.entities[users.current]);
        }
      }); 
  }
  ngOnDestroy(){
    this.sub.unsubscribe();
  }

  buildForm(user: IUserRecord) {
    this.form = this.fb.group({
      first_name: [user.first_name, Validators.required],
      last_name: [user.last_name, Validators.required],
      email: [user.email, [Validators.required,CustomValidators.email]],
      passwords: this.fb.group({
        password: [""],
        password_confirmation: [""],
      },{validator: this.passwordValidator}),
      current_password: ["",Validators.required]
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
  onSubmit(formValues: any){
    const userParams = {
      first_name: formValues.first_name,
      last_name: formValues.last_name,
      current_password: formValues.current_password,
      password: formValues.passwords.password,
      password_confirmation: formValues.passwords.password_confirmation
    }
    console.log(userParams);
    this.sessionService.updateAccount(userParams);
  }

}
