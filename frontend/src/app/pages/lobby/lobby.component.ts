import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LobbyService, Lobby, Message } from '../../lobby.service';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import {
  RegExpMatcher,
  TextCensor,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';
import { CharacterNameImage, characters_data } from '../../character';
import { AuthService } from '../../auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email: string;
  mfa_enabled: boolean;
}

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss'],
})
export class LobbyComponent implements OnInit, OnDestroy {
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

  messages: Message[] = [];
  newMessage: string = '';
  isCreator: boolean = false;
  private messageSubscription!: Subscription;
  private lobbySubscription!: Subscription;
  private lobbyChangesSubscription!: Subscription;
  characterList: CharacterNameImage[] = characters_data;
  newSeekingCharacterIndex: number = 0;
  newHostCharacterIndex: number = 0;
  username: string | null = '';
  private censor: TextCensor;
  private matcher: RegExpMatcher;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  lobbyClosedSubscription!: Subscription;
  private authSubscription!: Subscription;
  unsavedChanges: boolean = false;
  authenticated$: Observable<boolean>;
  user$: Observable<User | null>;
  avatarUrl: string | null = null;
  id: string | null = null;
  new_lobby_id: string = '';
  new_lobby_password: string = '';

  constructor(
    private lobbyService: LobbyService,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private snackbar: MatSnackBar,
  ) {
    this.censor = new TextCensor();
    this.matcher = new RegExpMatcher({
      ...englishDataset.build(),
      ...englishRecommendedTransformers,
    });
    this.authenticated$ = this.auth.isAuthenticated();
    this.user$ = this.auth.getUserInfo();
  }

  ngOnInit(): void {
    this.auth.checkAuthStatus().subscribe(
      (status) => {
        if (status.authenticated && status.user) {
          this.avatarUrl = `https://cdn.discordapp.com/avatars/${status.user.id}/${status.user.avatar}.png`;
          this.username = `${status.user.username}`;
          this.lobby.host_username = this.username;
          this.id = status.user.id;
          this.initializeLobby();
        } else {
          this.avatarUrl = null;
          this.username = null;
          this.id = null;
          this.auth.login();
        }
      },
      (error) => {
        console.error('Error fetching authentication status:', error);
        this.auth.login();
      },
    );

    window.onbeforeunload = () => this.ngOnDestroy();
  }

  ngOnChanges(): void {
    if (this.new_lobby_id != this.lobby.smash_lobby_id) {
      this.unsavedChanges = true;
    }

    if (this.new_lobby_password != this.lobby.smash_lobby_password) {
      this.unsavedChanges = true;
    }
  }

  private initializeLobby(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.lobbyService.getLobby(id).subscribe(
        (lobby: Lobby) => {
          this.lobby = lobby;
          console.log(this.lobby);
          this.isCreator = this.checkIfCreator(lobby);
          this.lobbyService.joinLobby(this.lobby.id);
          this.subscribeToMessages();
          this.subscribeToLobbyUpdates();
          this.new_lobby_id = lobby.smash_lobby_id;
          this.new_lobby_password = lobby.smash_lobby_password;
        },
        (error: any) => {
          this.router.navigateByUrl('/');
          console.error(error);
        },
      );

      this.lobbyService.lobbyFull.subscribe((isFull) => {
        if (isFull) {
          this.router.navigateByUrl('/search');
          this.snackbar.open('Lobby is Full', 'Close', {
            duration: 3000,
          });
        }
      });

      this.lobbyClosedSubscription = this.lobbyService
        .onLobbyClosed()
        .subscribe(
          (message: string) => {
            this.snackbar.open(message, 'Close', {
              duration: 3000,
            });
            this.router.navigate(['/']);
          },
          (error) =>
            console.error('Error receiving lobby closed event:', error),
        );

      this.lobbyChangesSubscription = this.lobbyService
        .onLobbyChanges()
        .subscribe(
          (lobby: Lobby) => {
            this.lobby = lobby;
            this.snackbar.open('Lobby Updated', 'Close', {
              duration: 3000,
            });
            this.unsavedChanges = false;
          },
          (error) => console.error('Error:', error),
        );
    }
  }

  private subscribeToMessages(): void {
    this.messageSubscription = this.lobbyService.onMessage().subscribe(
      (message: Message) => {
        this.messages.push(message);
        console.log(message.avatarURL);
        this.scrollToBottom();
      },
      (error) => console.error('Error receiving messages:', error),
    );
  }

  private subscribeToLobbyUpdates(): void {
    this.lobbySubscription = this.lobbyService.onLobbyUpdate().subscribe(
      (update: string) => {
        let lobbyMessage: Message = {
          username: 'System',
          sender: 'System',
          content: update,
          avatarURL: '',
        };
        this.messages.push(lobbyMessage);
        this.scrollToBottom();
      },
      (error) => console.error('Error receiving updates:', error),
    );
  }

  sendMessage(): void {
    if (this.newMessage.trim() && this.lobby && this.avatarUrl) {
      console.log(`[MESSAGE] "${this.newMessage}"`);
      const matches = this.matcher.getAllMatches(this.newMessage);
      const sanitizedMessage = this.censor.applyTo(this.newMessage, matches);
      this.lobbyService.sendMessage(
        this.lobby.id,
        sanitizedMessage,
        this.avatarUrl,
      );
      this.newMessage = '';
      this.scrollToBottom();
    } else if (!this.lobby) {
      alert('You are no longer in the lobby.');
    }
    this.scrollToBottom();
  }

  updateLobby(): void {
    this.lobby.smash_lobby_password = this.new_lobby_password;
    this.lobby.smash_lobby_id = this.new_lobby_id;
    this.lobby.host_character = this.characterList[this.newHostCharacterIndex];
    this.lobbyService.updateLobby(this.lobby.id, this.lobby);
  }

  updateHostCharacter(): void {
    this.unsavedChanges = true;
    this.lobby.host_character = this.characterList[this.newHostCharacterIndex];
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
          this.router.navigateByUrl('/');
        },
        (error: any) => console.error(error),
      );
    }
  }

  addSeekingCharacter(): void {
    const newCharacter = this.characterList[this.newSeekingCharacterIndex];
    if (
      !this.lobby.seeking_characters.some(
        (character) => character.name === newCharacter.name,
      )
    ) {
      this.lobby.seeking_characters.push(newCharacter);
    }
    this.unsavedChanges = true;
  }

  removeSeekingCharacter(index: number): void {
    this.lobby.seeking_characters.splice(index, 1);
    this.unsavedChanges = true;
  }

  ngOnDestroy(): void {
    this.lobbyService.leaveLobby();

    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    if (this.lobbySubscription) {
      this.lobbySubscription.unsubscribe();
    }
    if (this.lobbyClosedSubscription) {
      this.lobbyClosedSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.messagesContainer.nativeElement.scroll({
        top: this.messagesContainer.nativeElement.scrollHeight,
        left: 0,
        behavior: 'smooth',
      });
    }, 0);
  }

  goHome() {
    this.router.navigateByUrl('');
  }

  logout() {
    this.auth.logout();
  }
}
