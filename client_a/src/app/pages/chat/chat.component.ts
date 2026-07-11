import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import type { MessageRow } from '../../core/models/api.models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="chat-shell">

      <!-- Messages -->
      <div class="messages" #scrollContainer>
        @if (loading()) {
          <span class="spinner"></span>
        } @else if (messages().length === 0) {
          <p class="empty">No messages yet. Say hello.</p>
        } @else {
          @for (msg of messages(); track msg.id) {
            <div class="bubble-wrap" [class.own]="isOwn(msg)">
              <span class="sender">{{ isOwn(msg) ? 'You' : (msg.sender_username ?? 'User ' + msg.sender_id) }}</span>
              <div class="bubble" [class.own]="isOwn(msg)">{{ msg.content }}</div>
            </div>
          }
        }
        <div #bottomAnchor></div>
      </div>

      @if (sendError()) {
        <p class="error-msg send-error">{{ sendError() }}</p>
      }

      <!-- Input -->
      <form class="input-bar" (ngSubmit)="send()">
        <input
          type="text"
          placeholder="Message…"
          [(ngModel)]="inputText"
          name="msg"
          [disabled]="sending()"
          autocomplete="off"
        />
        <button type="submit" class="btn btn-primary" [disabled]="sending() || !inputText.trim()">
          {{ sending() ? '…' : 'Send' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .chat-shell {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 49px);
    }
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .empty {
      color: var(--text-muted);
      text-align: center;
      margin-top: 2rem;
      font-size: 0.9rem;
    }
    .bubble-wrap {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .bubble-wrap.own {
      align-items: flex-end;
    }
    .sender {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-bottom: 0.2rem;
      padding: 0 0.2rem;
    }
    .bubble {
      max-width: 65%;
      padding: 0.5rem 0.875rem;
      border-radius: 4px;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 0.9rem;
      line-height: 1.4;
    }
    .bubble.own {
      background: var(--accent);
      color: var(--text-inverse);
      border-color: var(--accent);
    }
    .send-error {
      margin: 0 1.5rem 0.5rem;
    }
    .input-bar {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-top: 1px solid var(--border-strong);
      background: var(--bg);
    }
    .input-bar input {
      flex: 1;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-strong);
      border-radius: 3px;
      background: var(--bg);
      color: var(--text);
      outline: none;
    }
    .input-bar input:focus {
      border-color: var(--text);
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('bottomAnchor') bottomAnchor!: ElementRef;

  conversationId = '';
  messages = signal<MessageRow[]>([]);
  loading = signal(true);
  inputText = '';
  sending = signal(false);
  sendError = signal<string | null>(null);

  private subs: Subscription[] = [];
  private shouldScroll = false;

  constructor(
    private route: ActivatedRoute,
    private chat: ChatService,
    private auth: AuthService,
    private socket: SocketService
  ) {}

  async ngOnInit(): Promise<void> {
    this.conversationId = this.route.snapshot.paramMap.get('id') ?? '';

    // Load history
    const res = await this.chat.getMessages(this.conversationId);
    this.messages.set(res.messages ?? []);
    this.loading.set(false);
    this.shouldScroll = true;

    // Join socket room
    if (!this.socket.isConnected()) {
      // socket will be connected by auth guard flow; just request join
    }
    this.socket.joinConversation(this.conversationId);

    // Listen for incoming messages
    this.subs.push(
      this.socket.message$.subscribe((data: unknown) => {
        const d = data as { message: MessageRow };
        this.messages.update(prev => [...prev, d.message]);
        this.shouldScroll = true;
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.bottomAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  isOwn(msg: MessageRow): boolean {
    return String(msg.sender_id) === String(this.auth.user()?.id);
  }

  async send(): Promise<void> {
    const content = this.inputText.trim();
    if (!content || this.sending()) return;

    this.sendError.set(null);
    this.sending.set(true);
    const res = await this.chat.sendMessage(this.conversationId, content);
    this.sending.set(false);

    if (res.success) {
      this.inputText = '';
    } else {
      this.sendError.set('Failed to send. Please try again.');
    }
  }
}
