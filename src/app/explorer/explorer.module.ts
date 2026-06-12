import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';

import {
  faExclamationTriangle,
  faExclamationCircle,
  faHeartbeat,
  faLock,
  faCrosshairs,
  faDownload,
  faChartLine,
  faChartBar,
  faLifeRing,
  faDatabase,
  faSpinner,
  faSquare,
  faTimes,
  faCog,
  faClock,
  faCogs,
  faSearch,
  faSyncAlt,
  faCubes,
  faFolder,
  faFolderOpen,
  faChartArea,
  faExchangeAlt,
  faImage,
  faExternalLinkAlt,
  faArrowsAltH,
  faArrowsAltV,
  faArrowRight,
  faCaretRight,
  faCaretDown,
  faCaretUp,
  faCaretLeft,
  faCommentAlt,
  faTrashAlt,
  faFilter,
  faEdit,
  faStarOfLife,
  faCircle,
  faAdjust,
  faBan,
  faAnkh,
  faRulerHorizontal,
  faRulerVertical,
  faGreaterThan,
  faGreaterThanEqual,
  faLessThan,
  faLessThanEqual,
  faEquals,
  faNotEqual,
  faMinus,
  faCheck
} from '@fortawesome/free-solid-svg-icons'
import{
  faCircle as farCircle
} from '@fortawesome/free-regular-svg-icons'

import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {ModalModule} from 'ngx-bootstrap/modal';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {TabsModule } from 'ngx-bootstrap/tabs';
import {  TimepickerModule } from 'ngx-bootstrap/timepicker'
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import {
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';
import { LetDirective } from '@ngrx/component';
import { SharedModule } from '../shared/shared.module';
import { COMPONENTS } from './components';
import { ExplorerPageComponent } from './pages/explorer/explorer.page';
import { SERVICES } from './services';
import { SELECTORS } from './selectors';
import { PIPES } from './pipes';
import { NewAnnotationComponent } from './components/new-annotation/new-annotation.component';
import { FilterPlottedEventsComponent } from './components/filter-plotted-events/filter-plotted-events.component';
import { CdkTreeModule } from '@angular/cdk/tree';
@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LetDirective,
    CdkTreeModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    NgSelectModule,
    SharedModule,
    FontAwesomeModule,
    ModalModule,
    TabsModule,
    TooltipModule,
    BsDropdownModule,
    BsDatepickerModule,
    TimepickerModule
  ],
  declarations: [
    COMPONENTS,
    ExplorerPageComponent,
    PIPES,
    NewAnnotationComponent,
    FilterPlottedEventsComponent,
  ],
  providers: [
    SERVICES,
    SELECTORS,
    DatePipe
  ],
  exports: [
    ExplorerPageComponent
  ]
})
export class ExplorerModule {
  constructor(library: FaIconLibrary){
    library.addIcons(faExclamationTriangle,
      faExclamationCircle,
      faHeartbeat,
      faLock,
      faCrosshairs,
      faDownload,
      faChartLine,
      faChartBar,
      faLifeRing,
      faDatabase,
      faSpinner,
      faSquare,
      faTimes,
      faCog,
      faClock,
      faCogs,
      faSearch,
      faSyncAlt,
      faCubes,
      faFolder,
      faFolderOpen,
      faChartArea,
      faExchangeAlt,
      faImage,
      faExternalLinkAlt,
      faArrowsAltH,
      faArrowsAltV,
      faArrowRight,
      faCaretRight,
      faCaretDown,
      faCaretLeft,
      faCaretUp,
      farCircle,
      faStarOfLife,
      faCommentAlt,
      faTrashAlt,
      faFilter,
      faEdit,
      faTimes,
      faCircle,
      faAdjust,
      faBan,
      faAnkh,
      faRulerHorizontal,
      faRulerVertical,
      faGreaterThan,
      faGreaterThanEqual,
      faLessThan,
      faLessThanEqual,
      faEquals,
      faNotEqual,
      faMinus,
      faCheck);
  }
 }
