import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { IEventStream, IEventStreamFilterGroup, IEventStreamFilterGroups } from '../../../store/data';
import { EventStreamService } from '../../../services';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { filter } from 'lodash';
import * as _ from 'lodash-es';

@Component({
    selector: 'app-filter-plotted-events',
    templateUrl: './filter-plotted-events.component.html',
    styleUrls: ['./filter-plotted-events.component.css'],
    standalone: false
})
export class FilterPlottedEventsComponent implements OnInit {
  @Input() eventStream: IEventStream;
  @Output() changeEventFilter = new EventEmitter;
  filterGroupsForm: FormArray<FormArray<FormGroup>>;

  public showErrorMsg = false;
  private filter_template;

  constructor(
    private eventService: EventStreamService,
    private fb: FormBuilder
  ) { 
    this.filter_template = {
      key: ['', {validators: Validators.required, updateOn: 'change'}],
      comparison: ['', [Validators.required]],
      value: ['', {validators: Validators.required, updateOn: 'change'}]
    }
  }

  ngOnInit(): void {
    this.filterGroupsForm = this.eventStream.filter_groups
      .reduce((groups: FormArray, group)=>{
        groups.push(group.reduce((clauses, clause)=>{
          clauses.push(this.fb.group(clause, { validators: this.valueTypeValidator }))
          return clauses
        }, this.fb.array([] as FormGroup [])))
        return groups
      }, this.fb.array([]))
  }

  addClause(group_index: number){
    let filterGroup = <FormArray> this.filterGroupsForm.controls[group_index]
    filterGroup.push(this.fb.group(this.filter_template, { validators: this.valueTypeValidator }))
  }
  removeClause(group_index: number, filter_index: number){
    let filterGroup = <FormArray> this.filterGroupsForm.controls[group_index]
    filterGroup.removeAt(filter_index);
    if(filterGroup.length==0){
      this.filterGroupsForm.removeAt(group_index);
    }
  }
  addGroup(){
    this.filterGroupsForm.push(this.fb.array([] as FormGroup[]));
    this.addClause(this.filterGroupsForm.length-1);
  }
  removeGroup(group_index: number){
    this.filterGroupsForm.removeAt(group_index);
  }

  isValid(){
    this.filterGroupsForm.markAllAsTouched();
    this.showErrorMsg = !this.filterGroupsForm.valid;
    return this.filterGroupsForm.valid;
  }
  getFilter(){
    return this.filterGroupsForm.value;
  }

  /** only is/not like/unlike comparisons can have non-numeric values */
  valueTypeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const comparison = control.get('comparison').value;
    const value = control.get('value').value;
    if (['eq','neq','gt','gte','lt','lte'].includes(comparison)){
      if(isNaN(value))
        return {valueError: true}
      else
        return null;
    }
    return null;
  };

}
