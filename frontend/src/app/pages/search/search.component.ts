import { Component, OnInit, OnDestroy } from '@angular/core';
import { LobbyService, Lobby } from '../../lobby.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CharacterNameImage, characters_data } from '../../character';
import { AuthService } from '../../auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { Observable, Subscription } from 'rxjs';
import { User } from '../../users.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatListModule,
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, OnDestroy {
  lobbies: Lobby[] = [];
  characterList: CharacterNameImage[] = characters_data;
  userCharacter: CharacterNameImage = this.characterList[0];
  searched: boolean = false;
  private authSubscription!: Subscription;
  authenticated$: Observable<boolean>;
  avatarUrl: string | null = null;
  username: string | null = null;
  id: string | null = null;
  user!: User;
  searchInterval: any;
  mainSet: boolean = true;

  constructor(
    private lobbyService: LobbyService,
    private router: Router,
    private auth: AuthService,
  ) {
    this.authenticated$ = this.auth.isAuthenticated();
  }

  ngOnInit(): void {
    this.auth.checkAuthStatus().subscribe((status) => {
      if (status.authenticated && status.user) {
        this.avatarUrl = `https://cdn.discordapp.com/avatars/${status.user.id}/${status.user.avatar}.png`;
        this.username = `${status.user.username}`;
        this.id = status.user.id;
        this.user = status.user;
        if (status.user.mainCharacter == null) {
          this.mainSet = false;
        }
      } else {
        this.avatarUrl = null;
        this.username = null;
        this.id = null;
      }
      this.searchLobbies();
      this.searchInterval = setInterval(() => {
        console.log('Searched');
        this.searchLobbies();
      }, 3000);
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    clearInterval(this.searchInterval);
  }

  searchLobbies(): void {
    this.lobbies = [];
    this.lobbyService.getLobbies().subscribe(
      (data: Lobby[]) => {
        this.lobbies = data.filter(
          (lobby) =>
            lobby.seeking_characters.some(
              (character) => character.name === this.user.mainCharacter,
            ) && !lobby.full,
        );
        this.searched = true;
      },
      (error: any) => {
        console.error(error);
        this.searched = true;
      },
    );
  }

  joinLobby(lobby_id: string) {
    this.router.navigateByUrl(`/lobby/${lobby_id}`);
  }

  goHome() {
    this.router.navigateByUrl('');
  }

  goToProfile() {
    this.router.navigateByUrl('/profile');
  }

  logout() {
    this.auth.logout();
    this.goHome();
  }

  reset() {
    this.lobbies = [];
    this.searched = false;
  }
}
