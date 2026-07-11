import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <div class="card auth-card">
        <h1>Create account</h1>

        @if (error()) {
          <p class="error-msg">{{ error() }}</p>
        }

        <form (ngSubmit)="submit()" novalidate>
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              type="text"
              [(ngModel)]="username"
              name="username"
              [disabled]="loading()"
              required
              autocomplete="username"
            />
          </div>

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
              autocomplete="new-password"
            />
          </div>

          <button type="submit" class="btn btn-primary btn-full" [disabled]="loading()">
            {{ loading() ? 'Creating…' : 'Sign up' }}
          </button>
        </form>

        <p class="auth-link">
          Have an account? <a routerLink="/login">Sign in</a>
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
    .auth-link {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: var(--text-muted);
      text-align: center;
    }
  `]
})
export class SignupComponent {
  username = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  async submit(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);

    const res = await this.auth.signup(this.username, this.email, this.password);
    this.loading.set(false);

    if (res.success) {
      this.router.navigate(['/login']);
    } else {
      const msg = res.message ?? '';
      if (msg.toLowerCase().includes('already exists')) {
        this.error.set('An account with this email already exists.');
      } else {
        this.error.set(msg || 'Something went wrong. Please try again.');
      }
    }
  }
}
