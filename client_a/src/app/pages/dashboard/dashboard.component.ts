import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import type { UserRow } from '../../core/models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="page">
      <h1>Users</h1>

      @if (loading()) {
        <span class="spinner"></span>
      } @else if (error()) {
        <p class="error-msg">{{ error() }}</p>
      } @else if (users().length === 0) {
        <p class="muted">No users found.</p>
      } @else {
        <ul class="user-list">
          @for (user of users(); track user.id) {
            <li class="list-item">
              <a [routerLink]="['/users', user.id]" class="username">{{ user.username }}</a>
              <span class="muted">{{ user.email }}</span>
            </li>
          }
        </ul>
      }
    </main>
  `,
  styles: [`
    .page {
      padding: 1.5rem;
      max-width: 640px;
    }
    h1 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .user-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .username {
      font-weight: 500;
      text-decoration: none;
      color: var(--text);
    }
    .username:hover {
      text-decoration: underline;
    }
    .muted {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
  `]
})
export class DashboardComponent implements OnInit {
  users = signal<UserRow[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private userService: UserService) {}

  async ngOnInit(): Promise<void> {
    try {
      const res = await this.userService.getAll();
      if (res.success && res.users) {
        this.users.set(res.users);
      } else {
        this.error.set('Failed to load users.');
      }
    } catch {
      this.error.set('Failed to load users.');
    } finally {
      this.loading.set(false);
    }
  }
}
