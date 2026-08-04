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
        <!-- Typing indicator -->
        @if (otherIsTyping()) {
          <div class="bubble-wrap">
            <span class="sender">{{ typingUsername() }}</span>
            <div class="bubble typing-bubble">
              <span class="dot-pulse"></span>
              <span class="dot-pulse"></span>
              <span class="dot-pulse"></span>
            </div>
          </div>
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
          (input)="onInput()"
          (blur)="onBlur()"
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
    .typing-bubble {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0.5rem 0.75rem;
      min-width: 48px;
    }
    .dot-pulse {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--text-muted);
      animation: pulse 1.2s ease-in-out infinite;
    }
    .dot-pulse:nth-child(2) { animation-delay: 0.2s; }
    .dot-pulse:nth-child(3) { animation-delay: 0.4s; }
    @keyframes pulse {
      0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
      40% { opacity: 1; transform: scale(1); }
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
  otherIsTyping = signal(false);
  typingUsername = signal<string>('');

  private subs: Subscription[] = [];
  private shouldScroll = false;
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;
  private isTyping = false;

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
    this.socket.joinConversation(this.conversationId);

    // Listen for incoming messages
    this.subs.push(
      this.socket.message$.subscribe((data: unknown) => {
        const d = data as { message: MessageRow };
        this.messages.update(prev => [...prev, d.message]);
        this.shouldScroll = true;
      }),

      // Typing indicator — someone else started typing in this conversation
      this.socket.typingStart$.subscribe(event => {
        if (event.conversationId === this.conversationId) {
          const lastMsg = this.messages().find(m => m.sender_id !== String(this.auth.user()?.id));
          this.typingUsername.set(lastMsg?.sender_username ?? 'Someone');
          this.otherIsTyping.set(true);
          this.shouldScroll = true;
        }
      }),

      this.socket.typingStop$.subscribe(event => {
        if (event.conversationId === this.conversationId) {
          this.otherIsTyping.set(false);
        }
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
    // Make sure we stop typing when leaving the chat
    if (this.isTyping) {
      this.socket.emitTypingStop(this.conversationId);
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  onInput(): void {
    if (!this.isTyping && this.inputText.trim().length > 0) {
      this.isTyping = true;
      this.socket.emitTypingStart(this.conversationId);
    }

    // Reset the stop timer on every keystroke
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    if (this.inputText.trim().length === 0) {
      this.stopTyping();
      return;
    }

    // Auto-stop after 2s of inactivity
    this.typingTimeout = setTimeout(() => this.stopTyping(), 2000);
  }

  onBlur(): void {
    this.stopTyping();
  }

  private stopTyping(): void {
    if (this.isTyping) {
      this.isTyping = false;
      this.socket.emitTypingStop(this.conversationId);
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  isOwn(msg: MessageRow): boolean {
    return String(msg.sender_id) === String(this.auth.user()?.id);
  }

  async send(): Promise<void> {
    const content = this.inputText.trim();
    if (!content || this.sending()) return;

    // Stop typing when sending
    this.stopTyping();

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
