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
  faCommentAlt,
  faTrashAlt,
  faFilter,
  faEdit,
} from '@fortawesome/free-solid-svg-icons'

import {
  TooltipModule,
  TabsModule,
  ModalModule,
  BsDropdownModule,
  TimepickerModule,
} from 'ngx-bootstrap';
import {
  BsDatepickerModule,
} from 'ngx-bootstrap/datepicker';

import {
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';

import { SharedModule } from '../shared/shared.module';
import { COMPONENTS } from './components';
import { ExplorerPageComponent } from './pages/explorer/explorer.page';
import { SERVICES } from './services';
import { SELECTORS } from './selectors';
import { TreeModule } from 'angular-tree-component';
import { PIPES } from './pipes';
import { NewAnnotationComponent } from './components/new-annotation/new-annotation.component';

@NgModule({
  imports: [
    CommonModule,
    TreeModule.forRoot(),
    RouterModule,
    FormsModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgOptionHighlightModule,
    SharedModule,
    FontAwesomeModule,
    ModalModule.forRoot(),
    TabsModule.forRoot(),
    TooltipModule.forRoot(),
    BsDropdownModule.forRoot(),
    BsDatepickerModule.forRoot(),
    TimepickerModule.forRoot()
  ],
  declarations: [
    COMPONENTS,
    ExplorerPageComponent,
    PIPES,
    NewAnnotationComponent,
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
      faCommentAlt,
      faTrashAlt,
      faFilter,
      faEdit);
  }
 }
