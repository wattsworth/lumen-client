
import {combineLatest, map, filter} from 'rxjs/operators';
import {
  Component,
  Input,
  ViewChild,
  OnInit,
  OnChanges,
  ElementRef,
  AfterViewInit,
  SimpleChanges
} from '@angular/core';
import { Subject, Observable, Subscription } from 'rxjs';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { DbElementService } from '../../../services';
import { IDbElement } from '../../../store/data';
import { PlotService } from '../../services/plot.service';
import { PlotSelectors } from '../../selectors/plot.selectors';

declare var $: any;

@Component({
    selector: 'app-plotted-elements',
    templateUrl: './plotted-elements.component.html',
    styleUrls: ['./plotted-elements.component.css'],
    standalone: false
})
export class PlottedElementsComponent
  implements OnInit, OnChanges, AfterViewInit {
  @Input() element: IDbElement;
  @Input() axis: string;

  @ViewChild('elementModal', {static: false}) public elementModal: ModalDirective;
  @ViewChild('colorPicker', {static: false}) colorPicker: ElementRef

  public displayName: string;
  public toolTipText$: Observable<string>;
  public elementInfo$: Observable<IElementInfo>;

  //--state for customization modal--
  public newColor: string;
  public newAxis: string;
  public newName: string;
  public axisMessage: string;
  public axisOptions = [
    { value: 'left', label: 'left side' },
    { value: 'right', label: 'right side' }];
  //----------------------------------

  constructor(
    private plotService: PlotService,
    private dbElementService: DbElementService,
    private plotSelectors: PlotSelectors
  ) {
    this.newColor = "";
  }

  ngOnInit() {
    this.newColor = this.element.color;

    //create tooltip text as [stream_name] @ [installation_name]
    //
    this.toolTipText$ = this.plotSelectors.streams$.pipe(
      combineLatest(this.plotSelectors.nilms$),
      map(([streams, nilms]) => {
        if (streams[this.element.db_stream_id] === undefined)
          return '<unknown>'
        let myStream = streams[this.element.db_stream_id]
        if (nilms[myStream.nilm_id] === undefined)
          return null;
        let myNilm = nilms[myStream.nilm_id]
        return `${myStream.path} @ ${myNilm.name}`
      }))

    //element info 
    //
    this.elementInfo$ = this.plotSelectors.streams$.pipe(
      combineLatest(this.plotSelectors.nilms$),
      map(([streams, nilms]) => {
        let missing_info = {
          stream_name: "unknown",
          installation_name: "unknown",
          path: "unknown",
          installation_url: "unkown"
        };
        if (streams[this.element.db_stream_id] === undefined)
          return missing_info;
        let myStream = streams[this.element.db_stream_id]
        if (nilms[myStream.nilm_id] === undefined)
          return missing_info;
        let myNilm = nilms[myStream.nilm_id]
        return {
          stream_name: myStream.name,
          installation_name: myNilm.name,
          path: myStream.path,
          installation_url: myNilm.url
        }
      }),
      filter(info => info!=null))

  }
  ngOnChanges(changes: SimpleChanges) {
    if (this.element.display_name != "") {
      this.displayName = this.element.display_name;
    } else {
      this.displayName = this.element.name;
    }
  }
  // X button on the element display
  hideElement() {
    this.plotService.hideElement(this.element);
  }

  // ---- code to handle element customization modal ----
  //
  ngAfterViewInit() {
    //configure jQuery minicolor
    $(this.colorPicker.nativeElement).minicolors({
      theme: 'bootstrap',
      letterCase: 'uppercase',
      changeDelay: 100,
      change: (value: string, opacity: any) => { this.newColor = value }
    });
  }
  showModal() {
    //reset modal properties
    this.newColor = this.element.color;
    $(this.colorPicker.nativeElement).minicolors('value',
      { color: this.element.color, opacity: 1.0 })
    this.newName = this.element.display_name;
    this.newAxis = this.axis;
    this.axisMessage = "";
    this.elementModal.show();
  }
  // modify the element if the user clicks 'save'
  onSave() {
    //check if the axis changed
    if (this.axis != this.newAxis) {
      this.plotService.setElementAxis(this.element, this.newAxis);
    }
    //check if the color changed
    if (this.newColor != null && this.newColor != "" &&
      this.newColor != this.element.color)
      this.dbElementService.setColor(this.element, this.newColor);
    //check if the display name changed
    if (this.element.display_name != this.newName)
      this.dbElementService.setDisplayName(this.element, this.newName);
    //changes succesfully processed, close the modal
    this.elementModal.hide();
  }
}

export interface IElementInfo {
  stream_name: string,
  installation_name: string,
  path: string,
  installation_url: string
}
