import { Component, OnInit } from '@angular/core';
import { 
  Router,
  ActivatedRoute
} from '@angular/router';

import { UserService } from '../../../services';

@Component({
    selector: 'app-accept-invitation',
    templateUrl: './accept-invitation.page.html',
    styleUrls: ['./accept-invitation.page.css'],
    standalone: false
})
export class AcceptInvitationPageComponent implements OnInit {

  private token: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) {
    this.route.queryParams.subscribe(
      params => {
        this.token = params['invitation_token']}
    )
   }

  ngOnInit() {
  }

  acceptInvitation(values: any){
    let token = 
    this.userService.acceptInvitation(values, this.token)
  }
  cancel(){
    this.router.navigate(['/'])
  }

}
