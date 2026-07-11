import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="navbar">
      <div class="navbar-links">
        <a routerLink="/dashboard" class="btn">Users</a>
        <a routerLink="/conversations" class="btn">Chats</a>
      </div>
      <button class="btn" (click)="logout()">Logout</button>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      border-bottom: 1px solid var(--border-strong);
      background: var(--bg);
    }
    .navbar-links {
      display: flex;
      gap: 0.5rem;
    }
  `]
})
export class NavbarComponent {
  constructor(
    private auth: AuthService,
    private socket: SocketService,
    private router: Router
  ) {}

  logout(): void {
    this.socket.disconnect();
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
