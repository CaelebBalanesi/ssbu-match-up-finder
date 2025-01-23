// lobby.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { CharacterNameImage } from './character';
import { environment } from '../environments/environment';

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
  avatarURL: string;
}

interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email: string;
  mfa_enabled: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LobbyService {
  private apiUrl = environment.apiUrl + '/lobbies';
  private socket: Socket;
  public lobbyFull = new Subject<boolean>();
  public joinedLobby = new Subject<any>();
  private userData$ = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {
    this.socket = io(environment.apiUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('userData', (user: User) => {
      this.userData$.next(user);
      console.log('Received user data from Socket.IO:', user);
    });

    this.socket.on('unauthorized', () => {
      console.warn('Socket.IO connection unauthorized');
      this.userData$.next(null);
    });

    this.socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });
  }

  getUserData(): Observable<User | null> {
    return this.userData$.asObservable();
  }

  // HTTP methods without custom headers
  getLobbies(): Observable<Lobby[]> {
    return this.http.get<Lobby[]>(this.apiUrl, { withCredentials: true });
  }

  getLobby(id: string): Observable<Lobby> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Lobby>(url, { withCredentials: true });
  }

  updateLobby(lobbyId: string, lobby: Lobby) {
    this.socket.emit('updateLobby', { lobbyId, lobby: lobby });
  }

  deleteLobby(id: string): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete(url, { withCredentials: true });
  }

  createLobby(lobby: Lobby): Observable<Lobby> {
    console.log(lobby);
    return this.http.post<Lobby>(this.apiUrl, lobby, { withCredentials: true });
  }

  amountOfLobbies(): Observable<any> {
    const url = `${environment.apiUrl}/stats/amount`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  // Socket.IO methods without username parameter
  joinLobby(lobbyId: string): void {
    this.socket.emit('joinLobby', { lobbyId });
  }

  sendMessage(lobbyId: string, message: string, avatarURL: string): void {
    console.log(
      `Emitting message to server - LobbyID: ${lobbyId}, Message: ${message}, AvatarURL: ${avatarURL}`,
    );
    this.socket.emit('message', { lobbyId, message, avatarURL });
  }

  leaveLobby(): void {
    this.socket.emit('leaveLobby');
  }

  // Socket event listeners
  onMessage(): Observable<Message> {
    return new Observable<Message>((observer) => {
      this.socket.on('message', (message: Message) => {
        console.log('Received message from server:', message);
        observer.next(message);
      });
    });
  }

  onLobbyChanges(): Observable<Lobby> {
    return new Observable<Lobby>((observer) => {
      this.socket.on('updateLobby', (data) => {
        observer.next(data.lobby);
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

  onLobbyClosed(): Observable<string> {
    return new Observable<string>((observer) => {
      this.socket.on('lobbyClosed', (data) => {
        observer.next(data.message);
      });
    });
  }
}
