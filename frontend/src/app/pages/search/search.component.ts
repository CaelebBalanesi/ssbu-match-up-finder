import { Component, OnInit } from '@angular/core';
import { LobbyService, Lobby } from '../../lobby.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CharacterNameImage, characters_data } from '../../character';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  lobbies: Lobby[] = [];
  characterList: CharacterNameImage[] = characters_data;
  setCharacter = false;
  userCharacter: CharacterNameImage = this.characterList[0];
  username = '';

  constructor(
    private lobbyService: LobbyService,
    private router: Router,
    private auth: AuthService,
  ) {}

  searchLobbies(): void {
    this.lobbyService.getLobbies().subscribe(
      (data: Lobby[]) => {
        this.lobbies = data.filter(
          (lobby) =>
            lobby.seeking_characters.some(
              (character) => character.name == this.userCharacter.name,
            ) && !lobby.full,
        );
      },
      (error: any) => console.error(error),
    );
    this.setCharacter = true;
  }

  joinlobby(lobby_id: string) {
    this.router.navigateByUrl(`/lobby/${lobby_id}`);
  }

  goHome() {
    this.router.navigateByUrl(``);
  }

  logout() {
    this.auth.logout();
  }

  ngOnInit() {
    this.username = this.auth.getUsername();
    if (this.characterList.length > 0) {
      this.userCharacter = this.characterList[0];
    }
  }
}
