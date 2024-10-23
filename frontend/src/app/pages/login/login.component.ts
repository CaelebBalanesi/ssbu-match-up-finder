// login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { trigger, style, transition, animate } from '@angular/animations';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
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
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  showError: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onLogin() {
    this.errorMessage = '';
    this.showError = false;
    this.authService.login(this.username, this.password).subscribe(
      () => {
        this.router.navigate(['']);
      },
      (error) => {
        console.error('Login failed', error);
        this.errorMessage = this.getErrorMessage(error);
        this.showError = true;

        // Automatically hide the error message after 5 seconds
        setTimeout(() => {
          this.showError = false;
        }, 3000);
      },
    );
  }

  private getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Invalid username or password.';
    } else if (error.status === 0) {
      return 'Unable to connect to the server. Please check your network connection.';
    } else {
      return 'An error occurred during login. Please try again later.';
    }
  }

  goHome() {
    this.router.navigateByUrl('');
  }

  goRegister() {
    this.router.navigateByUrl('register');
  }
}
