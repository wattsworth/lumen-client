import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { IDataApp } from '../../../store/data';


@Component({
    selector: 'app-edit-module',
    templateUrl: './edit-module.component.html',
    styleUrls: ['./edit-module.component.css'],
    standalone: false
})
export class EditModuleComponent implements OnInit {

  @Input()
  public set dataApp(val: IDataApp) {
    this.app = val;
    this.buildForm(this.app);
  }

  public form: FormGroup;
  public app: IDataApp;
  public errors: string[];
  public warnings: string[];
  public notices: string[];

  constructor(
    private fb: FormBuilder,
  ) { }

  ngOnInit() {
  }

  buildForm(module: IDataApp) {
    this.form = this.fb.group({
      name: ['test'],
      description: ['description'],
    });
    /* TODO: enable this, right now the enable doesn't always work
    if(folder.locked){
      this.form.disable();
    } else {
      this.form.enable();
    } */
  }

}
