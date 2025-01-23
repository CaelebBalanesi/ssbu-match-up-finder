import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { UsersService, User } from '../../users.service';
import { CommonModule } from '@angular/common';
import { characters_data, CharacterNameImage } from '../../character';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatButtonModule,
    MatToolbarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    CommonModule,
    MatCardModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  authenticated$: Observable<boolean>;
  user$: Observable<User | null>;
  avatarUrl: string | null = null;
  username: string | null = null;
  id: string | null = null;
  loggedIn: boolean = false;
  mainCharacter: string | null = null;
  mainSet: boolean = true;

  characters: CharacterNameImage[] = characters_data;

  constructor(
    private authService: AuthService,
    private router: Router,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
  ) {
    this.authenticated$ = this.authService.isAuthenticated();
    this.user$ = this.authService.getUserInfo();
  }

  ngOnInit(): void {
    this.authService.checkAuthStatus().subscribe((status) => {
      if (status.authenticated && status.user) {
        this.avatarUrl = `https://cdn.discordapp.com/avatars/${status.user.id}/${status.user.avatar}.png`;
        this.username = `${status.user.username}`;
        this.id = status.user.id;
        this.loggedIn = true;
        if (status.user.mainCharacter == null) {
          this.mainSet = false;
        } else {
          this.mainCharacter = status.user.mainCharacter;
        }
      } else {
        this.avatarUrl = null;
        this.username = null;
        this.id = null;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.avatarUrl = null;
    this.username = null;
    this.id = null;
    this.loggedIn = false;
  }

  goHome() {
    this.router.navigateByUrl('');
  }

  updateMainCharacter() {
    if (this.id && this.mainCharacter) {
      this.usersService
        .updateMainCharacter(this.id, this.mainCharacter)
        .subscribe(
          () => {
            this.snackBar.open(
              'Main character updated successfully!',
              'Close',
              {
                duration: 3000,
              },
            );
          },
          (error) => {
            console.error('Failed to update main character:', error);
            this.snackBar.open('Failed to update main character.', 'Close', {
              duration: 3000,
            });
          },
        );
    }
  }
}
