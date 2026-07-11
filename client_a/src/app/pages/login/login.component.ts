import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <div class="card auth-card">
        <h1>Sign in</h1>

        @if (error()) {
          <p class="error-msg">{{ error() }}</p>
        }

        <form (ngSubmit)="submit()" #f="ngForm" novalidate>
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              [disabled]="loading()"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              [disabled]="loading()"
              required
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="btn btn-primary btn-full" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="auth-link">
          No account? <a routerLink="/signup">Sign up</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: var(--bg-subtle);
    }
    .auth-card {
      width: 100%;
      max-width: 380px;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
    }
    .error-msg {
      margin-bottom: 1rem;
    }
    form {
      margin-top: 0.5rem;
    }
    .auth-link {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: var(--text-muted);
      text-align: center;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private auth: AuthService,
    private socket: SocketService,
    private router: Router
  ) {}

  async submit(): Promise<void> {
    if (this.loading()) return;
    this.error.set(null);
    this.loading.set(true);

    const res = await this.auth.login(this.email, this.password);
    this.loading.set(false);

    if (res.success) {
      this.socket.connect();
      this.router.navigate(['/conversations']);
    } else {
      const msg = res.message ?? '';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
        this.error.set('Invalid credentials. Please try again.');
      } else {
        this.error.set('Something went wrong. Please try again.');
      }
    }
  }
}
