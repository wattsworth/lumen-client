import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
/*https://github.com/yuyang041060120/ng2-validation*/
import { CustomValidators } from 'ng2-validation';

import { SessionService } from '../../../services'
import { IUser } from '../../../store/data';
import { AccountSelectors } from '../../account.selectors';

@Component({
    selector: 'app-user-info',
    templateUrl: './user-info.component.html',
    styleUrls: ['./user-info.component.css'],
    standalone: false
})
export class UserInfoComponent implements OnInit, OnDestroy {


  public form: FormGroup;
  public passwords: FormGroup;
  private sub: Subscription;

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
    private accountSelectors: AccountSelectors
  ) { }

  ngOnInit() {
    this.sub = this.accountSelectors.users$.subscribe(
      users => {
        if (users != null &&
          users.entities[users.current] !== undefined) {
          this.buildForm(users.entities[users.current]);
        }
      });
  }
  ngOnDestroy() {
    this.sub.unsubscribe();
  }
  buildForm(user: IUser) {
    this.passwords =  this.fb.group({
      password: [""],
      password_confirmation: [""],
    }, { validators: this.passwordValidator })
    this.form = this.fb.group({
      first_name: [user.first_name, Validators.required],
      last_name: [user.last_name, Validators.required],
      email: [user.email, [Validators.required, CustomValidators.email]],
      passwords: this.passwords,
      current_password: ["", Validators.required]
    });
    
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('password_confirmation');
    if (password.value === confirm.value) {
      return null; //ok
    }
    return ({
      areEqual: false
    })
  }
  onSubmit(formValues: any) {
    const userParams = {
      first_name: formValues.first_name,
      last_name: formValues.last_name,
      current_password: formValues.current_password,
      email: formValues.email,
      password: formValues.passwords.password,
      password_confirmation: formValues.passwords.password_confirmation
    }
    this.sessionService.updateAccount(userParams);
  }

}
