import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email: string;
  mfa_enabled: boolean;
  mainCharacter: string | null; // Main character can initially be null
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}/users`;
  private userData$ = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {}

  // Fetch user data and update the BehaviorSubject
  fetchUser(id: string): Observable<User> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<User>(url, { withCredentials: true });
  }

  getUserData(): Observable<User | null> {
    return this.userData$.asObservable();
  }

  // Update the main character for a user
  updateMainCharacter(userId: string, mainCharacter: string): Observable<any> {
    const url = `${this.apiUrl}/${userId}/main`;
    return this.http.post<any>(
      url,
      { mainCharacter },
      { withCredentials: true },
    );
  }

  // Get all users who play a specific character
  getUsersByMainCharacter(mainCharacter: string): Observable<User[]> {
    const url = `${this.apiUrl}/main/${mainCharacter}`;
    return this.http.get<User[]>(url, { withCredentials: true });
  }

  // Get all users (if needed for admin purposes or similar functionality)
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, { withCredentials: true });
  }
}
