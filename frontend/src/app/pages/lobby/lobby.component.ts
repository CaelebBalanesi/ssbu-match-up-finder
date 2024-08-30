import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LobbyService, Lobby } from '../../lobby.service';
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
  messages: string[] = [];
  newMessage: string = '';
  isCreator: boolean = false;
  private messageSubscription!: Subscription;

  constructor(
    private lobbyService: LobbyService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
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
        (message: string) => this.messages.push(message)
      );
    }
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.lobbyService.sendMessage(this.lobby.id, this.newMessage);
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
    const sessionId = localStorage.getItem('sessionId');
    console.log(`The user session ID: ${sessionId}\nThe lobby session ID: ${lobby.sessionId}`);
    return lobby.sessionId === sessionId;
  }

  ngOnDestroy(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }
}
