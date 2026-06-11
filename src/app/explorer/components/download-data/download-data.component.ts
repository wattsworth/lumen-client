
import {combineLatest} from 'rxjs/operators';
import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import moment from 'moment';

import { IDbStream } from '../../../store/data';
import { 
  DataService,
  MessageService
} from '../../../services';
import { IRange } from '../../store';
import { PlotSelectors } from '../../selectors/plot.selectors';

@Component({
    selector: 'app-download-data',
    templateUrl: './download-data.component.html',
    styleUrls: ['./download-data.component.css'],
    standalone: false
})
export class DownloadDataComponent implements OnInit {

  @Input() range: IRange;
  @ViewChild('link', {static: false}) link: ElementRef

  public downloadInfo$: Observable<IDownloadInfo[]>
  public resolution: number;

  constructor(
    public plotSelectors: PlotSelectors,
    public messageService: MessageService,
    public dataService: DataService
  ) {
    
   }

  ngOnInit() {
    this.resolution = null;
    this.downloadInfo$ = this.plotSelectors
      .plottedStreams$.pipe(combineLatest(this.plotSelectors.nilms$))
      .pipe(map(([streams,nilms])=>{
        return streams
        .filter(stream => nilms[stream.nilm_id]!==undefined)
        .map(stream => {
          return {
            stream: stream,
            installation_name: nilms[stream.nilm_id].name,
            installation_url: nilms[stream.nilm_id].url
          }
        })
      }));
  }
  setResolution(value: number){
    this.resolution = value;
  }

  download(stream: IDbStream){
    this.dataService.downloadStream(
      this.range.min, this.range.max, this.resolution, stream)
      .subscribe(
      file => {
        //create the file name based on the time ranges
        // eg 06JUN2017_1200_to_06JUN2017_1400
        //
        let start = moment(this.range.min).format('HHmm_DDMMMYYYY');
        let end = moment(this.range.max).format('HHmm_DDMMMYYYY');
        this.link.nativeElement.download = `${start}__to__${end}.txt`;
        this.link.nativeElement.href = file;
        this.link.nativeElement.click();
      },
      error => this.messageService.setErrors(["error downloading data"]));
  }

  
}
interface IDownloadInfo{
    stream: IDbStream,
    installation_name: string,
    installation_url: string

  }