// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

interface AuthStatus {
  authenticated: boolean;
  user?: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  private authStatus$ = new BehaviorSubject<AuthStatus>({
    authenticated: false,
  });

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login() {
    window.location.href = `${this.apiUrl}/discord`;
  }

  logout() {
    this.http
      .get(`${this.apiUrl}/logout`, { withCredentials: true })
      .subscribe(() => {
        this.authStatus$.next({ authenticated: false });
        this.router.navigate(['/login']);
      });
  }

  isAuthenticated(): Observable<boolean> {
    return this.authStatus$
      .asObservable()
      .pipe(map((status) => status.authenticated));
  }

  getUserInfo(): Observable<any> {
    return this.authStatus$.asObservable().pipe(map((status) => status.user));
  }

  checkAuthStatus(): Observable<AuthStatus> {
    return this.http
      .get<AuthStatus>(`${this.apiUrl}/status`, { withCredentials: true })
      .pipe(tap((status) => this.authStatus$.next(status)));
  }
}
