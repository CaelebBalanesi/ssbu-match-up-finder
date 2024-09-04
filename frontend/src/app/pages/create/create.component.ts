import { Component, OnInit } from '@angular/core';
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

export class CreateComponent implements OnInit {
  lobby: Lobby = {
    id: '',
    username: '',
    lobby_id: '',
    lobby_password: '',
    user_character: '',
    seeking_characters: [],
    created_time: new Date().toISOString(),
    sessionId: '',
    full: false,
  };

  seekingCharacter: string = '';
  characterList: string[] = ['Mario', 'Donkey Kong', 'Link', 'Samus', 'Dark Samus', 'Yoshi', 'Kirby', 'Fox', 'Pikachu', 'Luigi', 'Ness', 'Captain Falcon', 'Jigglypuff', 'Peach', 'Daisy', 'Bowser', 'Ice Climbers', 'Sheik', 'Zelda', 'Dr.Mario', 'Pichu', 'Falco', 'Marth', 'Lucina', 'Young Link', 'Ganondorf', 'Mewtwo', 'Roy', 'Chrom', 'Mr. Game & Watch', 'Meta Knight', 'Pit', 'Dark Pit', 'Zero Suit Samus', 'Wario', 'Snake', 'Ike', 'Pokemon Trainer', 'Diddy Kong', 'Lucas', 'Sonic', 'King Dedede', 'Olimar', 'Lucario', 'R.O.B.', 'Toon Link', 'Wolf', 'Villager', 'Mega Man', 'Wii Fit Trainer', 'Rosalina & Luma', 'Little Mac', 'Greninja', 'Mii Brawler', 'Mii Gunner', 'Mii Swordfighter', 'Palutena', 'Pac-Man', 'Robin', 'Shulk', 'Bowser Jr.', 'Duck Hunt', 'Ryu', 'Ken', 'Cloud', 'Corrin', 'Bayonetta', 'Inkling', 'Ridley', 'Simon', 'Richter', 'King K. Rool', 'Isabelle', 'Incineroar', 'Piranha Plant', 'Joker', 'Hero', 'Banjo-Kazooie', 'Terry', 'Byleth', 'Min Min', 'Steve', 'Sephiroth', 'Pyra Mythra', 'Kazuya', 'Sora']; 

  constructor(private lobbyService: LobbyService, private router: Router) {}

  ngOnInit() {
    // Retrieve session ID from local storage
    this.lobby.sessionId = localStorage.getItem('sessionId') || '';
  }

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

  goHome() {
    this.router.navigateByUrl(``);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + new Date().getTime().toString(36);
  }
}