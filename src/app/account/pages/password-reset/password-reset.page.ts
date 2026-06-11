import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'

import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
/*https://github.com/yuyang041060120/ng2-validation*/
import { CustomValidators } from 'ng2-validation';

import {
  SessionService
} from '../../../services';

@Component({
    selector: 'app-password-reset',
    templateUrl: './password-reset.page.html',
    styleUrls: ['./password-reset.page.css'],
    standalone: false
})
export class PasswordResetPageComponent implements OnInit {

  public form: FormGroup;
  private resetPasswordToken: string;

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
    private route: ActivatedRoute
  ) {
    route.queryParams.subscribe(params => {
      this.resetPasswordToken = 
        params['access-token']
    });
   }

  ngOnInit() {
    this.form = this.fb.group({
      password: ["", Validators.required],
      password_confirmation: [""],
      },{validator: this.passwordValidator});
  }

  onSubmit(formValues: any){
    this.sessionService.updatePassword(
      formValues.password,
      formValues.password_confirmation,
    );

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
}
