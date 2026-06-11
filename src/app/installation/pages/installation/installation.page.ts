
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Observable, Subscription, combineLatest } from 'rxjs';
import { map, filter, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment'
import {
  NilmService, SessionService,
} from '../../../services';
import {
  InstallationService
} from '../../installation.service';

import {
  INilm
} from '../../../store/data';
import {InstallationSelectors} from '../../installation.selectors';

import { ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-installation',
    templateUrl: './installation.page.html',
    styleUrls: ['./installation.page.css'],
    standalone: false
})
export class InstallationPageComponent implements OnInit {

  @ViewChild('childModal', {static: false}) public childModal: ModalDirective;

  public nilm$: Observable<INilm>
  public role$: Observable<string>
  public helpUrl: string;
  private subs: Subscription[];

  constructor(
    private route: ActivatedRoute,
    private session: SessionService,
    private nilmService: NilmService,
    private installationService: InstallationService,
    private selectors: InstallationSelectors
  ) {
    this.helpUrl = environment.helpUrl;

    this.subs = [];
    this.session.validateToken();
  }

  ngOnInit() {

    this.subs.push(this.route.params.subscribe(params => {
      this.nilmService.loadNilm(params['id']);
      this.installationService.setNilm(+params['id'])
    }));

    this.nilm$ = combineLatest([this.selectors.nilms$, this.route.params]).pipe(
      map(([nilms, params]) => nilms[params['id']]),
      filter(nilm => !(nilm === undefined)));
  }

  ngOnDestroy() {
    while (this.subs.length > 0)
      this.subs.pop().unsubscribe()
  }


  public showChildModal(): void {
    this.childModal.show();
  }

  public hideChildModal(): void {
    this.childModal.hide();
  }

}
