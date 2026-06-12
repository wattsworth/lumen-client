import { Component, OnInit } from '@angular/core';
import { Store, select, createSelector } from '@ngrx/store';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { SessionService } from "../../../services";
/*https://github.com/yuyang041060120/ng2-validation*/
import { CustomValidators } from 'ng2-validation';

import { AccountService } from '../../../account/account.service';
import { AccountSelectors } from '../../../account/account.selectors';
import { global_UI_ } from '../../../selectors';

@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in.page.html',
    styleUrls: ['./sign-in.page.css'],
    standalone: false
})
export class SignInPageComponent implements OnInit {

  public form: FormGroup;
  public slides: ISlide[];

  emailEnabled$ = this.store.pipe(select(createSelector(global_UI_, state=>state.email_enabled)));

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
    private accountService: AccountService,
    public accountSelectors: AccountSelectors,
    private store: Store
  ) {
    
    this.slides = [
      {
        url: "assets/images/slides/Slide1.png",
        name: 'Visualize',
        description: 'view data from decades to microseconds'
      },
      {
        url: "assets/images/slides/Slide3.png",
        name: 'Analyze',
        description: 'export data directly to MATLAB or Excel'
      },
      {
        url: "assets/images/slides/Slide2.png",
        name: 'Collaborate',
        description: 'share data on your terms'
      },
      {
        url: "assets/images/slides/Slide4.png",
        name: 'Visualize',
        description: 'stream realtime sensor data'
      },
      {
        url: "assets/images/slides/Slide5.png",
        name: 'Analyze',
        description: 'quickly identify trends and anamolies'
      },
      {
        url: "assets/images/slides/Slide6.png",
        name: 'Organize',
        description: 'navigate terabytes of data in your browser'
      },
    ]
  }

  ngOnInit() {    
    this.form = this.fb.group({
      email: ['', [Validators.required, CustomValidators.email]],
      password: ['']
    });
  }
  onSubmit(formValues: any) {
    this.accountService.setLoggingIn(true);
    
    this.sessionService.login(formValues.email, 
      formValues.password).subscribe({
        error: () => this.accountService.setLoggingIn(false),
        complete: () => this.accountService.setLoggingIn(false)
      });
  }


  resetPassword(email: string) {
    this.accountService.setLoggingIn(true);

    this.sessionService.resetPassword(email).subscribe({
      error: () => this.accountService.setLoggingIn(false),
      complete: () => this.accountService.setLoggingIn(false)
    });
  }
}

export interface ISlide{
  name: string,
  url: string,
  description: string
}