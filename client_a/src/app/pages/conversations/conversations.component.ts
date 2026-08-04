import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import type { ConversationRow, UserRow } from '../../core/models/api.models';

@Component({
  selector: 'app-conversations',
  standalone: true,
  template: `
    <main class="page">
      <h1>Conversations</h1>

      <!-- Existing conversations -->
      <section class="section">
        <h2>Your chats</h2>

        @if (convLoading()) {
          <span class="spinner"></span>
        } @else if (convError()) {
          <p class="error-msg">{{ convError() }}</p>
        } @else if (conversations().length === 0) {
          <p class="muted">No conversations yet. Start one below.</p>
        } @else {
          <ul class="item-list">
            @for (conv of conversations(); track conv.id) {
              <li class="list-item" (click)="openConversation(conv.id)">
                <div class="list-item-left">
                  <span class="dot" [class.online]="isOnline(getOtherId(conv))"></span>
                  <span class="name">{{ conv.other_username ?? 'User ' + getOtherId(conv) }}</span>
                </div>
                <span class="muted small">{{ conv.created_at | date:'mediumDate' }}</span>
              </li>
            }
          </ul>
        }
      </section>

      <!-- Message someone -->
      <section class="section">
        <h2>Message someone</h2>

        @if (usersLoading()) {
          <span class="spinner"></span>
        } @else if (users().length === 0) {
          <p class="muted">No other users found.</p>
        } @else {
          <ul class="item-list">
            @for (user of users(); track user.id) {
              <li class="list-item no-cursor">
                <div class="list-item-left">
                  <span class="dot" [class.online]="isOnline(user.id.toString())"></span>
                  <div>
                    <span class="name">{{ user.username }}</span>
                    <span class="muted small ml">{{ user.email }}</span>
                  </div>
                </div>
                <button
                  class="btn btn-primary"
                  [disabled]="startingWith() === user.id"
                  (click)="startConversation(user.id)"
                >
                  {{ startingWith() === user.id ? 'Opening…' : 'Message' }}
                </button>
              </li>
            }
          </ul>
        }
      </section>
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
      margin-bottom: 1.25rem;
    }
    .section {
      margin-bottom: 2rem;
    }
    h2 {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }
    .item-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .name {
      font-weight: 500;
      font-size: 0.9rem;
    }
    .muted {
      color: var(--text-muted);
    }
    .small {
      font-size: 0.8rem;
    }
    .ml {
      margin-left: 0.4rem;
    }
    .no-cursor {
      cursor: default;
    }
    .no-cursor:hover {
      background: var(--surface);
    }
  `],
  imports: [DatePipe]
})
export class ConversationsComponent implements OnInit, OnDestroy {
  conversations = signal<ConversationRow[]>([]);
  users = signal<UserRow[]>([]);
  convLoading = signal(true);
  usersLoading = signal(true);
  convError = signal<string | null>(null);
  startingWith = signal<number | null>(null);
  onlineUserIds = signal<Set<string>>(new Set());

  private subs: Subscription[] = [];

  constructor(
    private chat: ChatService,
    private userService: UserService,
    private auth: AuthService,
    private socket: SocketService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    // onlineUsers$ is a BehaviorSubject — subscriber immediately gets the current list,
    // then stays updated. userOnline$/userOffline$ apply deltas on top of it.
    this.subs.push(
      this.socket.onlineUsers$.subscribe(ids => this.onlineUserIds.set(new Set(ids))),
      this.socket.userOnline$.subscribe(id => {
        this.onlineUserIds.update(s => new Set([...s, id]));
      }),
      this.socket.userOffline$.subscribe(id => {
        this.onlineUserIds.update(s => { const n = new Set(s); n.delete(id); return n; });
      })
    );

    this.socket.requestOnlineUsers();

    const currentUserId = this.auth.user()?.id;

    const [convRes, usersRes] = await Promise.all([
      this.chat.getConversations(),
      this.userService.getAll(),
    ]);

    if (convRes.success) {
      this.conversations.set(convRes.conversations ?? []);
    } else {
      this.convError.set('Failed to load conversations.');
    }
    this.convLoading.set(false);

    if (usersRes.success && usersRes.users) {
      this.users.set(usersRes.users.filter(u => u.id !== currentUserId));
    }
    this.usersLoading.set(false);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  isOnline(userId: string): boolean {
    return this.onlineUserIds().has(userId);
  }

  getOtherId(conv: ConversationRow): string {
    const me = String(this.auth.user()?.id);
    return conv.user1_id === me ? conv.user2_id : conv.user1_id;
  }

  openConversation(id: number): void {
    this.router.navigate(['/chat', id]);
  }

  async startConversation(userId: number): Promise<void> {
    this.startingWith.set(userId);
    const res = await this.chat.createConversation(userId);
    this.startingWith.set(null);
    if (res.success && res.conversation) {
      this.router.navigate(['/chat', res.conversation.id]);
    }
  }
}
