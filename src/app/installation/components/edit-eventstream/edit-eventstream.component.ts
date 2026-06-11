import { Component, Input, OnInit } from '@angular/core';
import { IEventStream } from '../../../store/data';

@Component({
    selector: 'app-edit-eventstream',
    templateUrl: './edit-eventstream.component.html',
    styleUrls: ['./edit-eventstream.component.css'],
    standalone: false
})
export class EditEventstreamComponent implements OnInit {

  @Input() eventStream: IEventStream;
  
  constructor() { }

  ngOnInit(): void {
  }

}
