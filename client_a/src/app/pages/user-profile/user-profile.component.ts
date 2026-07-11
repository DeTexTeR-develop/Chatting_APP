import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import type { UserRow } from '../../core/models/api.models';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <main class="page">
      <h1>Profile</h1>

      @if (loading()) {
        <span class="spinner"></span>
      } @else if (error()) {
        <p class="error-msg">{{ error() }}</p>
      } @else if (profileUser()) {
        <!-- Details -->
        <section class="card section">
          <dl class="dl">
            <div class="dl-row">
              <dt>Username</dt>
              <dd>{{ profileUser()!.username }}</dd>
            </div>
            <div class="dl-row">
              <dt>Email</dt>
              <dd>{{ profileUser()!.email }}</dd>
            </div>
            <div class="dl-row">
              <dt>Member since</dt>
              <dd>{{ profileUser()!.created_at | date:'mediumDate' }}</dd>
            </div>
          </dl>
        </section>

        <!-- Edit form (own profile) -->
        @if (isOwnProfile()) {
          <section class="card section">
            <h2>Edit</h2>
            <form (ngSubmit)="update()" novalidate>
              <div class="form-group">
                <label for="eu">Username</label>
                <input id="eu" type="text" [(ngModel)]="editUsername" name="username" [disabled]="updateLoading()" />
              </div>
              <div class="form-group">
                <label for="ee">Email</label>
                <input id="ee" type="email" [(ngModel)]="editEmail" name="email" [disabled]="updateLoading()" />
              </div>

              @if (updateError()) {
                <p class="error-msg mb">{{ updateError() }}</p>
              }
              @if (updateSuccess()) {
                <p class="success mb">Saved.</p>
              }

              <button type="submit" class="btn btn-primary" [disabled]="updateLoading()">
                {{ updateLoading() ? 'Saving…' : 'Save' }}
              </button>
            </form>
          </section>
        }

        <!-- Delete (admin only, other user) -->
        @if (canDelete()) {
          <section class="card danger-zone">
            <h2>Danger zone</h2>
            <p class="muted">Permanently delete this user. Cannot be undone.</p>

            @if (deleteError()) {
              <p class="error-msg mb">{{ deleteError() }}</p>
            }
            @if (showConfirm()) {
              <div class="confirm-box">
                <p>Delete <strong>{{ profileUser()!.username }}</strong>?</p>
                <div class="confirm-actions">
                  <button class="btn btn-danger" (click)="confirmDelete()" [disabled]="deleteLoading()">
                    {{ deleteLoading() ? 'Deleting…' : 'Yes, delete' }}
                  </button>
                  <button class="btn" (click)="showConfirm.set(false)">Cancel</button>
                </div>
              </div>
            } @else {
              <button class="btn btn-danger" (click)="showConfirm.set(true)">Delete User</button>
            }
          </section>
        }
      }
    </main>
  `,
  styles: [`
    .page {
      padding: 1.5rem;
      max-width: 560px;
    }
    h1 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
    }
    h2 {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .section {
      margin-bottom: 1.25rem;
    }
    .dl { display: flex; flex-direction: column; gap: 0.5rem; }
    .dl-row { display: flex; gap: 0.75rem; font-size: 0.9rem; }
    dt { font-weight: 500; min-width: 110px; color: var(--text-muted); }
    dd { margin: 0; }
    .muted { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.75rem; }
    .mb { margin-bottom: 0.75rem; }
    .success { color: #166534; font-size: 0.875rem; margin-bottom: 0.75rem; }
    .danger-zone { border-color: #ccc; }
    .confirm-box { margin-top: 0.5rem; }
    .confirm-box p { margin-bottom: 0.75rem; font-size: 0.9rem; }
    .confirm-actions { display: flex; gap: 0.5rem; }
  `]
})
export class UserProfileComponent implements OnInit {
  profileUser = signal<UserRow | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  editUsername = '';
  editEmail = '';
  updateLoading = signal(false);
  updateError = signal<string | null>(null);
  updateSuccess = signal(false);

  showConfirm = signal(false);
  deleteLoading = signal(false);
  deleteError = signal<string | null>(null);

  isOwnProfile = computed(() => this.auth.user()?.id === this.profileUser()?.id);
  canDelete = computed(() => this.auth.user()?.role === 'Admin' && !this.isOwnProfile() && !!this.profileUser());

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const res = await this.userService.getById(id);
    const raw = res as { success: boolean; message?: string };

    if (!raw.success) {
      this.error.set('User not found.');
      this.loading.set(false);
      return;
    }

    // Server returns user data as JSON string in message field: "User : [{...}]"
    const match = raw.message?.match(/\[.*\]/s);
    const users = match ? (JSON.parse(match[0]) as UserRow[]) : [];
    const user = users[0] ?? null;

    if (!user) {
      this.error.set('User not found.');
    } else {
      this.profileUser.set(user);
      this.editUsername = user.username;
      this.editEmail = user.email;
    }
    this.loading.set(false);
  }

  async update(): Promise<void> {
    const user = this.profileUser();
    if (!user) return;

    this.updateError.set(null);
    this.updateSuccess.set(false);

    const payload: { username?: string; email?: string } = {};
    if (this.editUsername !== user.username) payload.username = this.editUsername;
    if (this.editEmail !== user.email) payload.email = this.editEmail;

    if (!Object.keys(payload).length) {
      this.updateError.set('No changes to save.');
      return;
    }

    this.updateLoading.set(true);
    const res = await this.userService.update(user.id, payload);
    this.updateLoading.set(false);

    if (res.success) {
      const updated = res.user ?? { ...user, ...payload };
      this.profileUser.set(updated);
      this.editUsername = updated.username;
      this.editEmail = updated.email;
      this.updateSuccess.set(true);
    } else {
      this.updateError.set(res.message ?? 'Update failed.');
    }
  }

  async confirmDelete(): Promise<void> {
    const user = this.profileUser();
    if (!user) return;

    this.deleteLoading.set(true);
    const res = await this.userService.delete(user.id);
    this.deleteLoading.set(false);

    if (res.success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.showConfirm.set(false);
      this.deleteError.set(res.message ?? 'Delete failed.');
    }
  }
}
