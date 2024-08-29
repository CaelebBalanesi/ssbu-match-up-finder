import { Component } from '@angular/core';
import { LobbyService, Lobby } from '../../lobby.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent {
  userCharacter: string = '';
  lobbies: Lobby[] = [];

  constructor(private lobbyService: LobbyService, private router: Router) {}

  searchLobbies(): void {
    this.lobbyService.getLobbies().subscribe(
      (data: Lobby[]) => {
        this.lobbies = data.filter(lobby =>
          lobby.seeking_characters.includes(this.userCharacter)
        );
      },
      (error: any) => console.error(error)
    );
  }

  joinlobby(lobby_id: string) {
    this.router.navigateByUrl(`/lobby/${lobby_id}`);
  }
}
