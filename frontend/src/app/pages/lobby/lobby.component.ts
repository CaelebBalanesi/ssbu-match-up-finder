import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LobbyService, Lobby, Message } from '../../lobby.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
	RegExpMatcher,
	TextCensor,
	englishDataset,
	englishRecommendedTransformers,
} from 'obscenity';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent {
  lobby!: Lobby;
  messages: Message[] = [];
  newMessage: string = '';
  isCreator: boolean = false;
  private messageSubscription!: Subscription;
  private sessionId!: string;
  characterList: string[] = ['Mario', 'Donkey Kong', 'Link', 'Samus', 'Dark Samus', 'Yoshi', 'Kirby', 'Fox', 'Pikachu', 'Luigi', 'Ness', 'Captain Falcon', 'Jigglypuff', 'Peach', 'Daisy', 'Bowser', 'Ice Climbers', 'Sheik', 'Zelda', 'Dr.Mario', 'Pichu', 'Falco', 'Marth', 'Lucina', 'Young Link', 'Ganondorf', 'Mewtwo', 'Roy', 'Chrom', 'Mr. Game & Watch', 'Meta Knight', 'Pit', 'Dark Pit', 'Zero Suit Samus', 'Wario', 'Snake', 'Ike', 'Pokemon Trainer', 'Diddy Kong', 'Lucas', 'Sonic', 'King Dedede', 'Olimar', 'Lucario', 'R.O.B.', 'Toon Link', 'Wolf', 'Villager', 'Mega Man', 'Wii Fit Trainer', 'Rosalina & Luma', 'Little Mac', 'Greninja', 'Mii Brawler', 'Mii Gunner', 'Mii Swordfighter', 'Palutena', 'Pac-Man', 'Robin', 'Shulk', 'Bowser Jr.', 'Duck Hunt', 'Ryu', 'Ken', 'Cloud', 'Corrin', 'Bayonetta', 'Inkling', 'Ridley', 'Simon', 'Richter', 'King K. Rool', 'Isabelle', 'Incineroar', 'Piranha Plant', 'Joker', 'Hero', 'Banjo-Kazooie', 'Terry', 'Byleth', 'Min Min', 'Steve', 'Sephiroth', 'Pyra Mythra', 'Kazuya', 'Sora']; 
  newSeekingCharacter: string = '';
  username: string = '';
  private censor: TextCensor;
  private matcher: RegExpMatcher;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor(
    private lobbyService: LobbyService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.censor = new TextCensor();
    this.matcher = new RegExpMatcher({
      ...englishDataset.build(),
      ...englishRecommendedTransformers,
    });
  }

  ngOnInit(): void {
    this.sessionId = localStorage.getItem('sessionId') || '';
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.lobbyService.getLobby(id).subscribe(
        (lobby: Lobby) => {
          this.lobby = lobby;
          this.isCreator = this.checkIfCreator(lobby);
          if (!this.isCreator) {
            this.username = prompt("Enter your username:") || "Anonymous";
          } else {
            this.username = this.lobby.username;
          }
          console.log(`joining: ${this.lobby.id}`);
          this.lobbyService.joinLobby(this.lobby.id, this.username);
          console.log(this.lobby.full);
        },
        (error: any) => {
          this.router.navigateByUrl(`/`);
          console.error(error);
        }
      );

      this.lobbyService.lobbyFull.subscribe((isFull) => {
        if (isFull) {
          this.router.navigateByUrl(`/search`);
          alert('Lobby is full');
        }
      });

      this.lobbyService.joinedLobby.subscribe((data) => {
        console.log('Successfully joined lobby:', data);
        // Update the UI based on successful join
      });

      // Subscribe to incoming messages
      this.messageSubscription = this.lobbyService.onMessage().subscribe(
        (message: Message) => {
          this.scrollToBottom();
          this.messages.push(message);
          console.log('New message received:', message);
        },
        (error) => console.error('Error receiving messages:', error)
      );
    }

    window.onbeforeunload = () => this.ngOnDestroy();
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      let matches = this.matcher.getAllMatches(this.newMessage);
      this.lobbyService.sendMessage(this.lobby.id, this.censor.applyTo(this.newMessage, matches) , this.username);
      this.newMessage = '';
    }
  }

  updateLobby(): void {
    this.lobbyService.updateLobby(this.lobby.id, this.lobby).subscribe(
      () => alert('Lobby updated successfully'),
      (error: any) => console.error(error)
    );
  }

  private checkIfCreator(lobby: Lobby): boolean {
    return lobby.sessionId === this.sessionId;
  }

  isMyMessage(message: Message): boolean {
    return message.username === this.username;
  }

  shutdownLobby(): void {
    if (this.isCreator) {
      console.log(this.lobby.id);
      this.lobbyService.deleteLobby(this.lobby.id).subscribe();
    }
  }

  addSeekingCharacter(): void {
    if (!this.lobby.seeking_characters.includes(this.newSeekingCharacter)) {
      this.lobby.seeking_characters.push(this.newSeekingCharacter);
      this.updateLobby();
    }
  }

  removeSeekingCharacter(index: number): void {
    this.lobby.seeking_characters.splice(index, 1);
    this.updateLobby();
  }

  ngOnDestroy(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }

    if (this.isCreator) {
      console.log(this.lobby.id);
      this.lobbyService.deleteLobby(this.lobby.id).subscribe();
    } else {
      
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) {
      console.error('Failed to scroll to bottom:', err);
    }
  }
}