import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-auth-success',
  standalone: true,
  imports: [],
  templateUrl: './auth-success.component.html',
  styleUrl: './auth-success.component.scss',
})
export class AuthSuccessComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    // Check authentication status and navigate accordingly
    this.auth.checkAuthStatus().subscribe(
      (status) => {
        if (status.authenticated) {
          // Authentication successful, navigate to the desired page
          this.router.navigate(['/']);
        } else {
          // Authentication failed, navigate to login or show error
          this.router.navigate(['/login']);
        }
      },
      (error) => {
        console.error('Error checking authentication status:', error);
        // Handle error, possibly navigate to an error page
        this.router.navigate(['/login']);
      },
    );
  }
}
