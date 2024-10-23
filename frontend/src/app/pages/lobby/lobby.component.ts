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
import { CharacterNameImage, characters_data } from '../../character';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss'],
})
export class LobbyComponent implements OnInit {
  lobby!: Lobby;
  messages: Message[] = [];
  newMessage: string = '';
  isCreator: boolean = false;
  private messageSubscription!: Subscription;
  private lobbySubscription!: Subscription;
  characterList: CharacterNameImage[] = characters_data;
  newSeekingCharacter!: CharacterNameImage;
  newSeekingCharacterIndex!: number;
  newHostCharacterIndex!: number;
  username: string = '';
  private censor: TextCensor;
  private matcher: RegExpMatcher;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor(
    private lobbyService: LobbyService,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
  ) {
    this.censor = new TextCensor();
    this.matcher = new RegExpMatcher({
      ...englishDataset.build(),
      ...englishRecommendedTransformers,
    });
  }

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.username = this.auth.getUsername();
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.lobbyService.getLobby(id).subscribe(
        (lobby: Lobby) => {
          this.lobby = lobby;
          this.isCreator = this.checkIfCreator(lobby);
          this.username = this.auth.getUsername();
          console.log(`Joining lobby: ${this.lobby.id}`);
          this.lobbyService.joinLobby(this.lobby.id, this.username);
          console.log(this.lobby.full);
        },
        (error: any) => {
          this.router.navigateByUrl(`/`);
          console.error(error);
        },
      );

      this.lobbyService.lobbyFull.subscribe((isFull) => {
        if (isFull) {
          this.router.navigateByUrl(`/search`);
          alert('Lobby is full');
        }
      });

      this.lobbyService.joinedLobby.subscribe((data) => {
        console.log('Successfully joined lobby:', data);
      });

      this.messageSubscription = this.lobbyService.onMessage().subscribe(
        (message: Message) => {
          this.messages.push(message);
          this.scrollToBottom();
          console.log('New message received:', message);
        },
        (error) => console.error('Error receiving messages:', error),
      );

      this.lobbySubscription = this.lobbyService.onLobbyUpdate().subscribe(
        (update: string) => {
          let lobbyMessage: Message = {
            username: 'System',
            sender: 'System',
            content: update,
          };
          this.messages.push(lobbyMessage);
          this.scrollToBottom();
        },
        (error) => console.error('Error receiving updates:', error),
      );
    }

    window.onbeforeunload = () => this.ngOnDestroy();
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      let matches = this.matcher.getAllMatches(this.newMessage);
      this.lobbyService.sendMessage(
        this.lobby.id,
        this.censor.applyTo(this.newMessage, matches),
        this.username,
      );
      this.newMessage = '';
    }
  }

  updateLobby(): void {
    this.lobby.host_character = characters_data[this.newHostCharacterIndex];
    this.lobbyService.updateLobby(this.lobby.id, this.lobby).subscribe(
      () => alert('Lobby updated successfully'),
      (error: any) => console.error(error),
    );
  }

  private checkIfCreator(lobby: Lobby): boolean {
    return lobby.host_username === this.username;
  }

  isMyMessage(message: Message): boolean {
    return message.username === this.username;
  }

  shutdownLobby(): void {
    if (this.isCreator) {
      this.lobbyService.deleteLobby(this.lobby.id).subscribe(
        () => {
          this.router.navigateByUrl(`/`);
        },
        (error: any) => console.error(error),
      );
    }
  }

  addSeekingCharacter(): void {
    this.newSeekingCharacter = characters_data[this.newSeekingCharacterIndex];
    if (
      !this.lobby.seeking_characters.some(
        (character) => character.name === this.newSeekingCharacter.name,
      )
    ) {
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
    if (this.lobbySubscription) {
      this.lobbySubscription.unsubscribe();
    }

    if (this.isCreator) {
      this.lobbyService.deleteLobby(this.lobby.id).subscribe(
        () => {},
        (error: any) => console.error(error),
      );
    } else {
      this.lobbyService.leaveLobby();
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Failed to scroll to bottom:', err);
    }
  }
}
