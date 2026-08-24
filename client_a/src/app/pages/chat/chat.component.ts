import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import type { MessageRow } from '../../core/models/api.models';

const PAGE_LIMIT = 30;

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="chat-shell">

      <!-- Messages -->
      <div class="messages" #scrollContainer>

        <!-- Load more button -->
        @if (hasMore()) {
          <div class="load-more-wrap">
            <button class="btn load-more-btn" (click)="loadOlder()" [disabled]="loadingMore()">
              {{ loadingMore() ? 'Loading…' : 'Load older messages' }}
            </button>
          </div>
        }

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
        <!-- Hidden file input — images only -->
        <input
          #fileInput
          type="file"
          accept="image/*"
          style="display:none"
          (change)="onFileSelected($event)"
        />
        <button type="button" class="btn clip-btn" (click)="fileInput.click()" [disabled]="sending()" title="Attach image">
          📎
        </button>
        @if (selectedFile()) {
          <span class="file-badge">{{ selectedFile()!.name }}</span>
        }
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
    .load-more-wrap {
      display: flex;
      justify-content: center;
      padding: 0.25rem 0 0.5rem;
    }
    .load-more-btn {
      font-size: 0.8rem;
      color: var(--text-muted);
      background: none;
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 0.3rem 0.75rem;
      cursor: pointer;
    }
    .load-more-btn:hover:not(:disabled) {
      background: var(--bg-subtle);
    }
    .load-more-btn:disabled {
      opacity: 0.5;
      cursor: default;
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
      align-items: center;
    }
    .clip-btn {
      background: none;
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 0.4rem 0.5rem;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      flex-shrink: 0;
    }
    .clip-btn:hover:not(:disabled) {
      background: var(--bg-subtle);
    }
    .file-badge {
      font-size: 0.75rem;
      color: var(--text-muted);
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 0.2rem 0.5rem;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .input-bar input[type="text"] {
      flex: 1;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-strong);
      border-radius: 3px;
      background: var(--bg);
      color: var(--text);
      outline: none;
    }
    .input-bar input[type="text"]:focus {
      border-color: var(--text);
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('bottomAnchor')   bottomAnchor!:   ElementRef<HTMLElement>;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  conversationId = '';
  messages    = signal<MessageRow[]>([]);
  loading     = signal(true);
  loadingMore = signal(false);
  hasMore     = signal(false);
  inputText   = '';
  sending     = signal(false);
  sendError   = signal<string | null>(null);
  otherIsTyping  = signal(false);
  typingUsername = signal<string>('');
  selectedFile   = signal<File | null>(null);

  private cursor: string | undefined = undefined;
  private subs: Subscription[] = [];
  private shouldScroll     = false;
  private shouldKeepScroll = false;
  private scrollHeightBeforeLoad = 0;
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;
  private isTyping = false;

  constructor(
    private route:  ActivatedRoute,
    private chat:   ChatService,
    private auth:   AuthService,
    private socket: SocketService,
    private cdr:    ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.conversationId = this.route.snapshot.paramMap.get('id') ?? '';

    // Initial page — no cursor, server returns newest PAGE_LIMIT messages DESC
    const res = await this.chat.getMessages(this.conversationId, { limit: PAGE_LIMIT });
    const raw = res.messages ?? [];

    // Server returns DESC; reverse to oldest→newest for display
    this.messages.set([...raw].reverse());
    this.hasMore.set(raw.length === PAGE_LIMIT);

    // Cursor = created_at of the oldest message (last item in DESC array)
    if (raw.length > 0) {
      this.cursor = raw[raw.length - 1].created_at;
    }

    this.loading.set(false);
    this.shouldScroll = true;

    this.socket.joinConversation(this.conversationId);

    this.subs.push(
      this.socket.message$.subscribe((data: unknown) => {
        const d = data as { message: MessageRow };
        this.messages.update(prev => [...prev, d.message]);
        this.shouldScroll = true;
      }),

      this.socket.typingStart$.subscribe(event => {
        if (event.conversationId === this.conversationId) {
          const other = this.messages().find(m => m.sender_id !== String(this.auth.user()?.id));
          this.typingUsername.set(other?.sender_username ?? 'Someone');
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

  async loadOlder(): Promise<void> {
    if (this.loadingMore() || !this.hasMore() || !this.cursor) return;

    this.loadingMore.set(true);

    // Snapshot scroll height before prepending so we can restore position
    const el = this.scrollContainer?.nativeElement;
    this.scrollHeightBeforeLoad = el ? el.scrollHeight : 0;
    this.shouldKeepScroll = true;

    const res = await this.chat.getMessages(this.conversationId, {
      cursor: this.cursor,
      limit:  PAGE_LIMIT,
    });
    const raw = res.messages ?? [];

    if (raw.length > 0) {
      // Server returns DESC; reverse to oldest→newest, then prepend to existing list
      const older = [...raw].reverse();
      this.messages.update(prev => [...older, ...prev]);
      this.hasMore.set(raw.length === PAGE_LIMIT);
      // Advance cursor to the oldest message in this batch (last item in DESC array)
      this.cursor = raw[raw.length - 1].created_at;
    } else {
      this.hasMore.set(false);
    }

    this.loadingMore.set(false);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.bottomAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }

    // After prepending older messages, restore scroll position so the view
    // doesn't jump to the top
    if (this.shouldKeepScroll) {
      const el = this.scrollContainer?.nativeElement;
      if (el && el.scrollHeight !== this.scrollHeightBeforeLoad) {
        el.scrollTop = el.scrollHeight - this.scrollHeightBeforeLoad;
        this.shouldKeepScroll = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
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

    if (this.typingTimeout) clearTimeout(this.typingTimeout);

    if (this.inputText.trim().length === 0) {
      this.stopTyping();
      return;
    }

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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    if (file) {
      console.log('Selected file:', file);
    }
    // Reset so the same file can be re-selected if needed
    input.value = '';
  }

  async send(): Promise<void> {
    const content = this.inputText.trim();
    if (!content || this.sending()) return;

    this.stopTyping();
    this.sendError.set(null);
    this.sending.set(true);
    const res = await this.chat.sendMessage(this.conversationId, content, this.selectedFile());
    this.sending.set(false);

    if (res.success) {
      this.inputText = '';
      this.selectedFile.set(null);
    } else {
      this.sendError.set('Failed to send. Please try again.');
    }
  }
}
