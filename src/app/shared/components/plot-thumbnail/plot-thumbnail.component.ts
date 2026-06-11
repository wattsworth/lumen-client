import { Component, OnInit, Input } from '@angular/core';
import {IDataView } from '../../../store/data';

@Component({
    selector: 'app-plot-thumbnail',
    templateUrl: './plot-thumbnail.component.html',
    styleUrls: ['./plot-thumbnail.component.css'],
    standalone: false
})
export class PlotThumbnailComponent implements OnInit {
  @Input() view: IDataView

  constructor() { }

  ngOnInit() {
  }

}
