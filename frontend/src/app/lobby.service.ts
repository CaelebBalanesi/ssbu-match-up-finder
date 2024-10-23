import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { CharacterNameImage } from './character';
import { AuthService } from '../app/auth.service';
import { Router } from '@angular/router';
import { environment } from '../environments/enviroment';

export interface Lobby {
  id: string;
  host_username: string;
  smash_lobby_id: string;
  smash_lobby_password: string;
  host_character: CharacterNameImage;
  seeking_characters: CharacterNameImage[];
  created_time: string;
  full: boolean;
}

export interface Message {
  content: string;
  sender: string;
  username: string;
}

@Injectable({
  providedIn: 'root',
})
export class LobbyService {
  private apiUrl = environment.apiUrl + '/lobbies';
  private socket: Socket;
  public lobbyFull = new Subject<boolean>();
  public joinedLobby = new Subject<any>();
  public session_username = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
  ) {
    // lobby.service.ts (modify socket initialization)
    this.socket = io(environment.apiUrl, {
      auth: {
        token: this.authService.getToken(),
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('sessionId', (newSessionId: string) => {
      console.log(`SessionId: ${newSessionId}`);
      localStorage.setItem('sessionId', newSessionId);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection Error:', error);
    });

    this.socket.on('lobbyFull', () => {
      console.log('Lobby is full');
      this.lobbyFull.next(true);
    });

    this.socket.on('joinedLobby', (data) => {
      console.log('Joined lobby:', data.lobbyId);
      this.joinedLobby.next(data);
    });
  }

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  // Get all lobbies
  getLobbies(): Observable<Lobby[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Lobby[]>(this.apiUrl, { headers });
  }

  // Get a single lobby by ID
  getLobby(id: string): Observable<Lobby> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Lobby>(url, { headers });
  }

  // Create a new lobby
  createLobby(lobby: Lobby): Observable<Lobby> {
    const headers = this.getAuthHeaders();
    return this.http.post<Lobby>(this.apiUrl, lobby, { headers });
  }

  // Update an existing lobby
  updateLobby(id: string, lobby: Lobby): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getAuthHeaders();
    return this.http.put(url, lobby, { headers });
  }

  // Delete a lobby
  deleteLobby(id: string): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getAuthHeaders();
    return this.http.delete(url, { headers });
  }

  joinLobby(lobbyId: string, username: string): void {
    this.socket.emit('joinLobby', { lobbyId, username });
  }

  sendMessage(lobbyId: string, message: string, username: string): void {
    console.log(username);
    this.socket.emit('message', { lobbyId, message, username });
  }

  leaveLobby(): void {
    this.socket.emit('disconnectFromLobby');
  }

  // Listen for messages from the lobby
  onMessage(): Observable<Message> {
    return new Observable<Message>((observer) => {
      this.socket.on('message', (message: Message) => {
        observer.next(message);
      });
    });
  }

  onLobbyUpdate(): Observable<string> {
    return new Observable<string>((observer) => {
      this.socket.on('userJoined', (data) => {
        observer.next(`${data.username} has joined the lobby`);
      });

      this.socket.on('userLeft', (data) => {
        observer.next(`${data.username} has left the lobby`);
      });
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }
}
