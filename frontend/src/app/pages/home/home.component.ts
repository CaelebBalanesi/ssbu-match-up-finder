import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  constructor(private router: Router) {}

  searchbutton() {
    this.router.navigateByUrl('/search');
  }

  createbutton() {
    this.router.navigateByUrl('/create');
  }
}
