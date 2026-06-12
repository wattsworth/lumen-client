import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {CarouselModule} from 'ngx-bootstrap/carousel'
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {ModalModule} from 'ngx-bootstrap/modal';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {PopoverModule} from 'ngx-bootstrap/popover';

import { NgSelectModule } from '@ng-select/ng-select';
import {
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faSpinner,
  faLifeRing,
  faHome,
  faEdit,
  faTimes,
  faBars,
  faCog,
  faCircle,
  faPlus,
  faEye,
  faUser,
  faUserShield
} from '@fortawesome/free-solid-svg-icons'

import { AccountSelectors } from './account.selectors';
import { AccountService } from './account.service';

import { SharedModule } from '../shared/shared.module';
import { PAGES } from './pages';
import { COMPONENTS } from './components';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgSelectModule,
    SharedModule,
    FontAwesomeModule,
    PopoverModule,
    BsDropdownModule,
    ModalModule,
    TooltipModule,
    CarouselModule
  ],
  declarations: [
    COMPONENTS,
    PAGES,
  ],
  providers: [
    AccountService,
    AccountSelectors
  ],
  exports: [
    PAGES
  ]
})
export class AccountModule {
  constructor(library: FaIconLibrary){
    library.addIcons(faSpinner,
      faLifeRing,
      faHome,
      faEdit,
      faTimes,
      faBars,
      faCog,
      faCircle,
      faPlus,
      faEye,
      faUser,
      faUserShield);
  }
 }
