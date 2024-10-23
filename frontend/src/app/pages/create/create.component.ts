import { Component, OnInit } from '@angular/core';
import { LobbyService, Lobby } from '../../lobby.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CharacterNameImage, characters_data } from '../../character';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss',
})
export class CreateComponent implements OnInit {
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
  username = '';

  constructor(
    private lobbyService: LobbyService,
    private router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
    this.username = this.auth.getUsername();
    this.lobby.host_username = this.auth.getUsername();
    this.lobby.host_character = this.characterList[this.selectedCharacterIndex];
    this.seekingCharacter = this.characterList[this.seekingCharacterIndex];
  }

  onAddSeekingCharacter() {
    if (
      !this.lobby.seeking_characters.includes(
        this.characterList[this.seekingCharacterIndex],
      )
    ) {
      this.lobby.seeking_characters.push(
        this.characterList[this.seekingCharacterIndex],
      );
    }
  }

  removeSeekingCharacter(index: number) {
    this.lobby.seeking_characters.splice(index, 1);
  }

  updateSelectedCharacter() {
    this.lobby.host_character = this.characterList[this.selectedCharacterIndex];
  }

  onSubmit() {
    this.username = this.auth.getUsername();
    if (
      this.lobby.host_character &&
      this.lobby.smash_lobby_id &&
      this.lobby.smash_lobby_password &&
      this.lobby.host_username
    ) {
      this.lobbyService.createLobby(this.lobby).subscribe(
        (value) => this.router.navigate([`/lobby/${value.id}`]),
        (error) => console.error('Failed to create lobby:', error),
      );
    }
  }

  logout() {
    this.auth.logout();
  }

  goHome() {
    this.router.navigateByUrl(``);
  }
}
