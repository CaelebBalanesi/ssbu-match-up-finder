import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client'

export interface Lobby {
  id: string;
  username: string;
  lobby_id: string;
  lobby_password: string;
  user_character: string;
  seeking_characters: string[];
  created_time: string;
  sessionId: string;
}

export interface Message {
  content: string,
  sender: string
}

@Injectable({
  providedIn: 'root'
})
export class LobbyService {

  private apiUrl = 'http://localhost:3000/lobbies';
  private socket: Socket;
  
  constructor(private http: HttpClient) {
    const sessionId = localStorage.getItem('sessionId');
    this.socket = io('http://localhost:3000', {
      query: { sessionId: sessionId },
      transports: ['websockets', 'polling']
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
  }

  // Get all lobbies
  getLobbies(): Observable<Lobby[]> {
    return this.http.get<Lobby[]>(this.apiUrl);
  }

  // Get a single lobby by ID
  getLobby(id: string): Observable<Lobby> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Lobby>(url);
  }

  // Create a new lobby
  createLobby(lobby: Lobby): Observable<Lobby> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Lobby>(this.apiUrl, lobby, { headers });
  }

  // Update an existing lobby
  updateLobby(id: string, lobby: Lobby): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(url, lobby, { headers });
  }

  // Delete a lobby
  deleteLobby(id: string): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete(url);
  }

  joinLobby(lobbyId: string): void {
    console.log("Test");
    this.socket.emit('joinLobby', lobbyId);
  }

  // Send a message to the lobby
  sendMessage(lobbyId: string, message: Message): void {
    this.socket.emit('message', { lobbyId, message });
  }

  // Listen for messages from the lobby
  onMessage(): Observable<Message> {
    return new Observable<Message>((observer) => {
      this.socket.on('message', (message: Message) => {
        observer.next(message);
      });
    });
  }
}
