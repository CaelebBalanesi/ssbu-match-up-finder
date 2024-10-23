import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  constructor(
    private router: Router,
    private auth: AuthService,
  ) {}

  loggedIn = false;
  username = '';

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.loggedIn = true;
      this.username = this.auth.getUsername();
    }
  }

  login() {
    this.router.navigate(['login']);
  }

  register() {
    this.router.navigate(['register']);
  }

  logout() {
    this.auth.logout();
  }

  searchbutton() {
    this.router.navigateByUrl('/search');
  }

  createbutton() {
    this.router.navigateByUrl('/create');
  }
}
