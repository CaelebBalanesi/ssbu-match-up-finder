import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SearchComponent } from './pages/search/search.component';
import { CreateComponent } from './pages/create/create.component';
import { LobbyComponent } from './pages/lobby/lobby.component';
import { AuthGuard } from './auth.guard';
import { AuthSuccessComponent } from './pages/auth-success/auth-success.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { TournamentsComponent } from './pages/tournaments/tournaments.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'search', component: SearchComponent, canActivate: [AuthGuard] },
  { path: 'create', component: CreateComponent, canActivate: [AuthGuard] },
  { path: 'lobby/:id', component: LobbyComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'tournaments', component: TournamentsComponent },
  { path: 'auth/success', component: AuthSuccessComponent },
  { path: '**', redirectTo: '' },
];
