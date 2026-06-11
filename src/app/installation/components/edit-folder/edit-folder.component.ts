import { Component, Input, OnInit } from '@angular/core';
import { IDbFolder } from '../../../store/data';

import { DbFolderService } from '../../../services';

import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

@Component({
    selector: 'app-edit-folder',
    templateUrl: './edit-folder.component.html',
    styleUrls: ['./edit-folder.component.css'],
    standalone: false
})
export class EditFolderComponent implements OnInit {
  
  @Input()
  public set dbFolder(val: IDbFolder) {
    this.buildForm(val);
    this.folder = val;
  }

  public form: FormGroup;
  public folder: IDbFolder;
  public errors: string[];
  public warnings: string[];
  public notices: string[];

  constructor(
    private fb: FormBuilder,
    private dbFolderService: DbFolderService
  ) { }

  ngOnInit() {}

  onSubmit(formValues: IDbFolder) {
    formValues.id = this.folder.id;
    this.dbFolderService.updateFolder(formValues);
  }

  buildForm(folder: IDbFolder) {
    this.form = this.fb.group({
      name: [folder.name, Validators.required],
      description: [folder.description],
      hidden: [folder.hidden]
    });
    /* TODO: enable this, right now the enable doesn't always work
    if(folder.locked){
      this.form.disable();
    } else {
      this.form.enable();
    } */
  }
}
