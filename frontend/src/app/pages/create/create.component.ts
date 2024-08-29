import { Component } from '@angular/core';
import { LobbyService, Lobby } from '../../lobby.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class CreateComponent {
  lobby: Lobby = {
    id: '',
    username: '',
    lobby_id: '',
    lobby_password: '',
    user_character: '',
    seeking_characters: [],
    created_time: new Date().toISOString()
  };

  seekingCharacter: string = '';

  constructor(private lobbyService: LobbyService, private router: Router) {}

  onAddSeekingCharacter() {
    if (this.seekingCharacter) {
      this.lobby.seeking_characters.push(this.seekingCharacter);
      this.seekingCharacter = '';
    }
  }

  onSubmit() {
    if (this.lobby.user_character && this.lobby.lobby_id && this.lobby.lobby_password && this.lobby.username) {
      this.lobby.id = this.generateId(); // Assign a unique ID
      this.lobbyService.createLobby(this.lobby).subscribe(
        () => this.router.navigate([`/lobby/${this.lobby.id}`]),
        (error) => console.error('Failed to create lobby:', error)
      );
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + new Date().getTime().toString(36);
  }
}
