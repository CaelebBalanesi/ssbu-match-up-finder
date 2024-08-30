import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LobbyService, Lobby, Message } from '../../lobby.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

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

  constructor(
    private lobbyService: LobbyService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.sessionId = localStorage.getItem('sessionId') || '';
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.lobbyService.getLobby(id).subscribe(
        (lobby: Lobby) => {
          this.lobby = lobby;
          this.isCreator = this.checkIfCreator(lobby);
          console.log(`joining: ${this.lobby.id}`);
          this.lobbyService.joinLobby(this.lobby.id);
          console.log(this.isCreator);
        },
        (error: any) => console.error(error)
      );

      // Subscribe to incoming messages
      this.messageSubscription = this.lobbyService.onMessage().subscribe(
        (message: Message) => this.messages.push(message)
      );
    }
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      const message: Message = {
        content: this.newMessage,
        sender: this.sessionId
      };
      this.lobbyService.sendMessage(this.lobby.id, message);
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
    return message.sender === this.sessionId;
  }

  ngOnDestroy(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }
}