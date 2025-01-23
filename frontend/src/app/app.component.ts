import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Observable } from 'rxjs';
import { User } from './users.service';
import { MediaMatcher } from '@angular/cdk/layout';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatBadgeModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
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
  notificaions: any = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private media: MediaMatcher,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    this.authenticated$ = this.auth.isAuthenticated();
    this.user$ = this.auth.getUserInfo();
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => this.changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit(): void {
    this.auth.checkAuthStatus().subscribe((status) => {
      if (status.authenticated && status.user) {
        this.avatarUrl = `https://cdn.discordapp.com/avatars/${status.user.id}/${status.user.avatar}.png`;
        this.username = `${status.user.username}`;
        this.id = status.user.id;
        this.loggedIn = true;
        if (status.user.mainCharacter == null) {
          this.notificaions = '1';
        }
      } else {
        this.avatarUrl = null;
        this.username = null;
        this.id = null;
        this.loggedIn = false;
      }
    });
  }

  logout() {
    this.auth.logout();
    this.avatarUrl = null;
    this.username = null;
    this.id = null;
    this.loggedIn = false;
  }

  login() {
    this.auth.login();
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
