// home.component.ts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';
import { LobbyService } from '../../lobby.service';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../users.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MediaMatcher } from '@angular/cdk/layout';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
  ],
})
export class HomeComponent implements OnInit {
  authenticated$: Observable<boolean>;
  user$: Observable<User | null>;
  avatarUrl: string | null = null;
  username: string | null = null;
  id: string | null = null;
  loggedIn: boolean = false;
  amountOfLobbies: number = -1;
  amountInterval: any;
  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;

  constructor(
    private authService: AuthService,
    private router: Router,
    private lobbiesService: LobbyService,
    private changeDetectorRef: ChangeDetectorRef,
    private media: MediaMatcher,
  ) {
    this.authenticated$ = this.authService.isAuthenticated();
    this.user$ = this.authService.getUserInfo();
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => this.changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit(): void {
    this.authService.checkAuthStatus().subscribe((status) => {
      if (status.authenticated && status.user) {
        this.avatarUrl = `https://cdn.discordapp.com/avatars/${status.user.id}/${status.user.avatar}.png`;
        this.username = `${status.user.username}`;
        this.id = status.user.id;
        this.loggedIn = true;
      } else {
        this.avatarUrl = null;
        this.username = null;
        this.id = null;
        this.loggedIn = false;
      }
    });

    this.getAmountOfLobbies();
    this.amountInterval = setInterval(() => {
      this.getAmountOfLobbies();
    }, 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.amountInterval);
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  getAmountOfLobbies() {
    this.lobbiesService.amountOfLobbies().subscribe((amount) => {
      console.log(amount);
      this.amountOfLobbies = amount.amount;
    });
  }

  logout() {
    this.authService.logout();
    this.avatarUrl = null;
    this.username = null;
    this.id = null;
    this.loggedIn = false;
  }

  login() {
    this.authService.login();
  }

  searchbutton() {
    this.router.navigateByUrl('/search');
  }

  createbutton() {
    this.router.navigateByUrl('/create');
  }

  profile() {
    this.router.navigateByUrl('/profile');
  }

  navigateTo(route: string) {
    this.router.navigateByUrl(`/${route}`);
  }
}
