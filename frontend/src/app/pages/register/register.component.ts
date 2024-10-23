import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-in', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('500ms ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class RegisterComponent {
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  showError: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onRegister() {
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      this.showError = true;
      setTimeout(() => {
        this.showError = false;
      }, 3000);
      return;
    }

    this.errorMessage = '';
    this.showError = false;

    this.authService.register(this.username, this.password).subscribe(
      () => {
        this.goLogin();
      },
      (error) => {
        console.error('Registration failed:', error);
        this.errorMessage = this.getErrorMessage(error);
        this.showError = true;

        setTimeout(() => {
          this.showError = false;
        }, 3000);
      },
    );
  }

  goHome() {
    this.router.navigateByUrl('');
  }

  goLogin() {
    this.router.navigateByUrl('login');
  }

  private getErrorMessage(error: any): string {
    if (error.status === 409) {
      return 'Username Taken';
    } else if (error.status === 0) {
      return 'Unable to connect to the server. Please check your network connection.';
    } else {
      return 'An error occurred during login. Please try again later.';
    }
  }
}
