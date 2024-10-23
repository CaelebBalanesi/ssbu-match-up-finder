import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../environments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl + "/auth";
  private tokenKey = 'authToken';
  private usernameKey = 'Username';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('Username');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUsername(): string {
    return localStorage.getItem(this.usernameKey) ?? '';
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  login(username: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap((response) => {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.usernameKey, username);
        }),
      );
  }

  register(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, password });
  }
}
