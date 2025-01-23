// create.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { LobbyService, Lobby } from '../../lobby.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CharacterNameImage, characters_data } from '../../character';
import { AuthService } from '../../auth.service';
import { Observable, Subscription } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';

interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email: string;
  mfa_enabled: boolean;
}

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    FormsModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
  ],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit, OnDestroy {
  lobby: Lobby = {
    id: '',
    host_username: '',
    smash_lobby_id: '',
    smash_lobby_password: '',
    host_character: characters_data[0],
    seeking_characters: [],
    created_time: new Date().toISOString(),
    full: false,
  };

  seekingCharacter!: CharacterNameImage;
  characterList: CharacterNameImage[] = characters_data;
  selectedCharacterIndex: number = 0;
  seekingCharacterIndex: number = 0;
  loading: boolean = false;
  private authSubscription!: Subscription;
  authenticated$: Observable<boolean>;
  user$: Observable<User | null>;
  avatarUrl: string | null = null;
  username: string | null = null;
  id: string | null = null;
  mainSet: boolean = true;

  constructor(
    private lobbyService: LobbyService,
    private router: Router,
    private auth: AuthService,
  ) {
    this.authenticated$ = this.auth.isAuthenticated();
    this.user$ = this.auth.getUserInfo();
  }

  ngOnInit(): void {
    this.auth.checkAuthStatus().subscribe((status) => {
      if (status.authenticated && status.user) {
        this.avatarUrl = `https://cdn.discordapp.com/avatars/${status.user.id}/${status.user.avatar}.png`;
        this.username = `${status.user.username}`;
        this.lobby.host_username = this.username;
        this.id = status.user.id;
        if (status.user.mainCharacter == null) {
          this.mainSet = false;
        } else {
          let userChar = characters_data.find(
            (character) => character.name === status.user.mainCharacter,
          );
          if (userChar) {
            this.lobby.host_character = userChar;
          }
        }
      } else {
        this.avatarUrl = null;
        this.username = null;
        this.id = null;
      }
    });
    this.seekingCharacter = this.characterList[this.seekingCharacterIndex];
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  onAddSeekingCharacter() {
    const characterToAdd = this.characterList[this.seekingCharacterIndex];
    if (
      !this.lobby.seeking_characters.some(
        (character) => character.name === characterToAdd.name,
      )
    ) {
      this.lobby.seeking_characters.push(characterToAdd);
    }
  }

  removeSeekingCharacter(index: number) {
    this.lobby.seeking_characters.splice(index, 1);
  }

  onSubmit() {
    if (this.username) {
      this.lobby.host_username = this.username;
    }
    if (
      this.lobby.host_character &&
      this.lobby.smash_lobby_id &&
      this.lobby.smash_lobby_password &&
      this.lobby.host_username
    ) {
      this.loading = true;
      console.log(this.lobby);
      this.lobbyService.createLobby(this.lobby).subscribe(
        (value) => {
          this.loading = false;
          this.router.navigate([`/lobby/${value.id}`]);
        },
        (error) => {
          console.error('Failed to create lobby:', error);
          this.loading = false;
        },
      );
    }
  }

  logout() {
    this.auth.logout();
  }

  goHome() {
    this.router.navigateByUrl('');
  }

  goToProfile() {
    this.router.navigateByUrl('/profile');
  }
}
