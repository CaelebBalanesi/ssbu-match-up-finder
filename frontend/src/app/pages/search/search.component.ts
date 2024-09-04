import { Component, OnInit } from '@angular/core';
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
  characterList: string[] = ['Mario', 'Donkey Kong', 'Link', 'Samus', 'Dark Samus', 'Yoshi', 'Kirby', 'Fox', 'Pikachu', 'Luigi', 'Ness', 'Captain Falcon', 'Jigglypuff', 'Peach', 'Daisy', 'Bowser', 'Ice Climbers', 'Sheik', 'Zelda', 'Dr.Mario', 'Pichu', 'Falco', 'Marth', 'Lucina', 'Young Link', 'Ganondorf', 'Mewtwo', 'Roy', 'Chrom', 'Mr. Game & Watch', 'Meta Knight', 'Pit', 'Dark Pit', 'Zero Suit Samus', 'Wario', 'Snake', 'Ike', 'Pokemon Trainer', 'Diddy Kong', 'Lucas', 'Sonic', 'King Dedede', 'Olimar', 'Lucario', 'R.O.B.', 'Toon Link', 'Wolf', 'Villager', 'Mega Man', 'Wii Fit Trainer', 'Rosalina & Luma', 'Little Mac', 'Greninja', 'Mii Brawler', 'Mii Gunner', 'Mii Swordfighter', 'Palutena', 'Pac-Man', 'Robin', 'Shulk', 'Bowser Jr.', 'Duck Hunt', 'Ryu', 'Ken', 'Cloud', 'Corrin', 'Bayonetta', 'Inkling', 'Ridley', 'Simon', 'Richter', 'King K. Rool', 'Isabelle', 'Incineroar', 'Piranha Plant', 'Joker', 'Hero', 'Banjo-Kazooie', 'Terry', 'Byleth', 'Min Min', 'Steve', 'Sephiroth', 'Pyra Mythra', 'Kazuya', 'Sora']; 
  setCharacter = false;
  username = "Anonymous";
  usernameChosen = false;

  constructor(private lobbyService: LobbyService, private router: Router) {}

  searchLobbies(): void {
    this.lobbyService.getLobbies().subscribe(
      (data: Lobby[]) => {
        this.lobbies = data.filter(lobby =>
          lobby.seeking_characters.includes(this.userCharacter) && !lobby.full
        );
      },
      (error: any) => console.error(error)
    );
    this.setCharacter = true;
  }

  joinlobby(lobby_id: string) {
    this.router.navigateByUrl(`/lobby/${lobby_id}`);
  }

  setUsername() {
    console.log(this.username);
    this.lobbyService.session_username = this.username;
    this.usernameChosen = true;
  }

  goHome() {
    this.router.navigateByUrl(``);
  }
}
